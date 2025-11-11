import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { Application } from "../interfaces/application";
import { UtilsService } from "../services/utils-service";

export class InstallPackageDialog {
  private dialog!: Adw.Dialog;
  private progressBarPackage!: Gtk.ProgressBar;
  private buttonInstall!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private packageLabel!: Gtk.Label;
  private utilsService = UtilsService.instance;

  constructor(
    private parentWindow: Adw.ApplicationWindow,
    private pkg: Application
  ) {
    this.setupUI();
  }

  private setupUI(): void {
    const mainBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 12,
    });

    const headerBar = new Adw.HeaderBar({
      title_widget: new Gtk.Label({ label: "Install Application" }),
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

    this.packageLabel = new Gtk.Label({
      label: `You are about to install ${this.pkg.title}.`,
      wrap: true,
      justify: Gtk.Justification.FILL,
    });
    contentBox.append(this.packageLabel);

    this.progressBarPackage = new Gtk.ProgressBar({
      show_text: true,
      fraction: 0,
      text: "Installing...",
    });
    contentBox.append(this.progressBarPackage);

    const buttonBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 12,
      halign: Gtk.Align.END,
      margin_top: 12,
    });

    this.buttonCancel = new Gtk.Button({
      label: "Cancel",
    });
    
    this.buttonCancel.connect("clicked", () => {
      this.dialog.close();
    });

    this.buttonInstall = new Gtk.Button({
      label: "Install",
    });
    this.buttonInstall.add_css_class("suggested-action");
    this.buttonInstall.connect("clicked", () => {
      this.installPackage();
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

  private async installPackage(): Promise<void> {
    this.buttonInstall.set_sensitive(false);

      try {
        await this.executeInstall();
      } catch (error) {
        console.error(`Failed to install ${this.pkg.title}:`, error);
      }

      this.buttonInstall.set_visible(false);
      this.buttonCancel.set_label("Close");
    }

  private async executeInstall(): Promise<void> {
    await this.utilsService.executeCommand(
      this.pkg.packageType === "FLATPAK" ? "flatpak" : "apt",
      this.pkg.packageType === "FLATPAK"
        ? ["install", "-y", this.pkg.packageName]
        : ["install", this.pkg.packageName, "-y"]
    ).then(({ stdout, stderr }) => {
      const iconFile = this.pkg.icon || "";

      if (stderr) {
        this.showMessage(`${this.pkg.title}: ${stderr}`, 'FAILED', iconFile);
      } else {
        this.showMessage(`${this.pkg.title} installed successfully.`, 'SUCCESS', iconFile);
      }
    });
  }

  showMessage(message: string, status: 'FAILED' | 'SUCCESS', iconFile: string) {
    const alertDialog = new Adw.MessageDialog({
      title: status === 'FAILED' ? 'Error' : 'Success',
      body: message,
    });
  }
}
