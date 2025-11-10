import Gtk from "@girs/gtk-4.0";
import Pango from "@girs/pango-1.0";
import { Category } from "../interfaces/category";

export class CategoryRow {
  private row!: Gtk.ListBoxRow;

  constructor(
    private category: Category,
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
      file: this.category.icon,
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
      label: `<span weight="bold">${this.category.title}</span>`,
      use_markup: true,
      halign: Gtk.Align.START,
    });

    // Description and app count
    const descBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
    });

    const descLabel = new Gtk.Label({
      label: this.category.description,
      halign: Gtk.Align.START,
      hexpand: true,
      css_classes: ["dim-label"],
      ellipsize: Pango.EllipsizeMode.END,
      tooltip_text: this.category.description,
    });

    descBox.append(descLabel);

    contentBox.append(titleLabel);
    contentBox.append(descBox);

    box.append(iconImage);
    box.append(contentBox);

    // Store category data in the row for later retrieval
    (this.row as any).category = this.category;

    this.row.set_child(box);
  }

  public getWidget(): Gtk.ListBoxRow {
    return this.row;
  }
}
