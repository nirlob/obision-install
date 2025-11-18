import Gio from '@girs/gio-2.0';
import { Application } from '../interfaces/application';
import { Gtk } from '@girs/gtk-4.0';

export class UtilsService {
  static _instance: UtilsService;

  public static get instance(): UtilsService {
    if (!UtilsService._instance) {
      UtilsService._instance = new UtilsService();
    }

    return UtilsService._instance;
  }

  public executeCommandAsync(command: string, args: string[] = []): Promise<{ stdout: string; stderr: string }> {
    return new Promise((resolve, reject) => {
      try {
        const process = new Gio.Subprocess({
          argv: [command, ...args],
          flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
        });

        process.init(null);

        process.communicate_utf8_async(null, null, (proc, res) => {
          try {
            const [ok, stdout, stderr] = process.communicate_utf8_finish(res);
            if (ok) {
              resolve({ stdout: stdout.trim(), stderr: stderr.trim() });
            } else {
              reject(new Error('Failed to execute command'));
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

  public executeCommand(command: string, args: string[] = []): string {
    try {
      const process = new Gio.Subprocess({
        argv: [command, ...args],
        flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
      });

      process.init(null);

      try {
        const [ok, stdout, stderr] = process.communicate_utf8(null, null);
        if (ok) {
          return stdout.trim();
        } else {
          throw new Error('Failed to execute command');
        }
      } catch (error) {
        throw error;
      }
    } catch (error) {
      throw error;
    }
  }

  public isApplicationInstalled(application: Application): boolean {
    try {
      // console.log('Checking installation status for:', application.packageName);

      const stdout = this.executeCommand(
        application.packageType === 'FLATPAK' ? 'flatpak' : 'apt',
        application.packageType === 'FLATPAK' ? ['info', application.packageName] : ['show', application.packageName]
      );

      return stdout.trim().length > 0;
    } catch (error: any) {
      console.error(`Error checking installation status for ${application.packageName}:`, error);
      throw error;
    }
  }
}
