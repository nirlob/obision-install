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
  private applicationClickCallback: ((app: Application, install: boolean) => void) | null = null;

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
        row.connect('notify::active', () => this.onSwitchRowActiveClick(app, row.get_active()));

        expanderRow.add_row(row);
      });
    } catch (error) {
      console.error('Error loading applications data:', error);
    }
  }

  private onSwitchRowActiveClick(app: Application, install: boolean): void {
    if (this.applicationClickCallback) {
      this.applicationClickCallback(app, install);
    }
  }

  public setInstallCallback(callback: (app: Application, install: boolean) => void): void {
    this.applicationClickCallback = callback;
  }

  public getWidget(): Gtk.ScrolledWindow {
    return this.scrolledWindow;
  }

  public expandAllCategories() {
    let child = this.listbox.get_first_child();
    while (child) {
      if (child instanceof Adw.ExpanderRow) {
        child.set_expanded(true);
      }
      child = child.get_next_sibling();
    }
  }

  public filterApplications(searchText: string): void {
    let expanderRow = this.listbox.get_first_child();
    while (expanderRow) {
      if (expanderRow instanceof Adw.ExpanderRow) {
        let hasVisibleApplications = false;

        const expanderRowBox = expanderRow.get_first_child() as Gtk.Box;
        const expanderRowListBox = expanderRowBox.get_first_child() as Gtk.ListBox;
        console.log('Filtering applications in category:', expanderRow.get_title(), 'items count:', expanderRowListBox.get_children().length);

        let switchRow = expanderRowListBox.get_first_child() as Adw.SwitchRow;
        while (switchRow) {
          console.log('Instance of switchRow:', switchRow.get_title());
          if (switchRow instanceof Adw.ActionRow) {
            const title = switchRow.get_title().toLowerCase();
            const subtitle = switchRow.get_subtitle()?.toLowerCase() ?? '';

            const isVisible = title.includes(searchText.toLowerCase()) || subtitle.includes(searchText.toLowerCase());
            console.log(`Filtering "${switchRow.get_title()}": ${isVisible ? 'VISIBLE' : 'HIDDEN'}`);
            switchRow.set_visible(isVisible);

            if (isVisible) {
              hasVisibleApplications = true;
            }
          }
          switchRow = switchRow.get_next_sibling() as Adw.SwitchRow;
        }

        expanderRow.set_visible(hasVisibleApplications);
      }
      expanderRow = expanderRow.get_next_sibling();
    }
  }
}