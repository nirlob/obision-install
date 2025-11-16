import Adw from "@girs/adw-1";
import { Application } from "./application";

export interface InstallApplicationData {
  application: Application;
  install: boolean;
  row?: Adw.ActionRow;
}
