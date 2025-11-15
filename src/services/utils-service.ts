import Gio from "@girs/gio-2.0";
import { Application } from "../interfaces/application";
import { Gtk } from "@girs/gtk-4.0";

export class UtilsService {
  static _instance: UtilsService;

  public static get instance(): UtilsService {
    if (!UtilsService._instance) {
      UtilsService._instance = new UtilsService();
    }

    return UtilsService._instance;
  }

  public executeCommand(
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

  public async isApplicationInstalled(application: Application): Promise<boolean> {
    try {
      console.log("Checking installation status for:", application.packageName);
      const { stdout, stderr } = await this.executeCommand(
        application.packageType === "FLATPAK" ? "flatpak" : "apt",
        application.packageType === "FLATPAK"
          ? ["info", application.packageName]
          : ["show", application.packageName]
      );

      return stdout.trim().length > 0;
    } catch (error: any) {
      return false;
    }
  }
}
