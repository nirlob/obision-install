import Gtk from '@girs/gtk-4.0';
import Adw from '@girs/adw-1';
import GLib from '@girs/glib-2.0';
import { Application } from '../interfaces/application.js';
import { ApplicationInfoDialog } from './application-info-dialog.js';
import { UtilsService } from '../services/utils-service.js';
import { DataService } from '../services/data-service.js';
import { Category } from '../interfaces/category.js';
import { LoggerService } from '../services/logger-service.js';

export class ApplicationsList {
  private listbox!: Gtk.ListBox;
  private scrolledWindow!: Gtk.ScrolledWindow;
  private dataService = DataService.instance;
  private utilsService = UtilsService.instance;
  private logger = LoggerService.instance;
  private applicationClickCallback: ((app: Application, install: boolean) => void) | null = null;

  constructor(private parentWindow: Adw.ApplicationWindow) {
    this.setupUI();
    this.loadData();
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

    this.scrolledWindow.set_child(this.listbox);
  }

  private loadData(): void {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT, 0, () => {
      try {
        this.loadCategories();
      } catch (error) {
        this.logger.error('Error loading data', { error: String(error) });
      }

      return GLib.SOURCE_REMOVE;
    });
  }

  private loadCategories(): void {
    this.logger.info('Starting to load categories');
    try {
      this.dataService.getCategories().sort((a, b) => a.title.localeCompare(b.title)).forEach(category => {
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
      this.logger.error('Error loading categories data', { error: String(error) });
    }
  }

  private loadApplications(expanderRow: Adw.ExpanderRow, category: Category): void {
    try {
      this.dataService
        .getApplicationsByCategory(category.id)
        .sort((a, b) => a.title.localeCompare(b.title))
        .forEach(app => {
          try {
            // Create row without checking installation status initially
            const row = new Adw.SwitchRow({
              title: app.title,
              subtitle: app.description,
              activatable: true,
              subtitle_lines: 2,
              active: false, // Default to not installed
            });

            row.add_prefix(
              new Gtk.Image({
                file: app.icon,
                pixel_size: 64,
                margin_start: 30,
                margin_top: 5,
                margin_bottom: 5,
              })
            );

            row.add_suffix(new Gtk.Separator({ 
              orientation: Gtk.Orientation.VERTICAL, 
              margin_start: 10, 
              margin_top: 20, 
              margin_bottom: 20
            }));

            const infoButton = new Gtk.Button({
              icon_name: 'help-about-symbolic',
              tooltip_text: `More information about ${app.title} application`,
              valign: Gtk.Align.CENTER,
              can_focus: false,
              css_classes: ['flat'],
            });

            infoButton.connect('clicked', () => {
              new ApplicationInfoDialog(this.parentWindow, app);
            });

            row.add_suffix(infoButton);

            expanderRow.add_row(row);

            // Check installation status asynchronously after UI is rendered
            GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 0, () => {
              try {
                row.set_active(this.utilsService.isApplicationInstalled(app));
                row.connect('notify::active', () => this.onSwitchRowActiveClick(app, row.get_active()));
              } catch (error) {
                this.logger.error('Error checking installation status', { app: app.title, error: String(error) });
              }
              
              return GLib.SOURCE_REMOVE;
            });
          } catch (error) {
            this.logger.error('Error loading application', { app: app.title, error: String(error) });
          }
        });
    } catch (error) {
      this.logger.error('Error loading applications data', { error: String(error) });
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
        const expanderRowRevealer = expanderRowBox.get_first_child()?.get_next_sibling() as Gtk.Revealer;
        const expanderRowListBox = expanderRowRevealer.get_first_child() as Gtk.ListBox;

        let switchRow = expanderRowListBox.get_first_child() as Adw.SwitchRow;
        while (switchRow) {
          if (switchRow instanceof Adw.ActionRow) {
            const title = switchRow.get_title().toLowerCase();
            const subtitle = switchRow.get_subtitle()?.toLowerCase() ?? '';

            const isVisible = title.includes(searchText.toLowerCase()) || subtitle.includes(searchText.toLowerCase());
            switchRow.set_visible(isVisible);

            if (isVisible) {
              hasVisibleApplications = true;
            }
          }
          switchRow = switchRow.get_next_sibling() as Adw.SwitchRow;
        }

        if (hasVisibleApplications) {
          expanderRow.set_expanded(true);
        }
        expanderRow.set_visible(hasVisibleApplications);
      }
      expanderRow = expanderRow.get_next_sibling();
    }
  }
}
