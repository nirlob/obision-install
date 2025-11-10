import Gio from "@girs/gio-2.0";
import { Application } from "../interfaces/application";
import { Gtk } from "@girs/gtk-4.0";
import { Category } from "../interfaces/category";

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
