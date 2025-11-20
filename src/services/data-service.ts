import Gio from "@girs/gio-2.0";
import { Category } from "../interfaces/category";
import { Application } from "../interfaces/application";

export class DataService {
  static _instance: DataService;

  private readonly APPLICATIONS_FILE_DIRS = [
    "./data/json/",
    "/usr/share/applications/obision-install/",
    "/usr/local/share/applications/obision-install/",
    "/var/lib/flatpak/exports/share/applications/obision-install/",
    "/var/lib/obision-install/"
  ];

  private categories: Category[] = [];
  private applications: Application[] = [];
  private applicationsFileDir: string = "";

  private constructor() {
    this.searchApplicationsFileDir();
    this.loadDataFromJson();
  }

  public static get instance(): DataService {
    if (!DataService._instance) {
      DataService._instance = new DataService();
    }

    return DataService._instance;
  }

  private searchApplicationsFileDir() {
    for (const dir of this.APPLICATIONS_FILE_DIRS) {
      const file = Gio.File.new_for_path(dir + "applications.json");
      if (file.query_exists(null)) {
        this.applicationsFileDir = dir;
        return;
      }
    }

    throw new Error("No applications.json file found in any of the specified directories.");
  }

  private loadDataFromJson(): void {
    try {
      // Load applications data from applications.json
      const dataFile = Gio.File.new_for_path(this.applicationsFileDir + "applications.json");
      const [success, contents] = dataFile.load_contents(null);

      if (!success) {
        throw new Error("Could not load applications.json");
      }

      const parsedData = JSON.parse(new TextDecoder().decode(contents));

      this.categories = parsedData.categories;
      this.applications = parsedData.applications;
    } catch (error) {
      throw new Error("Error loading JSON data: " + error);
    }
  }

  public getCategories(): Category[] {
    return this.categories;
  }

  public getApplicationsByCategory(categoryId: number): Application[] {
    return this.applications.filter((app) => app.categoryId === categoryId);
  }
}
