import Gio from "@girs/gio-2.0";
import { Package } from "../interfaces/applications-data";

export class UtilsService {
  static executeCommand(
    command: string,
    args: string[] = []
  ): Promise<{ stdout: string; stderr: string }> {
    console.log(`Executing command: ${command} ${args.join(" ")}`);
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

  static loadPackagesFromJson(): Package[] {
    let packages: Package[] = [];

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

  static async testInstalledPackage(packageName: string): Promise<boolean> {
    try {
      await this.executeCommand("dpkg", ["-s", packageName]);
      return true;
    } catch {
      return false;
    }
  }
}
