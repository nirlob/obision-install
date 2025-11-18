import Adw from '@girs/adw-1';
import Gtk from '@girs/gtk-4.0';
import { UtilsService } from '../services/utils-service';
import { InstallApplicationData } from '../interfaces/install-application';

export class InstallDialog {
  private dialog!: Adw.Dialog;
  private progressBar!: Gtk.ProgressBar;
  private btnAddRemove!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private utilsService = UtilsService.instance;
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
        height_request: installApplicationsData.length === 1 ? 96 : 193,
      });

      const listBox = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.NONE,
        css_classes: ['boxed-list'],
      });

      installApplicationsData.forEach(async appData => {
        const row = new Adw.ActionRow();
        row.set_title(appData.application.title);
        row.set_subtitle(appData.application.description || '');
        row.set_subtitle_lines(3);
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
          this.executeInstall(appData).then(() => {
            console.log(`Finished installation for: ${appData.application.title}`);
            this.setSuffixToRow(appData.row!);
          }).catch((error) => {
            console.log(`Installation failed for: ${appData.application.title}, error: ${error} `);
            this.setSuffixToRow(appData.row!, true);
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
        this.createFolders();
      }
      this.buttonCancel.set_sensitive(true);
      if (this.applicationsInstalledCallback) {
        this.applicationsInstalledCallback();
      };
    });

    console.log('All installations processed.');
  }

  private createFolders() {
    throw new Error('Method not implemented.');
  }

  private executeInstall(appData: InstallApplicationData): Promise<{ stdout: string; stderr: string }> {
    const operation = appData.install ? 'install' : appData.application.packageType === 'FLATPAK' ? 'uninstall' : 'remove';

    console.log(`Executing ${operation} for: ${appData.application.title}`);

    return this.utilsService.executeCommandAsync(appData.application.packageType === 'FLATPAK' ? 'flatpak' : 'apt', [operation, '-y', appData.application.packageName]);
  }

  public setApplicationsInstalledCallback(callback: () => void): void {
    this.applicationsInstalledCallback = callback;
  }

  private setSuffixToRow(row: Adw.ActionRow, error: boolean = false): void {
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

      if (error) {
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
