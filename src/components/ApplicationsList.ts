import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import { ApplicationsData, Package } from "../interfaces/applications-data.js";
import { InstallDialog } from "./InstallDialog.js";
import { PackageRow } from "./PackageRow.js";
import { PackageInfoDialog } from "./PackageInfoDialog.js";
import { UtilsService } from "../services/UtilsService.js";

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
        const packageData = UtilsService.getPackageDataFromRow(row);
        if (!packageData) {
          new Gtk.AlertDialog({
            message: `Package data not found.`,
            modal: true,
          });
          return;
        }

        new PackageInfoDialog(this.parentWindow, packageData);
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
          this.addPackage(pkg);
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

  private addPackage(packageData: Package): void {
    const row = new PackageRow(this.parentWindow, packageData);

    row.setInstallCallback(
      this.installPackage.bind(this, packageData)
    );

    this.listbox.append(row.getWidget());
  }

  public getWidget(): Gtk.ScrolledWindow {
    return this.scrolledWindow;
  }

  private installPackage(
    pkg: Package
  ): void {
    if (pkg) {
      new InstallDialog(this.parentWindow, [pkg]);
    } else {
      new Gtk.AlertDialog({
        message: `Package not found.`,
        modal: true,
      });
    }
  }
}
