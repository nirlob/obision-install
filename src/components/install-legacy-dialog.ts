import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import Gtk from "@girs/gtk-4.0";
import { Application } from "../interfaces/application";
import { UtilsService } from "../services/utils-service";

export class InstallDialog {
  private dialog!: Gtk.Dialog;
  private progressBarApplication!: Gtk.ProgressBar;
  private buttonInstall!: Gtk.Button;
  private buttonCancel!: Gtk.Button;
  private packagesLabel!: Gtk.Label;
  private messagesScrolledWindow!: Gtk.ScrolledWindow;
  private messagesList!: Gtk.ListBox;

  constructor(
    private parentWindow: Adw.ApplicationWindow,
    private packages: Application[]
  ) {
    this.createDialog();
  }

  private createDialog(): void {
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

    this.packagesLabel = new Gtk.Label({
      label:
        this.packages.length > 1
          ? `You are about to install ${this.packages.length} package(s).`
          : `You are about to install ${this.packages[0].title}.`,
      wrap: true,
      justify: Gtk.Justification.FILL,
    });
    contentArea.append(this.packagesLabel);

    if (this.packages.length > 1) {
      this.progressBarApplication = new Gtk.ProgressBar({
        margin_top: 12,
        show_text: true,
        fraction: 0,
        text: "Installing...",
      });
      contentArea.append(this.progressBarApplication);
    }

    this.messagesScrolledWindow = new Gtk.ScrolledWindow({
      height_request: 200,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
      margin_top: 12,
    });

    this.messagesList = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ["boxed-list"],
    });
    this.messagesScrolledWindow.set_child(this.messagesList);
    contentArea.append(this.messagesScrolledWindow);

    this.dialog.connect("response", (dialog, response) => {
      if (response === Gtk.ResponseType.ACCEPT) {
        this.installApplications();
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

  private async installApplications(): Promise<void> {
    this.buttonInstall.set_sensitive(false);

    if (this.packages.length > 1) {
      this.progressBarApplication.show();
    }

    for (const pkg of this.packages) {
      try {
        await this.installApplication(pkg);
      } catch (error) {
        console.error(`Failed to install ${pkg.title}:`, error);
        // this.errorsBox.append(
        //   new Gtk.Label({
        //     label: `Failed to install ${pkg.title}: ${error.message}`,
        //     wrap: true,
        //     justify: Gtk.Justification.FILL,
        //   })
        // );
      }

      this.buttonInstall.set_visible(false);
      this.buttonCancel.set_label("Close");
    }
  }

  private async installApplication(pkg: Application): Promise<void> {
    await UtilsService.executeCommand(
      pkg.packageType === "FLATPAK" ? "flatpak" : "apt",
      pkg.packageType === "FLATPAK"
        ? ["install", "-y", pkg.packageName]
        : ["install", pkg.packageName, "-y"]
    ).then(({ stdout, stderr }) => {
      const iconFile = pkg.icon || "";

      if (stderr) {
        this.addMessage(`${pkg.title}: ${stderr}`, 'FAILED', iconFile);
      } else {
        this.addMessage(`${pkg.title} installed successfully.`, 'SUCCESS', iconFile);
      }
    });
  }

  private addMessage(message: string, status: 'FAILED' | 'SUCCESS' | 'WARNING', iconFile: string): void {
    const row = new Gtk.ListBoxRow();

    const box = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 16,
      margin_top: 12,
      margin_bottom: 12,
      margin_start: 12,
      margin_end: 12,
    });

    let iconName = "dialog-information-symbolic";
    if (status === 'FAILED') {
      iconName = "dialog-error-symbolic";
    } else if (status === 'WARNING') {
      iconName = "dialog-warning-symbolic";
    }

    const iconApp = new Gtk.Image({
      file: iconFile,
      halign: Gtk.Align.START,
      pixel_size: 50,
    });

    const iconImage = new Gtk.Image({
      icon_name: iconName,
      halign: Gtk.Align.END,
      pixel_size: 32,
    });

    const labelBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      hexpand: true,
      halign: Gtk.Align.FILL,
    });

    const label = new Gtk.Label({
      label: message,
      wrap: true,
    });

    labelBox.append(label);

    box.append(iconApp);
    box.append(labelBox);
    box.append(iconImage);

    row.set_child(box);

    this.messagesList.append(row);
  }
}
