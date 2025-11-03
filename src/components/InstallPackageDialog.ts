import Adw from "@girs/adw-1";
import Gtk from "@girs/gtk-4.0";
import { Package } from "../interfaces/applications-data";
import { UtilsService } from "../services/UtilsService";

export class InstallPackageDialog {
  private dialog!: Gtk.Dialog;
  private progressBarPackage!: Gtk.ProgressBar;
  private buttonInstall!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private packageLabel!: Gtk.Label;

  constructor(
    private parentWindow: Adw.ApplicationWindow,
    private pkg: Package
  ) {
    this.setupUI();
  }

  private setupUI(): void {
    this.dialog = new Gtk.Dialog({
      title: "Install Application",
      height_request: Gtk.Orientation.VERTICAL,
      width_request: 700,
      transient_for: this.parentWindow,
      modal: true,
    });

    const contentArea = this.dialog.get_content_area();
    contentArea.set_margin_top(24);
    contentArea.set_margin_bottom(24);
    contentArea.set_margin_start(24);
    contentArea.set_margin_end(24);

    this.packageLabel = new Gtk.Label({
      label: `You are about to install ${this.pkg.title}.`,
      wrap: true,
      justify: Gtk.Justification.FILL,
    });
    contentArea.append(this.packageLabel);

      this.progressBarPackage = new Gtk.ProgressBar({
        margin_top: 12,
        show_text: true,
        fraction: 0,
        text: "Installing...",
      });
      contentArea.append(this.progressBarPackage);

    this.dialog.connect("response", (dialog, response) => {
      if (response === Gtk.ResponseType.ACCEPT) {
        this.installPackage();
      } else {
        this.dialog.close();
      }
    });

    this.buttonInstall = this.dialog.add_button(
      "Install",
      Gtk.ResponseType.ACCEPT,
    ) as Gtk.Button;
    
    this.buttonCancel = this.dialog.add_button(
      "Cancel",
      Gtk.ResponseType.CANCEL
    ) as Gtk.Button;

    this.dialog.present();
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
    await UtilsService.executeCommand(
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
    const alertDialog = new Adw.AlertDialog({
      title: status === 'FAILED' ? 'Error' : 'Success',
      body: message,
    })
  }
}
