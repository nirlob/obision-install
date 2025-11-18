// //#!/usr/bin/env gjs

import Gio from '@girs/gio-2.0';
import Gtk from '@girs/gtk-4.0';
import Gdk from '@girs/gdk-4.0';
import Adw from '@girs/adw-1';
import { ApplicationsList } from './components/applications-list.js';
import { Application } from './interfaces/application.js';
import { InstallDialog } from './components/install-dialog.js';
import { InstallApplicationData } from './interfaces/install-application.js';

class ObisionInstallApplication {
  private application: Adw.Application;
  private installApplicationsData: InstallApplicationData[] = [];
  private installButton!: Gtk.Button;
  private installInFolderToggleButton!: Gtk.ToggleButton;

  constructor() {
    // Create the application
    this.application = new Adw.Application({
      application_id: 'com.obision.ObisionInstall',
      flags: Gio.ApplicationFlags.DEFAULT_FLAGS,
    });

    // Connect signals
    this.application.connect('activate', this.onActivate.bind(this));
    this.application.connect('startup', this.onStartup.bind(this));
  }

  private onStartup(): void {
    console.log('Application starting up...');

    // const settings = Gio.Settings.new('org.gnome.desktop.app-folders');
    // const folders = settings.get_strv('folder-children');
    // console.log('Settings schema loaded:', folders);
    // folders.push('Obision Install');
    // settings.set_strv('folder-children', folders);
    // console.log('Updated folder-children:', settings.get_strv('folder-children'));

    // Add application actions for menu
    const aboutAction = new Gio.SimpleAction({ name: 'about' });
    aboutAction.connect('activate', () => {
      const windows = this.application.get_windows();
      if (windows.length > 0) {
        this.showAboutDialog(windows[0]);
      }
    });
    this.application.add_action(aboutAction);

    const preferencesAction = new Gio.SimpleAction({ name: 'preferences' });
    preferencesAction.connect('activate', () => {
      console.log('Preferences action activated');
    });
    this.application.add_action(preferencesAction);

    const quitAction = new Gio.SimpleAction({ name: 'quit' });
    quitAction.connect('activate', () => {
      this.application.quit();
    });
    this.application.add_action(quitAction);

    // Set keyboard shortcuts
    this.application.set_accels_for_action('app.quit', ['<Ctrl>Q']);

    // Set resource path
    // this.application.set_resource_base_path('/data');
  }

  private onActivate(): void {
    console.log('Application activated');

    // Load CSS
    const cssProvider = new Gtk.CssProvider();
    cssProvider.load_from_path('data/style.css');

    const display = Gdk.Display.get_default();
    if (display) {
      Gtk.StyleContext.add_provider_for_display(display, cssProvider, Gtk.STYLE_PROVIDER_PRIORITY_APPLICATION);
    }

    // Create and show the main window
    const window = this.createMainWindow();
    console.log('Window created, presenting...');
    window.present();
  }

  private createMainWindow(): Adw.ApplicationWindow {
    // Create the main window
    const window = new Adw.ApplicationWindow({
      application: this.application as any,
      title: 'Obision Install',
      default_width: 1000,
      default_height: 800,
    });

    // Load UI from resource
    const builder = Gtk.Builder.new();

    // Fallback: load from file
    try {
      builder.add_from_file('data/ui/main-window.ui');
      console.log('Loaded UI from file');
    } catch (e2) {
      console.error('Could not load UI file:', e2);
      console.log('Using fallback UI');

      this.application.quit();
    }

    // Get the main content from the UI file
    const mainContent = builder.get_object('main_content') as Gtk.Box;

    if (mainContent) {
      console.log('Setting up UI with loaded content');

      this.installButton = builder.get_object('install_button') as Gtk.Button;
      this.installButton.connect('clicked', () => {
        const installDialog = new InstallDialog(window, this.installApplicationsData, this.installInFolderToggleButton.get_active());
        installDialog.setApplicationsInstalledCallback(() => this.onApplicationsInstalled());
      });

      // Create toast overlay
      const toastOverlay = new Adw.ToastOverlay();

      // Create header bar with menu button
      const headerBar = new Adw.HeaderBar();

      // Create menu model
      const menuModel = new Gio.Menu();
      menuModel.append('About', 'app.about');
      menuModel.append('Preferences', 'app.preferences');
      menuModel.append('Quit', 'app.quit');

      // Create menu button
      const menuButton = new Gtk.MenuButton({
        icon_name: 'open-menu-symbolic',
        menu_model: menuModel,
        tooltip_text: 'Application menu',
      });
      headerBar.pack_end(menuButton);

      this.installInFolderToggleButton = new Gtk.ToggleButton({
        tooltip_text: 'Generates a new folder in applications screen if not exists with the name of the category',
        icon_name: 'folder-symbolic',
      });
      headerBar.pack_end(this.installInFolderToggleButton);

      // Set up toolbar view with header and content
      const toolbarView = new Adw.ToolbarView();
      toolbarView.add_top_bar(headerBar);
      toolbarView.set_content(mainContent);

      toastOverlay.set_child(toolbarView);

      // Use the content property for Adw.ApplicationWindow
      (window as any).content = toastOverlay;

      const applicationsContent = builder.get_object('applications_content') as Gtk.Box;
      
      const applicationsList = new ApplicationsList(window);
      applicationsList.setInstallCallback((app, install) => this.onApplicationClick(app, install));
      applicationsContent.append(applicationsList.getWidget());

      mainContent.append(applicationsContent);

      const searchEntry = new Gtk.SearchEntry({
        hexpand: true,
        placeholder_text: 'Search applications...',
      });

      searchEntry.connect('search-changed', () => {
        const searchText = searchEntry.get_text().toLowerCase();
        applicationsList.filterApplications(searchText);
      });

      headerBar.pack_start(searchEntry);

      const expandAllCategoriesButton = new Gtk.Button({
        tooltip_text: 'Expand all categories',
        icon_name: 'view-list-symbolic',
      });
      expandAllCategoriesButton.connect('clicked', () => {
        applicationsList.expandAllCategories();
      });
      headerBar.pack_end(expandAllCategoriesButton);
    }

    return window;
  }

  private showAboutDialog(parent: Gtk.Window): void {
    const aboutDialog = new Adw.AboutWindow({
      transient_for: parent,
      modal: true,
      application_name: 'Test GNOME App',
      application_icon: 'com.obision.ObisionInstall',
      developer_name: 'Your Name',
      version: '1.0.0',
      developers: ['Your Name <your.email@example.com>'],
      copyright: '© 2024 Your Name',
      license_type: Gtk.License.GPL_3_0,
      website: 'https://example.com',
      issue_url: 'https://github.com/yourusername/obision-install/issues',
    });

    aboutDialog.present();
  }

  private onApplicationClick(app: Application, install: boolean): void {
    if (this.installApplicationsData.find(data => data.application.packageName === app.packageName)) {
      this.installApplicationsData = this.installApplicationsData.filter(data => data.application.packageName !== app.packageName);
      console.log(`Uninstalling package: ${app.title}`);
    } else {
      this.installApplicationsData.push({ application: app, install });
      console.log(`Installing package: ${app.title}`);
    }

    this.installButton.set_sensitive(this.installApplicationsData.length > 0);
  }

  private onApplicationsInstalled(): void {
    this.installApplicationsData = [];
    this.installButton.set_sensitive(false);
  }

  public run(argv: string[]): number {
    return this.application.run(argv);
  }
}

// Main function
function main(argv: string[]): number {
  const app = new ObisionInstallApplication();
  return app.run(argv);
}

// Run the application
if (typeof ARGV !== 'undefined') {
  main(ARGV);
} else {
  main([]);
}
