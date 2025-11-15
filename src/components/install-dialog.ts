import Adw from '@girs/adw-1';
import Gtk from '@girs/gtk-4.0';
import { Application } from '../interfaces/application';
import { UtilsService } from '../services/utils-service';
import { InstallApplicationData } from '../interfaces/install-application';

export class InstallDialog {
  private dialog!: Adw.Dialog;
  private progressBarApplication!: Gtk.ProgressBar;
  private buttonInstall!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private applicationLabel!: Gtk.Label;
  private utilsService = UtilsService.instance;

  constructor(private parentWindow: Adw.ApplicationWindow, private installApplicationsData: InstallApplicationData[]) {
    this.setupUI();
  }

  private setupUI(): void {
    const mainBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 12,
    });

    const headerBar = new Adw.HeaderBar({
      title_widget: new Gtk.Label({ label: 'Install Application' }),
    });
    mainBox.append(headerBar);

    const contentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      margin_top: 24,
      margin_bottom: 24,
      margin_start: 24,
      margin_end: 24,
      spacing: 12,
    });
    mainBox.append(contentBox);

    this.applicationLabel = new Gtk.Label({
      label: `You are about to install ${this.installApplicationsData[0].application.title}.`,
      wrap: true,
      justify: Gtk.Justification.FILL,
    });
    contentBox.append(this.applicationLabel);

    contentBox.append(this.loadApplicationsListbox(true));
    contentBox.append(this.loadApplicationsListbox(false));

    this.progressBarApplication = new Gtk.ProgressBar({
      show_text: true,
      fraction: 0,
    });
    contentBox.append(this.progressBarApplication);

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

    this.buttonInstall = new Gtk.Button({
      label: 'Install',
    });
    this.buttonInstall.add_css_class('suggested-action');
    this.buttonInstall.connect('clicked', () => {
      this.installApplications();
    });

    buttonBox.append(this.buttonCancel);
    buttonBox.append(this.buttonInstall);
    contentBox.append(buttonBox);

    this.dialog = new Adw.Dialog({
      child: mainBox,
      width_request: 700,
    });

    this.dialog.present(this.parentWindow);
  }

  private loadApplicationsListbox(install: boolean): Gtk.ScrolledWindow {
    const scrolledWindow = new Gtk.ScrolledWindow({
      hexpand: true,
      vexpand: true,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
      height_request: 200,
    });

    const installApplicationsData = this.installApplicationsData.filter(installApp => installApp.install === install);

    if (installApplicationsData.length === 0) {
      const emptyLabel = new Gtk.Label({
        label: install ? 'No applications selected for installation.' : 'No applications selected to skip installation.',
        margin_top: 12,
        margin_bottom: 12,
        margin_start: 12,
        margin_end: 12,
        justify: Gtk.Justification.CENTER,
        css_classes: ['boxed-list'],
      });
  
      scrolledWindow.set_child(emptyLabel);
    } else {
      const listBox = new Gtk.ListBox({
        selection_mode: Gtk.SelectionMode.NONE,
        css_classes: ['boxed-list'],
      });

      installApplicationsData.forEach(async appData => {
          const row = new Adw.ActionRow();
          row.set_title(appData.application.title);
          row.set_subtitle(appData.application.description || '');
          row.add_prefix(
            new Gtk.Image({
              file: appData.application.icon,
              pixel_size: 64,
            })
          );
          listBox.append(row);
        });

      scrolledWindow.set_child(listBox);
    }

    return scrolledWindow;
  }

  private async installApplications(): Promise<void> {
    this.buttonInstall.set_sensitive(false);

    this.installApplicationsData
      .filter(installApp => installApp.install === true)
      .forEach(async appData => {
        try {
          await this.executeInstall(appData.application);
        } catch (error) {
          console.error(`Failed to install ${appData.application.title}:`, error);
        }
      });

    this.buttonInstall.set_visible(false);
    this.buttonCancel.set_label('Close');
  }

  private async executeInstall(app: Application): Promise<void> {
    console.log(`Starting installation for: ${app.title}`);
    // await this.utilsService.executeCommand(
    //   this.installApplicationsData.packageType === "FLATPAK" ? "flatpak" : "apt",
    //   this.installApplicationsData.packageType === "FLATPAK"
    //     ? ["install", "-y", this.installApplicationsData.packageName]
    //     : ["install", this.installApplicationsData.packageName, "-y"]
    // ).then(({ stdout, stderr }) => {
    //   const iconFile = this.installApplicationsData.icon || "";
    //   if (stderr) {
    //     this.showMessage(`${this.installApplicationsData.title}: ${stderr}`, 'FAILED', iconFile);
    //   } else {
    //     this.showMessage(`${this.installApplicationsData.title} installed successfully.`, 'SUCCESS', iconFile);
    //   }
    // });
  }

  showMessage(message: string, status: 'FAILED' | 'SUCCESS', iconFile: string) {
    const alertDialog = new Adw.MessageDialog({
      title: status === 'FAILED' ? 'Error' : 'Success',
      body: message,
    });
  }
}
