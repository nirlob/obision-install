import Gtk from "@girs/gtk-4.0";
import Adw from "@girs/adw-1";
import Pango from "@girs/pango-1.0";
import Gio from "@girs/gio-2.0";
import {
  ApplicationsData,
  Group,
  Package,
} from "../interfaces/applications-data.js";
import { InstallDialog } from "./InstallDialog.js";
import { UtilsService } from "../services/UtilsService.js";
import { PackageRow } from "./PackageRow.js";
import { PackageInfoDialog } from "./PackageInfoDialog.js";

// GroupData interface for UI display
export interface GroupData {
  icon: string;
  title: string;
  description: string;
  appCount: string;
  packages?: string[];
}

export class GroupsList {
  private listbox!: Gtk.ListBox;
  private scrolledWindow!: Gtk.ScrolledWindow;
  private packages: Package[] = [];

  constructor(private parentWindow: Adw.ApplicationWindow) {
    this.setupUI();
    this.packages = UtilsService.loadPackagesFromJson();
    this.loadGroupsFromJson();
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
        const groupData = this.getGroupDataFromRow(row);
        this.showGroupDetailsFromData(groupData);
      }
    );

    this.scrolledWindow.set_child(this.listbox);
  }

  private loadGroupsFromJson(): void {
    console.log("🔍 Starting to load groups from JSON");
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

      console.log("🔍 Loaded data:", applicationsData.groups?.length, "groups");

      // Clear existing groups and load only from applications.json groups
      this.clearGroups();

      this.loadGroupsFromApplicationsData(applicationsData);
    } catch (error) {
      console.error("Error loading JSON data:", error);
    }
  }

  private loadGroupsFromApplicationsData(
    applicationsData: ApplicationsData
  ): void {
    if (applicationsData.groups && Array.isArray(applicationsData.groups)) {
      applicationsData.groups.forEach((group: Group) => {
        const groupData: GroupData = {
          icon: group.icon || "",
          title: group.title,
          description: group.description || "No description available",
          appCount: `${group.packagesNames?.length || 0} apps`,
          packages: group.packagesNames,
        };

        this.addGroup(groupData);
      });
    }
  }

  public clearGroups(): void {
    let child = this.listbox.get_first_child();
    while (child) {
      const next = child.get_next_sibling();
      this.listbox.remove(child);
      child = next;
    }
  }

  private addGroup(groupData: GroupData): void {
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

    // Icon image
    const iconImage = new Gtk.Image({
      file: groupData.icon,
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
      label: `<span weight="bold">${groupData.title}</span>`,
      use_markup: true,
      halign: Gtk.Align.START,
    });

    // Description and app count
    const descBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 8,
    });

    const descLabel = new Gtk.Label({
      label: groupData.description,
      halign: Gtk.Align.START,
      hexpand: true,
      css_classes: ["dim-label"],
      ellipsize: Pango.EllipsizeMode.END,
    });

    const countLabel = new Gtk.Label({
      label: groupData.appCount,
      halign: Gtk.Align.END,
      css_classes: ["accent"],
      margin_end: 12,
    });

    const installButton = new Gtk.Button({
      label: "Install",
      halign: Gtk.Align.END,
      css_classes: ["suggested-action"],
    });

    installButton.connect("clicked", () => {
      this.installApplications(groupData);
    });

    descBox.append(descLabel);
    descBox.append(countLabel);
    descBox.append(installButton);

    contentBox.append(titleLabel);
    contentBox.append(descBox);

    box.append(iconImage);
    box.append(contentBox);

    // Store group data in the row for later retrieval
    (row as any).groupData = groupData;

    row.set_child(box);
    this.listbox.append(row);
  }

  public getWidget(): Gtk.ScrolledWindow {
    return this.scrolledWindow;
  }

  private getGroupDataFromRow(row: Gtk.ListBoxRow): GroupData {
    // Return stored group data or create default
    const storedData = (row as any).groupData;
    if (storedData) {
      return storedData;
    } else {
      return {
        icon: "📂",
        title: "Unknown Group",
        description: "Group information not available",
        appCount: "0 apps",
      };
    }
  }

  private showGroupDetailsFromData(groupData: GroupData): void {
    const dialog = new Gtk.Dialog({
      title: `Group ${groupData.title} details`,
      modal: true,
      transient_for: this.parentWindow,
      width_request: 500,
    });

    const contentArea = dialog.get_content_area();
    contentArea.set_margin_top(12);
    contentArea.set_margin_bottom(12);
    contentArea.set_margin_start(12);
    contentArea.set_margin_end(12);

    const contentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 12,
    });
    contentArea.append(contentBox);

    contentBox.append(
      new Gtk.Label({
        label: `<span weight="bold">${groupData.description}</span>\n\n<span>This group contains ${groupData.appCount} packages.</span>`,
        use_markup: true,
        halign: Gtk.Align.CENTER,
      })
    );

    const packagesScrolledWindow = new Gtk.ScrolledWindow({
      height_request: 250,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
      margin_top: 12,
    });

    const packagesList = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ["boxed-list"],
    });

    packagesList.connect(
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

    if (groupData.packages && groupData.packages.length > 0) {
      groupData.packages.forEach((pkgName) => {
        const packageData = this.packages.find((pkg) => pkg.packageName === pkgName);
        if (packageData) {
          const packageRow = new PackageRow(packageData, false);
          packagesList.append(packageRow.getWidget());
        }
      });
    }

    packagesScrolledWindow.set_child(packagesList);
    contentArea.append(packagesScrolledWindow);

    dialog.add_button("Close", Gtk.ResponseType.CLOSE) as Gtk.Button;

    dialog.connect("response", (dialog, response) => {
        dialog.close();
    });

    dialog.present();

    // let bodyText = `${groupData.description}\n\nThis group contains ${groupData.appCount}.`;

    // if (groupData.packages && groupData.packages.length > 0) {
    //   bodyText += "\n\nPackages in this group:";
    //   groupData.packages.forEach((pkg) => {
    //     bodyText += `\n• ${pkg}`;
    //   });
    // }

    // const dialog = new Adw.MessageDialog({
    //   heading: `${groupData.title} Details`,
    //   body: bodyText,
    //   modal: true,
    //   transient_for: this.parentWindow,
    // });

    // dialog.add_response("close", "Close");
    // dialog.add_response("manage", "Manage Apps");
    // dialog.set_default_response("manage");

    // dialog.connect("response", (dialog, response) => {
    //   if (response === "manage") {
    //     console.log(`Managing apps for ${groupData.title}...`);
    //     console.log("Packages:", groupData.packages);
    //   }
    // });

    // dialog.present();
  }

  private installApplications(groupData: GroupData): void {
    if (groupData.packages && groupData.packages.length > 0) {
      // Here you would map package names to Package objects as needed
      const packagesToInstall: Package[] = groupData.packages
        .map((pkgName) => {
          return this.packages.find((pkg) => pkg.packageName === pkgName);
        })
        .filter((pkg): pkg is Package => pkg !== undefined);

      if (packagesToInstall.length === 0 || packagesToInstall === undefined) {
        console.error(`No valid packages found for group ${groupData.title}.`);
        new Gtk.AlertDialog({
          message: `No valid packages found for group ${groupData.title}.`,
          modal: true,
        }).show(this.parentWindow);
      } else {
        new InstallDialog(this.parentWindow, packagesToInstall);
      }
    } else {
      new Gtk.AlertDialog({
        message: `No packages found for group ${groupData.title}.`,
        modal: true,
      }).show(this.parentWindow);
    }
  }
}
