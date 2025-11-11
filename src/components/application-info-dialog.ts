import Adw from "@girs/adw-1";
import { Application } from "../interfaces/application";
import Gtk from "@girs/gtk-4.0";
import { UtilsService } from "../services/utils-service";

export class ApplicationInfoDialog {
  private propertiesList!: Gtk.ListBox;
  private utilsService = UtilsService.instance;

  constructor(
    private parentWindow: Adw.ApplicationWindow,
    private pkg: Application
  ) {
    this.createDialog();
    this.loadProperties();
  }

  private createDialog(): void {
    const dialog = new Gtk.Dialog({
      transient_for: this.parentWindow,
      modal: true,
      title: this.pkg.title,
      width_request: 700,
      default_width: 700,
    });

    const contentArea = dialog.get_content_area();
    contentArea.set_margin_top(24);
    contentArea.set_margin_bottom(24);
    contentArea.set_margin_start(24);
    contentArea.set_margin_end(24);

    const packageBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 24,
      hexpand: true,
    });
    contentArea.append(packageBox);

    const image = new Gtk.Image({
        pixel_size: 64,
        file: this.pkg.icon || "",
        halign: Gtk.Align.START,
    });
    packageBox.append(image);

    const descriptionLabel = new Gtk.Label({
      label: this.pkg.description || "No description available.",
      wrap: true,
      justify: Gtk.Justification.FILL,
      hexpand: true,
    });
    packageBox.append(descriptionLabel);

    dialog.add_button("Close", Gtk.ResponseType.CLOSE);
    dialog.connect("response", () => {
      dialog.destroy();
    });

    const expander = new Gtk.Expander({
        label: "Advanced information",
        margin_top: 24,
    });

    const propertiesScrolledWindow = new Gtk.ScrolledWindow({
      height_request: 200,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
      margin_top: 12,
    });

    this.propertiesList = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ["boxed-list"],
    });

    propertiesScrolledWindow.set_child(this.propertiesList);
    expander.set_child(propertiesScrolledWindow);
    contentArea.append(expander);

    dialog.show();
  }

  private loadProperties() : void {
    try {
      this.utilsService.executeCommand(
        this.pkg.packageType === "FLATPAK" ? "flatpak" : "apt",
        this.pkg.packageType === "FLATPAK"
          ? ["remote-info", "flathub",this.pkg.packageName]
          : ["show", this.pkg.packageName]
      ).then(({ stdout, stderr }) => {
        const labels = stdout.split("\n");
        labels.forEach((line) => {
            // if (line.trim() === "") return;

          const row = new Gtk.ListBoxRow({
            activatable: false,
          });
        //   const hbox = new Gtk.Box({
        //     orientation: Gtk.Orientation.HORIZONTAL,
        //     spacing: 12,
        //     margin_top: 6,
        //     margin_bottom: 6,
        //     margin_start: 6,
        //     margin_end: 6,
        //   });

          const label = new Gtk.Label({
            label: line.trim(),
            wrap: true,
            xalign: 0,
          });

        //   hbox.append(label);
        //   row.set_child(hbox);
          row.set_child(label);
          this.propertiesList.append(row);
        });
      });
    } catch (error: any) {
      console.error("Error loading properties:", error);
    }
  }
}
