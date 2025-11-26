import Gio from '@girs/gio-2.0';
import { Application } from '../interfaces/application';
import { argv } from 'process';

export class UtilsService {
  static _instance: UtilsService;

  public static get instance(): UtilsService {
    if (!UtilsService._instance) {
      UtilsService._instance = new UtilsService();
    }

    return UtilsService._instance;
  }

  public executeCommand(command: string, args: string[] = []): [string, string] {
    try {
      const process = new Gio.Subprocess({
        argv: [command, ...args],
        flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE,
      });

      process.init(null);

      const [ok, stdout, stderr] = process.communicate_utf8(null, null);
      if (ok) {
        return [stdout, stderr];
      } else {
        throw new Error('Failed to execute command');
      }
    } catch (error) {
      throw error;
    }
  }

  public isApplicationInstalled(application: Application): boolean {
    try {
      // console.log('Checking installation status for:', application.packageName);

      const [stdout, stderr] = this.executeCommand(
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
