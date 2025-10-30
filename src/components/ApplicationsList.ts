import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";
import Pango from "@girs/pango-1.0";
import Gio from "@girs/gio-2.0";
import { ApplicationsData, Package } from "../interfaces/applications-data.js";
import { InstallDialog } from "./InstallDialog.js";
import { UtilsService } from "../services/UtilsService.js";

// ApplicationData interface for UI display
export interface ApplicationData {
  icon: string;
  title: string;
  description: string;
  packageName: string;
}

export class ApplicationsList {
  private listbox!: Gtk.ListBox;
  private scrolledWindow!: Gtk.ScrolledWindow;
  private packages: Package[] = [];

  constructor(private parentWindow: Adw.ApplicationWindow) {
    this.setupUI();
    this.loadPackagesFromJson();
    this.loadApplicationsFromJson();
  }

  private setupUI(): void {
    // Create scrolled window
    this.scrolledWindow = new Gtk.ScrolledWindow({
      hexpand: true,
      vexpand: true,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    });

    // Create listbox
    this.listbox = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ["boxed-list"],
    });

    // Connect row activation
    this.listbox.connect(
      "row-activated",
      (listbox: Gtk.ListBox, row: Gtk.ListBoxRow) => {
        const applicationData = this.getApplicationDataFromRow(row);
        this.showApplicationDetailsFromData(applicationData);
      }
    );

    this.scrolledWindow.set_child(this.listbox);
  }

  private loadApplicationsFromJson(): void {
    console.log("🔍 Starting to load applications from JSON");
    try {
      // Load applications data from applications.json
      const applicationsFile = Gio.File.new_for_path(
        "./data/json/applications.json"
      );
      const [success, contents] = applicationsFile.load_contents(null);

      if (!success) {
        console.error("Could not load applications.json");
        return;
      }

      const applicationsData: ApplicationsData = JSON.parse(
        new TextDecoder().decode(contents)
      );

      // Clear existing applications and load only from applications.json applications
      this.clearApplications();

      this.loadApplicationsFromApplicationsData(applicationsData);
    } catch (error) {
      console.error("Error loading JSON data:", error);
    }
  }

  private loadPackagesFromJson(): void {
    console.log("🔍 Starting to load packages from JSON");
    try {
      // Load applications data from applications.json
      const packagesFile = Gio.File.new_for_path("./data/json/applications.json");
      const [success, contents] = packagesFile.load_contents(null);

      if (!success) {
        console.error("Could not load applications.json");
        return;
      }

      this.packages = JSON.parse(new TextDecoder().decode(contents)).packages;
    } catch (error) {
      console.error("Error loading JSON data:", error);
    }
  }

  private loadApplicationsFromApplicationsData(
    applicationsData: ApplicationsData
  ): void {
    if (
      applicationsData.applications && Array.isArray(applicationsData.applications)
    ) {
      applicationsData.applications.forEach((application: string) => {
        const pkg = this.packages.find((pkg: Package) => pkg.packageName === application);
        if (pkg) {
          const applicationData: ApplicationData = {
            icon: pkg.icon || "📄",
            title: pkg.title,
            description: pkg.description || "No description available",
            packageName: pkg.packageName,
          };

          this.addApplication(applicationData);
        }
      });
    }
  }

  public clearApplications(): void {
    let child = this.listbox.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      this.listbox.remove(child);
      child = next;
    }
  }

  private addApplication(applicationData: ApplicationData): void {
    // console.log(applicationData);

    const row = new Gtk.ListBoxRow({
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
      file: applicationData.icon,
      pixel_size: 50,
    });

    // Content box
    const contentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 4,
      hexpand: true,
    });

    // Title
    const titleLabel = new Gtk.Label({
      label: `<span weight="bold">${applicationData.title}</span>`,
      use_markup: true,
      halign: Gtk.Align.START,
    });

    // Description and app count
    const descBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
    });

    const descLabel = new Gtk.Label({
      label: applicationData.description,
      halign: Gtk.Align.START,
      hexpand: true,
      css_classes: ["dim-label"],
      ellipsize: Pango.EllipsizeMode.END,
      tooltip_text: applicationData.description,
    });

    const installButton = new Gtk.Button({
      label: 'Install',
      halign: Gtk.Align.END,
      css_classes: ["suggested-action"],
    });
    installButton.connect("clicked", () => {
      this.installApplication(applicationData);
    });
    
    descBox.append(descLabel);
    descBox.append(installButton);

    contentBox.append(titleLabel);
    contentBox.append(descBox);

    box.append(iconImage);
    box.append(contentBox);

    // Store application data in the row for later retrieval
    (row as any).applicationData = applicationData;

    row.set_child(box);
    this.listbox.append(row);
  }

  public getWidget(): Gtk.ScrolledWindow {
    return this.scrolledWindow;
  }

  private getApplicationDataFromRow(row: Gtk.ListBoxRow): ApplicationData {
    // Return stored application data or create default
    const storedData = (row as any).applicationData;
    if (storedData) {
      return storedData;
    } else {
      return {
        icon: "",
        title: "Unknown Application",
        description: "Application information not available",
        packageName: "unknown",
      };
    }
  }

  private showApplicationDetailsFromData(
    applicationData: ApplicationData
  ): void {
    let bodyText = `${applicationData.description}\n\nPackage Name: ${applicationData.packageName}`;

    const dialog = new Adw.MessageDialog({
      heading: `${applicationData.title}`,
      body: bodyText,
      modal: true,
      transient_for: this.parentWindow,
    });

    dialog.add_response("close", "Close");
    dialog.add_response("manage", "Manage Apps");
    dialog.set_default_response("manage");

    dialog.connect("response", (dialog, response) => {
      if (response === "manage") {
        console.log(`Managing apps for ${applicationData.title}...`);
        console.log("Packages:", applicationData.packageName);
      }
    });

    dialog.present();
  }

  private installApplication(
    applicationData: ApplicationData
  ): void {
    const pkg = this.packages.find((pkg: Package) => pkg.packageName === applicationData.packageName);

    if (pkg) {
      new InstallDialog(this.parentWindow, [pkg]);
    } else {
      new Gtk.AlertDialog({
        message: `Package ${applicationData.packageName} not found.`,
        modal: true,
      });
    }
  }
}
