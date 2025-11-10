import Gio from "@girs/gio-2.0";
import { Category } from "../interfaces/category";
import { Application } from "../interfaces/application";

export class DataService {
  static _instance: DataService;

  private categories: Category[] = [];
  private applications: Application[] = [];

  private constructor() {
    this.categories = this.loadCategoriesFromJson();
    this.applications = this.loadApplicationsFromJson();
  }

  public static get instance(): DataService {
    if (!DataService._instance) {
      DataService._instance = new DataService();
    }

    return DataService._instance;
  }

  private loadCategoriesFromJson(): Category[] {
    let categories: Category[] = [];

    try {
      // Load categories data from categories.json
      const categoriesFile = Gio.File.new_for_path(
        "./data/json/categories.json"
      );
      const [success, contents] = categoriesFile.load_contents(null);

      if (!success) {
        console.error("Could not load categories.json");
        return categories;
      }

      categories = JSON.parse(new TextDecoder().decode(contents)).categories;
    } catch (error) {
      console.error("Error loading categories JSON data:", error);
    }

    return categories;
  }

  private loadApplicationsFromJson(): Application[] {
    let applications: Application[] = [];

    try {
      // Load applications data from applications.json
      const applicationsFile = Gio.File.new_for_path(
        "./data/json/applications.json"
      );
      const [success, contents] = applicationsFile.load_contents(null);

      if (!success) {
        console.error("Could not load applications.json");
        return applications;
      }

      applications = JSON.parse(
        new TextDecoder().decode(contents)
      ).applications;
    } catch (error) {
      console.error("Error loading applications JSON data:", error);
    }

    return applications;
  }

  public getCategories(): Category[] {
    return this.categories;
  }

  public getApplicationsByCategory(categoryId: number): Application[] {
    return this.applications.filter((app) => app.categoryId === categoryId);
  }
}
