import Gio from "@girs/gio-2.0";
import { Application } from "../interfaces/application";
import { Gtk } from "@girs/gtk-4.0";

export class UtilsService {
  static executeCommand(
    command: string,
    args: string[] = []
  ): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      try {
        const process = new Gio.Subprocess({
          argv: [command, ...args],
          flags:
            Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        process.init(null);

        process.communicate_utf8_async(null, null, (proc, res) => {
          try {
            const [ok, stdout, stderr] = process.communicate_utf8_finish(res);
            if (ok) {
              resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            } else {
              reject(new Error("Failed to execute command"));
            }
          } catch (error) {
            reject(error);
          }
        });
      } catch (error) {
        reject(error);
      }
    });
  }

  static loadPackagesFromJson(): Application[] {
    let packages: Application[] = [];

    try {
      // Load applications data from applications.json
      const packagesFile = Gio.File.new_for_path(
        "./data/json/applications.json"
      );
      const [success, contents] = packagesFile.load_contents(null);

      if (!success) {
        console.error("Could not load applications.json");
        return packages;
      }

      packages = JSON.parse(new TextDecoder().decode(contents)).packages;
    } catch (error) {
      console.error("Error loading JSON data:", error);
    }

    return packages;
  }

  static getPackageDataFromRow(row: Gtk.ListBoxRow): Application | null {
    // Return stored package data or null
    const storedData = (row as any).packageData;
    if (storedData) {
      return storedData;
    } else {
      return null;
    }
  }

  static async isApplicationInstalled(application: Application): Promise<boolean> {
    try {
      const { stdout, stderr } = await UtilsService.executeCommand(
        application.packageType === "FLATPAK" ? "flatpak" : "apt",
        application.packageType === "FLATPAK"
          ? ["info", application.packageName]
          : ["show", application.packageName]
      );
      return stdout.trim().length > 0;
    } catch (error: any) {
      console.error("Error testing application installation:", error);
      return false;
    }
  }
}
