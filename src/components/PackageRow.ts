import Gtk from "@girs/gtk-4.0";
import { Package } from "../interfaces/applications-data";
import Pango from "@girs/pango-1.0";

export class PackageRow {
  private row!: Gtk.ListBoxRow;
  private installCallback: (() => void) | null = null;

  constructor(
    private packageData: Package,
    private showInstallButton: boolean = true,
    private packageInstalled: boolean = false
  ) {
    this.setupUI();
  }

  private async setupUI(): Promise<void> {
    this.row = new Gtk.ListBoxRow({
      activatable: true,
    });

    const box = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 16,
      margin_top: 12,
      margin_bottom: 12,
      margin_start: 12,
      margin_end: 12,
    });

    const iconImage = new Gtk.Image({
      file: this.packageData.icon,
      pixel_size: 64,
    });

    // Content box
    const contentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 4,
      hexpand: true,
    });

    // Title
    const titleLabel = new Gtk.Label({
      label: `<span weight="bold">${this.packageData.title}</span>`,
      use_markup: true,
      halign: Gtk.Align.START,
    });

    // Description and app count
    const descBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
    });

    const descLabel = new Gtk.Label({
      label: this.packageData.description,
      halign: Gtk.Align.START,
      hexpand: true,
      css_classes: ["dim-label"],
      ellipsize: Pango.EllipsizeMode.END,
      tooltip_text: this.packageData.description,
    });

    descBox.append(descLabel);

    if (this.showInstallButton) {
      const installButton = new Gtk.Button({
        label: "Install",
        halign: Gtk.Align.END,
        css_classes: ["suggested-action"],
      });

      installButton.set_sensitive(!this.packageInstalled);

      installButton.connect("clicked", () => {
        if (this.installCallback) {
          this.installCallback();
        }
      });

      descBox.append(installButton);
    }

    contentBox.append(titleLabel);
    contentBox.append(descBox);

    box.append(iconImage);
    box.append(contentBox);

    // Store package data in the row for later retrieval
    (this.row as any).packageData = this.packageData;

    this.row.set_child(box);
  }

  public setInstallCallback(callback: () => void): void {
    this.installCallback = callback;
  }

  public getWidget(): Gtk.ListBoxRow {
    return this.row;
  }
}
