import Adw from '@girs/adw-1';
import Gtk from '@girs/gtk-4.0';
import Gio from '@girs/gio-2.0';
import { UtilsService } from '../services/utils-service';
import { InstallApplicationData } from '../interfaces/install-application';
import { DataService } from '../services/data-service';

export class InstallDialog {
  private dialog!: Adw.Dialog;
  private progressBar!: Gtk.ProgressBar;
  private btnAddRemove!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private utilsService = UtilsService.instance;
  private dataService = DataService.instance;
  private applicationsInstalledCallback: (() => void) | null = null;

  constructor(
    private parentWindow: Adw.ApplicationWindow, 
    private installApplicationsData: InstallApplicationData[],
    private installInFolder: boolean
  ) {
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
    let promises: Promise<void>[] = [];

    this.btnAddRemove.set_visible(false);
    this.buttonCancel.set_label('Close');
    this.buttonCancel.set_sensitive(false);

    this.installApplicationsData.forEach(appData => {
      try {
        this.setSuffixToRow(appData.row!);
        console.log(`Starting installation for: ${appData.application.title}`);

        promises.push(
          this.executeInstall(appData).then(({stdout, stderr}) => {
            console.log(`Finished installation for: ${appData.application.title}`);
            this.setSuffixToRow(appData.row!, stderr);
          }).catch((error) => {
            console.log(`Installation failed for: ${appData.application.title}, error: ${error} `);
            this.setSuffixToRow(appData.row!, error.toString());
          }).finally(() => {
            const fraction = index++ / this.installApplicationsData.length;
            this.progressBar.set_fraction(fraction);
          })
        );
      } catch (error) {
        console.error(`Failed to install ${appData.application.title}:`, error);
      }
    });

    Promise.allSettled(promises).then(results => {
      if (this.installInFolder) {
        console.log('Generating application folders...');
        this.createDesktopFolders();
      }
      
      this.buttonCancel.set_sensitive(true);

      this.removeUninstalledAppsFromDesktopFolders();

      if (this.applicationsInstalledCallback) {
        this.applicationsInstalledCallback();
      };
    });

    console.log('All installations processed.');
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
          path: folderPath
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
          console.log(`Removed empty app folder: ${category.title}`);
        }
        
        console.log(`Removed ${existingApps.length - updatedApps.length} uninstalled apps from folder: ${category.title}`);
      });

      console.log('Uninstalled applications removed from folders successfully');
    } catch (error) {
      console.error('Error removing uninstalled applications from folders:', error);
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
          path: folderPath
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

        console.log(`Created/Updated app folder: ${folderName} with ${mergedApps.length} apps (${appIds.length} newly installed)`);
      });

      // Update folder-children with new folders
      if (newFolders.length > 0) {
        const updatedFolders = [...currentFolders, ...newFolders];
        settings.set_strv('folder-children', updatedFolders);
        console.log(`Added ${newFolders.length} new app folders to GNOME Shell`);
      } else {
        console.log('Updated existing app folders with newly installed applications');
      }

      console.log('Application folders synchronized successfully');
    } catch (error) {
      console.error('Error creating application folders:', error);
      // Don't throw - this is not critical for installation
    }
  }

  private executeInstall(appData: InstallApplicationData): Promise<{ stdout: string; stderr: string }> {
    const operation = appData.install ? 'install' : appData.application.packageType === 'FLATPAK' ? 'uninstall' : 'remove';

    console.log(`Executing ${operation} for: ${appData.application.title}`);

    return this.utilsService.executeCommandAsync(appData.application.packageType === 'FLATPAK' ? 'flatpak' : 'apt', [operation, '-y', appData.application.packageName]);
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
