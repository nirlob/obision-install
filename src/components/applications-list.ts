import Gtk from '@girs/gtk-4.0';
import Adw from '@girs/adw-1';
import { Application } from '../interfaces/application.js';
import { ApplicationInfoDialog } from './application-info-dialog.js';
import { UtilsService } from '../services/utils-service.js';
import { DataService } from '../services/data-service.js';
import { Category } from '../interfaces/category.js';

export class ApplicationsList {
  private listbox!: Gtk.ListBox;
  private scrolledWindow!: Gtk.ScrolledWindow;
  private dataService = DataService.instance;
  private utilsService = UtilsService.instance;
  private applicationClickCallback: ((app: Application, installed: boolean) => void) | null = null;

  constructor(private parentWindow: Adw.ApplicationWindow) {
    this.setupUI();
    this.loadCategories();
  }

  private setupUI(): void {
    // Create scrolled window
    this.scrolledWindow = new Gtk.ScrolledWindow({
      hexpand: true,
      vexpand: true,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
    });

    // Create listbox
    this.listbox = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ['boxed-list'],
    });

    // Connect row activation
    this.listbox.connect('row-activated', (listbox: Gtk.ListBox, row: Gtk.ListBoxRow) => {
      const packageData = UtilsService.getPackageDataFromRow(row);
      if (!packageData) {
        new Gtk.AlertDialog({
          message: `Package data not found.`,
          modal: true,
        });
        return;
      }

      new ApplicationInfoDialog(this.parentWindow, packageData);
    });

    this.scrolledWindow.set_child(this.listbox);
  }

  private loadCategories(): void {
    console.log('🔍 Starting to load categories');
    try {
      this.dataService.getCategories().forEach(category => {
        const expanderRow = new Adw.ExpanderRow({
          title: category.title,
          subtitle: category.description,
          activatable: false,
        });

        expanderRow.add_prefix(
          new Gtk.Image({
            file: category.icon,
            pixel_size: 64,
          })
        );

        this.loadApplications(expanderRow, category);
        this.listbox.append(expanderRow);
      });
    } catch (error) {
      console.error('Error loading categories data:', error);
    }
  }

  private loadApplications(expanderRow: Adw.ExpanderRow, category: Category): void {
    try {
      this.dataService.getApplicationsByCategory(category.id).forEach(async app => {
        const packageInstalled = await this.utilsService.isApplicationInstalled(app);

        const row = new Adw.SwitchRow({
          title: app.title,
          subtitle: app.description,
          activatable: true,
          subtitle_lines: 2,
          active: packageInstalled,
        });

        row.add_prefix(
          new Gtk.Image({
            file: app.icon,
            pixel_size: 64,
            margin_start: 30,
          })
        );

        // Connect row activation
        row.connect('notify::active', () => this.onSwitchRowActiveClick(row, app));

        expanderRow.add_row(row);
      });
    } catch (error) {
      console.error('Error loading applications data:', error);
    }
  }

  private onSwitchRowActiveClick(row: Adw.SwitchRow, app: Application): void {
    if (this.applicationClickCallback) {
      this.applicationClickCallback(app, row.active);
    }
  }

  public setInstallCallback(callback: (app: Application, install: boolean) => void): void {
    this.applicationClickCallback = callback;
  }

  public getWidget(): Gtk.ScrolledWindow {
    return this.scrolledWindow;
  }
}
