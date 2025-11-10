import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";
import Gio from "@girs/gio-2.0";
import { Application } from "../interfaces/application.js";
import { ApplicationRow } from "./application-row.js";
import { ApplicationInfoDialog } from "./application-info-dialog.js";
import { UtilsService } from "../services/utils-service.js";
import { InstallPackageDialog } from "./install-dialog.js";
import { DataService } from "../services/data-service.js";
import { CategoryRow } from "./category-row.js";

export class ApplicationsList {
  private listbox!: Gtk.ListBox;
  private scrolledWindow!: Gtk.ScrolledWindow;
  private applications: Application[] = [];
  private dataService = DataService.instance;

  constructor(private parentWindow: Adw.ApplicationWindow) {
    this.setupUI();
    this.loadCategories();
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

        new ApplicationInfoDialog(this.parentWindow, packageData);
      }
    );

    this.scrolledWindow.set_child(this.listbox);
  }

  private loadCategories(): void {
    console.log("🔍 Starting to load categories");
    try {
      this.dataService.getCategories().forEach((category) => {
        this.listbox.append(
          new CategoryRow(category).getWidget()
        );
      });
    } catch (error) {
      console.error("Error loading JSON data:", error);
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

  private async addPackage(packageData: Application): Promise<void> {
    const packageInstalled = await UtilsService.isApplicationInstalled(packageData);
    const row = new ApplicationRow(packageData, true, packageInstalled);

    if (!packageInstalled) {
      row.setInstallCallback(
        this.installPackage.bind(this, packageData)
      );
    }

    this.listbox.append(row.getWidget());
  }

  public getWidget(): Gtk.ScrolledWindow {
    return this.scrolledWindow;
  }

  private installPackage(
    pkg: Application
  ): void {
    if (pkg) {
      new InstallPackageDialog(this.parentWindow, pkg);
    } else {
      new Gtk.AlertDialog({
        message: `Package not found.`,
        modal: true,
      });
    }
  }
}
