import Adw from '@girs/adw-1';
import { Application } from '../interfaces/application';
import Gtk from '@girs/gtk-4.0';
import Pango from '@girs/pango-1.0';
import { UtilsService } from '../services/utils-service';
import GLib from '@girs/glib-2.0';

export class ApplicationInfoDialog {
  private propertiesList!: Gtk.ListBox;
  private utilsService = UtilsService.instance;

  constructor(private parentWindow: Adw.ApplicationWindow, private application: Application) {
    this.setupUI();
    this.loadProperties();
  }

  private setupUI(): void {
    const dialog = new Adw.Dialog({
      width_request: 700,
      can_close: true,
    });

    const mainBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      spacing: 12,
    });
    dialog.set_child(mainBox);

    const headerBar = new Adw.HeaderBar({
      title_widget: new Gtk.Label({ label: this.application.title }),
    });
    mainBox.append(headerBar);

    const contentBox = new Gtk.Box({
      orientation: Gtk.Orientation.VERTICAL,
      margin_bottom: 24,
      margin_start: 24,
      margin_end: 24,
      spacing: 12,
    });
    mainBox.append(contentBox);

    const applicationBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 24,
      hexpand: true,
    });
    contentBox.append(applicationBox);

    const image = new Gtk.Image({
      pixel_size: 64,
      file: this.application.icon || '',
      halign: Gtk.Align.START,
    });
    applicationBox.append(image);

    const descriptionLabel = new Gtk.Label({
      label: this.application.description || 'No description available.',
      wrap: true,
      justify: Gtk.Justification.FILL,
      hexpand: true,
    });
    applicationBox.append(descriptionLabel);

    const expander = new Gtk.Expander({
      label: 'Advanced information',
      margin_top: 24,
    });
    contentBox.append(expander);

    const propertiesScrolledWindow = new Gtk.ScrolledWindow({
      height_request: 200,
      hscrollbar_policy: Gtk.PolicyType.NEVER,
      vscrollbar_policy: Gtk.PolicyType.AUTOMATIC,
      margin_top: 12,
    });

    this.propertiesList = new Gtk.ListBox({
      selection_mode: Gtk.SelectionMode.NONE,
      css_classes: ['boxed-list'],
    });

    propertiesScrolledWindow.set_child(this.propertiesList);
    expander.set_child(propertiesScrolledWindow);

    const buttonBox = new Gtk.Box({
      orientation: Gtk.Orientation.HORIZONTAL,
      spacing: 12,
      halign: Gtk.Align.END,
      margin_top: 12,
    });

    const buttonClose = new Gtk.Button({
      label: 'Close',
    });

    buttonClose.connect('clicked', () => {
      dialog.close();
    });
    buttonBox.append(buttonClose);

    contentBox.append(buttonBox);

    dialog.present(this.parentWindow);
  }

  private loadProperties(): void {
    GLib.timeout_add(GLib.PRIORITY_DEFAULT_IDLE, 0, () => {
      try {
        const [stdout, stderr] = this.utilsService.executeCommand(
          this.application.packageType === 'FLATPAK' ? 'flatpak' : 'apt',
          this.application.packageType === 'FLATPAK' ? ['remote-info', 'flathub', this.application.packageName] : ['show', this.application.packageName]
        );

        const labels = stdout.split('\n');
        labels.forEach(line => {
          const lineParts = line.split(':');
          if (lineParts.length < 2) {
            return;
          }

          const row = new Adw.ActionRow({
            activatable: false,
            title: lineParts[0].trim(),
            subtitle: lineParts[1].trim(),
            css_classes: ['property'],
          });
          this.propertiesList.append(row);
        });
      } catch (error) {
        console.error(`Error loading properties for ${this.application.title}:`, error);
      }

      return GLib.SOURCE_REMOVE;
    });
  }
}
