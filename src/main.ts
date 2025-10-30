#!/usr/bin/env gjs

import Gio from '@girs/gio-2.0';
import Gtk from '@girs/gtk-4.0';
import Adw from '@girs/adw-1';
import { GroupsList } from './components/GroupsList.js';
import { ApplicationsList } from './components/ApplicationsList.js';



// Application class
class ObisionInstallApplication {
    private application: Adw.Application;

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
    }

    private onActivate(): void {
        console.log('Application activated');
        
        // Create and show the main window
        const window = this.createMainWindow();
        console.log('Window created, presenting...');
        window.present();
    }

    private createMainWindow(): Gtk.ApplicationWindow {
        // Create the main window
        const window = new Adw.ApplicationWindow({
            application: this.application as any,
            title: 'Test GNOME App',
            default_width: 800,
            default_height: 600,
        });
        
        console.log('Window properties - Title:', window.get_title(), 'Size:', window.get_default_size());

        // Load UI from resource
        const builder = Gtk.Builder.new();
        
        try {
            // Try to load from resource first
            builder.add_from_resource('/com/obision/ObisionInstall/ui/main-window.ui');
            console.log('Loaded UI from resource');
        } catch (e) {
            // Fallback: load from file
            try {
                builder.add_from_file('data/ui/main-window.ui');
                console.log('Loaded UI from file');
            } catch (e2) {
                console.error('Could not load UI file:', e2);
                console.log('Using fallback UI');
                // this.createFallbackUI(window);
                return window;
            }
        }

        // Get the main content from the UI file
        const mainContent = builder.get_object('main_content') as Gtk.Box;
        
        console.log('Main content found:', !!mainContent);
        
        if (mainContent) {
            console.log('Setting up UI with loaded content');
            // Create toast overlay
            const toastOverlay = new Adw.ToastOverlay();
            
            // Create header bar with menu button
            // const headerBar = new Adw.HeaderBar({
            //     title_widget: new Adw.WindowTitle({
            //         title: 'Test GNOME App',
            //     }),
            // });
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

            // Add menu button to header bar
            headerBar.pack_end(menuButton);

            // Set up toolbar view with header and content
            const toolbarView = new Adw.ToolbarView();
            toolbarView.add_top_bar(headerBar);
            toolbarView.set_content(mainContent);
            
            toastOverlay.set_child(toolbarView);
            // Use the content property for Adw.ApplicationWindow
            (window as any).content = toastOverlay;
            
            // Get the notebook widget
            const notebook = builder.get_object('main_notebook') as Gtk.Notebook;
            
            // Connect button signals from Applications tab
            const helloButton = builder.get_object('hello_button') as Gtk.Button;
            const aboutButton = builder.get_object('about_button') as Gtk.Button;
            const counterLabel = builder.get_object('counter_label') as Gtk.Label;
            
            // Connect button signals from Groups tab
            const addGroupButton = builder.get_object('add_group_button') as Gtk.Button;
            // const groupsScroll = builder.get_object('groups_scroll') as Gtk.ScrolledWindow;
            const groupsContent = builder.get_object('groups_content') as Gtk.Box;
            const applicationsContent = builder.get_object('applications_content') as Gtk.Box;
            
            // Prueba de Stack y StackSwitcher
            const stack = new Gtk.Stack({
                transition_type: Gtk.StackTransitionType.SLIDE_LEFT_RIGHT,
                transition_duration: 500,
                hexpand: true,
                vexpand: true,
            });
            stack.add_titled(applicationsContent, "tab1", "Applications");
            stack.add_titled(groupsContent, "tab2", "Groups");
            const stackSwitcher = new Gtk.StackSwitcher({
                hexpand: true,
                vexpand: true,
            });
            stackSwitcher.set_stack(stack);
            headerBar.pack_start(stackSwitcher);
            
            if (aboutButton) {
                aboutButton.connect('clicked', () => {
                    this.showAboutDialog(window);
                });
            }
            
            // Groups tab functionality
            if (addGroupButton) {
                addGroupButton.connect('clicked', () => {
                    this.showCreateGroupDialog(window);
                });
            }
            
            if (groupsContent) {
                // Create our component and populate the existing listbox
                // const groupsList = new GroupsList(window);
                // groupsContent.append(groupsList.getWidget());
                groupsContent.append(new Gtk.Label({ label: 'Group 1' }));
                groupsContent.append(new Gtk.Label({ label: 'Group 2' }));
                groupsContent.append(new Gtk.Label({ label: 'Group 3' }));  
            }
           
            if (applicationsContent) {
                // Create our component and populate the existing listbox
                // const applicationsList = new ApplicationsList(window);
                // applicationsContent.append(applicationsList.getWidget());
                applicationsContent.append(new Gtk.Label({ label: 'Application A' }));
                applicationsContent.append(new Gtk.Label({ label: 'Application B' }));
                applicationsContent.append(new Gtk.Label({ label: 'Application C' }));
            }
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

    private showCreateGroupDialog(window: Gtk.ApplicationWindow): void {
        const dialog = new Adw.MessageDialog({
            heading: 'Create Group',
            body: 'Create a new group to organize your applications.',
            modal: true,
            transient_for: window,
        });

        dialog.add_response('cancel', 'Cancel');
        dialog.add_response('create', 'Create Group');
        dialog.set_response_appearance('create', Adw.ResponseAppearance.SUGGESTED);

        dialog.connect('response', (dialog: Adw.MessageDialog, response: string) => {
            if (response === 'create') {
                console.log('Creating new group...');
                // Here you would implement the actual group creation logic
            }
            dialog.close();
        });

        dialog.present();
    }

    private showManageGroupsDialog(window: Gtk.ApplicationWindow): void {
        const dialog = new Adw.MessageDialog({
            heading: 'Manage Groups',
            body: 'View and manage your application groups.',
            modal: true,
            transient_for: window,
        });

        dialog.add_response('close', 'Close');
        dialog.set_response_appearance('close', Adw.ResponseAppearance.DEFAULT);

        dialog.connect('response', (dialog: Adw.MessageDialog, response: string) => {
            console.log('Managing groups...');
            // Here you would implement the group management interface
            dialog.close();
        });

        dialog.present();
    }



    private showGroupDetails(window: Gtk.ApplicationWindow, row: Gtk.ListBoxRow): void {
        // Get the group name from the row (this is a simplified example)
        const index = row.get_index();
        const groupNames = ['Development Tools', 'Creative Suite', 'Web & Communication'];
        const groupName = groupNames[index] || 'Unknown Group';
        
        const dialog = new Adw.MessageDialog({
            heading: `${groupName} Details`,
            body: `View and manage applications in the "${groupName}" group.`,
            modal: true,
            transient_for: window,
        });

        dialog.add_response('close', 'Close');
        dialog.add_response('manage', 'Manage Apps');
        dialog.set_default_response('manage');

        dialog.connect('response', (dialog, response) => {
            if (response === 'manage') {
                console.log(`Managing apps for ${groupName}...`);
            }
        });

        dialog.present();
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