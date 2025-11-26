import Adw from '@girs/adw-1';
import Gtk from '@girs/gtk-4.0';
import Gio from '@girs/gio-2.0';
import { UtilsService } from '../services/utils-service';
import { InstallApplicationData } from '../interfaces/install-application';
import { DataService } from '../services/data-service';
import GLib from '@girs/glib-2.0';
import { LoggerService } from '../services/logger-service';

export class InstallDialog {
  private dialog!: Adw.Dialog;
  private progressBar!: Gtk.ProgressBar;
  private btnAddRemove!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private utilsService = UtilsService.instance;
  private dataService = DataService.instance;
  private logger = LoggerService.instance;
  private applicationsInstalledCallback: (() => void) | null = null;

  constructor(private parentWindow: Adw.ApplicationWindow, private installApplicationsData: InstallApplicationData[], private installInFolder: boolean) {
    this.setupUI();
  }

  private setupUI(): void {
    const mainBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 12,
    });

    const headerBar = new Adw.HeaderBar({
      title_widget: new Gtk.Label({ label: 'Add/Remove Applications' }),
    });
    mainBox.append(headerBar);

    const contentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      margin_bottom: 24,
      margin_start: 24,
      margin_end: 24,
      spacing: 12,
    });
    mainBox.append(contentBox);

    this.loadApplicationsListbox(contentBox, true);
    this.loadApplicationsListbox(contentBox, false);

    this.progressBar = new Gtk.ProgressBar({
      show_text: true,
      fraction: 0,
    });
    contentBox.append(this.progressBar);

    const buttonBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 12,
      halign: Gtk.Align.END,
      margin_top: 12,
    });

    this.buttonCancel = new Gtk.Button({
      label: 'Cancel',
    });

    this.buttonCancel.connect('clicked', () => {
      this.dialog.close();
    });

    this.btnAddRemove = new Gtk.Button({
      label: 'Add/Remove',
    });
    this.btnAddRemove.add_css_class('suggested-action');
    this.btnAddRemove.connect('clicked', () => {
      this.installApplications();
    });

    buttonBox.append(this.buttonCancel);
    buttonBox.append(this.btnAddRemove);
    contentBox.append(buttonBox);

    this.dialog = new Adw.Dialog({
      child: mainBox,
      width_request: 700,
      can_close: true,
    });

    this.dialog.present(this.parentWindow);
  }

  private loadApplicationsListbox(contentBox: Gtk.Box, install: boolean): void {
    const installApplicationsData = this.installApplicationsData.filter(installApp => installApp.install === install);

    if (installApplicationsData.length > 0) {
      const applicationsLabel = new Gtk.Label({
        label: `You are about to ${install ? 'add' : 'remove'} ${installApplicationsData.length} application(s).`,
        wrap: true,
        justify: Gtk.Justification.FILL,
      });
      contentBox.append(applicationsLabel);

      const scrolledWindow = new Gtk.ScrolledWindow({
        vexpand: true,
        hscrollbar_policy: Gtk.PolicyType.NEVER,
        vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
        height_request: installApplicationsData.length > 1 ? 140 : 70,
      });

      const listBox = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.NONE,
        css_classes: ['boxed-list'],
      });

      installApplicationsData.forEach(async appData => {
        const row = new Adw.ActionRow({
          title: appData.application.title,
          subtitle: appData.application.description || '',
          subtitle_lines: 2,
        });

        row.add_prefix(
          new Gtk.Image({
            file: appData.application.icon,
            pixel_size: 64,
          })
        );

        appData.row = row;
        listBox.append(row);
      });

      scrolledWindow.set_child(listBox);
      contentBox.append(scrolledWindow);
    }
  }

  private installApplications(): void {
    let index = 1;
    let completed = 0;
    const installApplicationsCount = this.installApplicationsData.length;

    this.btnAddRemove.set_visible(false);
    this.buttonCancel.set_label('Close');
    this.buttonCancel.set_sensitive(false);

    this.logger.info('Beginning installation of applications', { count: this.installApplicationsData.length });

    this.installApplicationsData.forEach(appData => {
      this.setSuffixToRow(appData.row!);

      GLib.timeout_add(GLib.PRIORITY_DEFAULT, 100, () => {
        const operation = appData.install ? 'install' : appData.application.packageType === 'FLATPAK' ? 'uninstall' : 'remove';
        this.logger.info(`Executing ${operation}`, { app: appData.application.title, packageType: appData.application.packageType });

        const process = new Gio.Subprocess({
          argv: [appData.application.packageType === 'FLATPAK' ? 'flatpak' : 'apt', operation, '-y', appData.application.packageName],
          flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        process.init(null);

        process.communicate_utf8_async(null, null, (proc: any, res: any) => {
          try {
            const [ok, stdout, stderr] = proc.communicate_utf8_finish(res);
            
            if (ok) {
              this.logger.info('Installation completed successfully', { app: appData.application.title });
              this.setSuffixToRow(appData.row!, stderr.trim());
            } else {
              this.logger.error(`Failed to ${appData.install ? 'install' : 'remove'}`, { app: appData.application.title });
            }
          } catch (error) {
            this.logger.error(`Exception during ${appData.install ? 'installation' : 'removal'}`, { app: appData.application.title, error: String(error) });
          } finally {
            this.logger.debug('Finished processing application', { app: appData.application.title });

            const fraction = index++ / installApplicationsCount;
            this.progressBar.set_fraction(fraction);

            completed++;

            if (completed === installApplicationsCount) {
              if (this.installInFolder) {
                this.logger.info('Generating application folders for installed apps');
                this.createDesktopFolders();
              }

              this.buttonCancel.set_sensitive(true);

              this.removeUninstalledAppsFromDesktopFolders();
              if (this.applicationsInstalledCallback) {
                this.applicationsInstalledCallback();
              }
            }
          }
        });

        return GLib.SOURCE_REMOVE;
      });
    });
  }

  private removeUninstalledAppsFromDesktopFolders(): void {
    try {
      const categories = this.dataService.getCategories();
      const settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.app-folders' });
      const currentFolders = settings.get_strv('folder-children');

      // Group uninstalled applications by category
      const uninstalledAppsByCategory = new Map<number, string[]>();

      this.installApplicationsData.forEach(appData => {
        if (!appData.install && appData.application.categoryId) {
          const categoryId = appData.application.categoryId;
          if (!uninstalledAppsByCategory.has(categoryId)) {
            uninstalledAppsByCategory.set(categoryId, []);
          }

          // Generate desktop file ID based on package name
          let desktopFileId = appData.application.packageName;
          if (!desktopFileId.endsWith('.desktop')) {
            desktopFileId += '.desktop';
          }

          uninstalledAppsByCategory.get(categoryId)!.push(desktopFileId);
        }
      });

      // Remove uninstalled apps from their respective folders
      categories.forEach(category => {
        const uninstalledAppIds = uninstalledAppsByCategory.get(category.id);

        // Skip if no apps were uninstalled for this category
        if (!uninstalledAppIds || uninstalledAppIds.length === 0) {
          return;
        }

        const folderId = category.title.replace(/\s+/g, '-');

        // Check if folder exists
        if (!currentFolders.includes(folderId)) {
          return;
        }

        // Get folder settings
        const folderPath = `/org/gnome/desktop/app-folders/folders/${folderId}/`;
        const folderSettings = new Gio.Settings({
          schema_id: 'org.gnome.desktop.app-folders.folder',
          path: folderPath,
        });

        // Get existing apps in this folder
        const existingApps = folderSettings.get_strv('apps');

        // Remove uninstalled apps from the folder
        const updatedApps = existingApps.filter(appId => !uninstalledAppIds.includes(appId));

        // Update the folder with remaining apps
        folderSettings.set_strv('apps', updatedApps);

        if (updatedApps.length === 0) {
          // If no apps remain, remove the folder from folder-children
          const updatedFolders = currentFolders.filter(folder => folder !== folderId);
          settings.set_strv('folder-children', updatedFolders);
          this.logger.info('Removed empty app folder', { category: category.title });
        }

        this.logger.info('Removed uninstalled apps from folder', { folder: category.title, removedCount: existingApps.length - updatedApps.length });
      });

      this.logger.info('Uninstalled applications removed from folders successfully');
    } catch (error) {
      this.logger.error('Error removing uninstalled applications from folders', { error: String(error) });
    }
  }

  private createDesktopFolders(): void {
    try {
      const categories = this.dataService.getCategories();

      // Get or create the app-folders settings
      const settings = new Gio.Settings({ schema_id: 'org.gnome.desktop.app-folders' });

      // Get current folder-children list
      const currentFolders = settings.get_strv('folder-children');
      const newFolders: string[] = [];

      // Group installed applications by category
      const installedAppsByCategory = new Map<number, string[]>();

      this.installApplicationsData.forEach(appData => {
        if (appData.install && appData.application.categoryId) {
          const categoryId = appData.application.categoryId;
          if (!installedAppsByCategory.has(categoryId)) {
            installedAppsByCategory.set(categoryId, []);
          }

          // Generate desktop file ID based on package name
          let desktopFileId = appData.application.packageName;
          if (!desktopFileId.endsWith('.desktop')) {
            desktopFileId += '.desktop';
          }

          installedAppsByCategory.get(categoryId)!.push(desktopFileId);
        }
      });

      // Create folders for categories that have installed apps
      categories.forEach(category => {
        const appIds = installedAppsByCategory.get(category.id);

        // Only create folder if there are apps for this category
        if (!appIds || appIds.length === 0) {
          return;
        }

        const folderId = category.title.replace(/\s+/g, '-');
        const folderName = category.title;

        // Add folder to list if not already present
        if (!currentFolders.includes(folderId)) {
          newFolders.push(folderId);
        }

        // Create settings path for this specific folder
        const folderPath = `/org/gnome/desktop/app-folders/folders/${folderId}/`;
        const folderSettings = new Gio.Settings({
          schema_id: 'org.gnome.desktop.app-folders.folder',
          path: folderPath,
        });

        // Set folder name (displayed in GNOME Shell)
        folderSettings.set_string('name', folderName);

        // Get existing apps in this folder
        const existingApps = folderSettings.get_strv('apps');

        // Merge with newly installed apps (avoid duplicates)
        const mergedApps = [...new Set([...existingApps, ...appIds])];

        // Set the applications that belong to this folder
        folderSettings.set_strv('apps', mergedApps);

        // Set translate to false to use literal name
        folderSettings.set_boolean('translate', false);

        this.logger.info('Created/Updated app folder', { folder: folderName, totalApps: mergedApps.length, newApps: appIds.length });
      });

      // Update folder-children with new folders
      if (newFolders.length > 0) {
        const updatedFolders = [...currentFolders, ...newFolders];
        settings.set_strv('folder-children', updatedFolders);
        this.logger.info('Added new app folders to GNOME Shell', { count: newFolders.length });
      } else {
        this.logger.info('Updated existing app folders with newly installed applications');
      }

      this.logger.info('Application folders synchronized successfully');
    } catch (error) {
      this.logger.error('Error creating application folders', { error: String(error) });
      // Don't throw - this is not critical for installation
    }
  }

  public setApplicationsInstalledCallback(callback: () => void): void {
    this.applicationsInstalledCallback = callback;
  }

  private setSuffixToRow(row: Adw.ActionRow, error: string = ''): void {
    const suffix = (row as any).spinnerWidget;
    if (!suffix) {
      const spinner = new Adw.Spinner({
        width_request: 32,
        height_request: 32,
      });

      row.add_suffix(spinner);
      (row as any).spinnerWidget = spinner;
    } else {
      const spinner = suffix as Adw.Spinner;
      row.remove(spinner);

      const image = new Gtk.Image({
        icon_size: Gtk.IconSize.LARGE,
      });

      if (error.length > 0) {
        image.set_tooltip_text(error);
        image.set_from_icon_name('process-stop');
        image.add_css_class('error');
      } else {
        image.set_from_icon_name('object-select');
        image.add_css_class('success');
      }

      row.add_suffix(image);
    }
  }
}
