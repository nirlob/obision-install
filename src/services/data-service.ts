import Gio from "@girs/gio-2.0";
import { Category } from "../interfaces/category";
import { Application } from "../interfaces/application";

export class DataService {
  static _instance: DataService;

  private readonly DATA_FILE_PATH = "./data/json/applications.json";

  private categories: Category[] = [];
  private applications: Application[] = [];

  private constructor() {
    this.loadDataFromJson();
  }

  public static get instance(): DataService {
    if (!DataService._instance) {
      DataService._instance = new DataService();
    }

    return DataService._instance;
  }

  private loadDataFromJson(): void {
    try {
      // Load applications data from applications.json
      const dataFile = Gio.File.new_for_path(this.DATA_FILE_PATH);
      const [success, contents] = dataFile.load_contents(null);

      if (!success) {
        console.error("Could not load applications.json");
      }

      const parsedData = JSON.parse(new TextDecoder().decode(contents));

      this.categories = parsedData.categories;
      this.applications = parsedData.applications;
    } catch (error) {
      console.error("Error loading JSON data:", error);
    }
  }

  public getCategories(): Category[] {
    return this.categories;
  }

  public getApplicationsByCategory(categoryId: number): Application[] {
    return this.applications.filter((app) => app.categoryId === categoryId);
  }
}
