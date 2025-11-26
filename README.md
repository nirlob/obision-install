# Obision Install - Application Installer for GNOME

A modern GNOME application installer built with TypeScript, GTK4, and Libadwaita. Provides a user-friendly interface for managing application installations with support for both Flatpak and APT packages.

## Features

- 🚀 **TypeScript Support**: Written in TypeScript for better development experience and type safety
- 📱 **Modern UI**: Built with GTK4 and Libadwaita for native GNOME integration
- 📦 **Multi-Package Support**: Install Flatpak and Debian packages
- 🗂️ **Category Organization**: Applications organized by categories (Development, Games, Office, etc.)
- 🔍 **Search Functionality**: Quick search to find applications
- 🏗️ **Meson Build System**: Professional build system setup with system-wide installation
- 📋 **Batch Operations**: Install/remove multiple applications at once
- 🖥️ **Desktop Integration**: Proper desktop file, GSettings schema, and GNOME Shell folder support
- 📂 **App Folders**: Automatically organize installed apps into GNOME Shell folders by category

## Project Structure

```
obision-apps/
├── src/                          # Source code
│   ├── main.ts                   # Main application file
│   ├── components/               # UI components
│   │   ├── applications-list.ts  # Application list with categories
│   │   ├── install-dialog.ts     # Installation/removal dialog
│   │   └── application-info-dialog.ts # App details dialog
│   ├── services/                 # Business logic
│   │   ├── data-service.ts       # Application data management
│   │   └── utils-service.ts      # Utilities (package management, etc.)
│   └── interfaces/               # TypeScript interfaces
│       ├── application.ts        # Application data model
│       ├── category.ts           # Category data model
│       └── install-application.ts # Installation data model
├── scripts/                      # Build scripts
│   └── build.js                  # Custom TypeScript to GJS converter
├── data/                         # Application data
│   ├── ui/                       # UI definition files
│   │   └── main-window.ui        # Main window layout
│   ├── json/                     # Application data
│   │   └── applications.json     # Applications and categories database
│   ├── icons/                    # Application icons
│   │   ├── applications/         # Individual app icons
│   │   └── categories/           # Category icons
│   ├── *.desktop.in              # Desktop file template
│   ├── *.gschema.xml             # GSettings schema
│   └── *.gresource.xml           # Resource bundle definition
├── bin/                          # Executable scripts
│   └── obision-apps.in            # Launcher script template
├── builddir/                     # Generated files (created by build)
│   ├── main.js                   # Compiled JavaScript (ready for GJS)
│   ├── components/               # Compiled components
│   ├── services/                 # Compiled services
│   └── data/                     # Copied resources
├── meson.build                   # Meson build configuration
├── package.json                  # NPM configuration
└── tsconfig.json                 # TypeScript configuration
```

## Dependencies

### System Dependencies
- **GJS**: JavaScript runtime for GNOME (>= 1.66.0)
- **GTK4**: GUI toolkit (>= 4.0)
- **Libadwaita**: Modern GNOME widgets (>= 1.0)
- **Meson**: Build system (>= 0.59.0)
- **Node.js**: For TypeScript compilation (>= 16.0.0)
- **pkg-config**: For dependency detection
- **glib-compile-resources**: For resource bundling
- **Flatpak**: For Flatpak package support (optional)
- **APT**: For Debian package support (Debian/Ubuntu systems)

### Install system dependencies on Debian/Ubuntu:
```bash
sudo apt-get update
sudo apt-get install -y \
  pkg-config \
  libglib2.0-dev \
  libgtk-4-dev \
  libadwaita-1-dev \
  gjs \
  meson \
  nodejs \
  npm \
  flatpak
```

### Install system dependencies on Fedora:
```bash
sudo dnf install -y \
  pkgconf \
  glib2-devel \
  gtk4-devel \
  libadwaita-devel \
  gjs \
  meson \
  gcc \
  nodejs \
  npm \
  flatpak
```

## Building and Running

### Quick Start (Development)
```bash
# Clone the repository
git clone https://github.com/nirlob/obision-apps.git
cd obision-apps

# Install Node.js dependencies
npm install

# Build and run the application
npm start
```

### Development Mode
```bash
# Install npm dependencies (includes @girs type definitions)
npm install

# Build and run the application
npm start

# Or build and run separately
npm run build
./builddir/main.js

# TypeScript watch mode (auto-rebuild on changes)
npm run dev
```

### System-Wide Installation

#### Install to system
```bash
# Build the application
npm run build

# Setup Meson with system prefix
npm run meson-setup

# Compile with Meson
npm run meson-compile

# Install system-wide (requires sudo)
sudo npm run meson-install

# Update desktop database and compile GSettings schemas
sudo update-desktop-database /usr/share/applications
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/
sudo gtk-update-icon-cache /usr/share/icons/hicolor/
```

Or use the all-in-one command:
```bash
# Build and install in one step
sudo npm run meson-install

# Then update system caches
sudo update-desktop-database /usr/share/applications
sudo glib-compile-schemas /usr/share/glib-2.0/schemas/
sudo gtk-update-icon-cache /usr/share/icons/hicolor/
```

#### Uninstall from system
```bash
sudo npm run meson-uninstall
```

### Flatpak Installation

**Note**: While Flatpak builds are supported, the application is **not recommended for Flatpak distribution** due to sandbox limitations. The app requires system-level access to execute `apt` and `flatpak` commands, which are blocked in the Flatpak sandbox.

However, you can build and test the Flatpak for UI development:

#### Build and install Flatpak (for testing only)
```bash
# Build and install locally
npm run flatpak-build

# Or build a distributable bundle
npm run flatpak-bundle
```

#### Uninstall Flatpak
```bash
npm run flatpak-uninstall
```

#### Clean Flatpak build artifacts
```bash
npm run flatpak-clean
```

### Debian Package Installation

You can also install the application using a pre-built Debian package:

#### Build the .deb package
```bash
# Install build dependencies
sudo apt install -y debhelper devscripts

# Build the package
npm run deb-build

# The .deb file will be created in the parent directory
```

#### Install the .deb package
```bash
sudo dpkg -i ../obision-apps_1.0.0_all.deb

# If there are missing dependencies, fix them with:
sudo apt-get install -f
```

#### Uninstall the package
```bash
sudo apt-get remove obision-apps
```

## NPM Scripts

- `npm start`: Build and run the application in development mode (recommended for testing)
- `npm run build`: Build from TypeScript source with automatic GJS conversion
- `npm run dev`: Watch TypeScript files for changes (auto-rebuild)
- `npm run clean`: Clean build and meson directories
- `npm run meson-setup`: Setup Meson build directory with /usr prefix
- `npm run meson-compile`: Compile with Meson build system
- `npm run meson-install`: Complete build and system-wide installation (requires sudo)
- `npm run meson-uninstall`: Uninstall application from system (requires sudo)
- `npm run meson-clean`: Clean Meson build directory
- `npm run flatpak-build`: Build and install Flatpak locally (for testing)
- `npm run flatpak-bundle`: Create a distributable Flatpak bundle
- `npm run flatpak-uninstall`: Uninstall the Flatpak package
- `npm run flatpak-clean`: Clean Flatpak build artifacts
- `npm run deb-build`: Build a Debian package (.deb)
- `npm run deb-install`: Install the built .deb package (requires sudo)
- `npm run deb-clean`: Clean Debian build artifacts

## Running the Application

### After Development Build
```bash
./builddir/main.js
```

### After System Installation
```bash
obision-apps
```
Or launch from GNOME Applications menu: Look for "Obision Install"

## TypeScript Development

The project includes TypeScript type definitions for GJS and GTK in the `types/` directory. While not complete, they provide basic type checking and IntelliSense support.

### Key Features of the TypeScript Setup:
- **@girs Type Definitions**: Official TypeScript definitions for GTK4, Libadwaita, GLib, and GIO
- **Automatic Import Conversion**: Build system converts TypeScript imports to GJS-compatible format
- **Type Safety**: Full IntelliSense support and compile-time type checking
- **Dual Development**: Support for both TypeScript and JavaScript development workflows

## UI Development

The application uses declarative UI files (`data/ui/main-window.ui`) which are loaded at runtime. This allows for:

- Easy UI modifications without recompilation
- Professional UI design workflow
- Separation of concerns (logic vs. presentation)
- Integration with UI design tools

### UI File Structure:
- Modern Libadwaita components (HeaderBar, WindowTitle, etc.)
- Responsive layout with proper spacing and margins
- CSS classes for styling integration
- Accessible widget properties

## Application Features

### Main Features:
1. **Application Browser**: Browse applications organized by categories
2. **Category Filtering**: Expandable categories (Development Tools, Games, Office, Multimedia, Design, Tools)
3. **Search**: Real-time search to filter applications by name or description
4. **Package Information**: View detailed information about each application
5. **Installation Status**: Real-time detection of installed applications
6. **Batch Operations**: Select multiple applications to install/remove at once
7. **Progress Tracking**: Visual feedback during installation/removal operations
8. **Flatpak & APT Support**: Install both Flatpak and native Debian packages
9. **GNOME Shell Integration**: Automatically organize installed apps into folders
10. **About Dialog**: Standard GNOME about dialog with application information

### GNOME Shell Folder Integration:
- When the "Folder Organization" toggle is enabled, installed applications are automatically organized into GNOME Shell folders by category
- Empty folders are automatically removed when all apps from a category are uninstalled
- Folders appear in the GNOME Shell application overview with category names

### Adding New Applications:
1. Edit `data/json/applications.json`
2. Add application entry with package name, type (FLATPAK/DEBIAN), category, and icon
3. Add application icon to `data/icons/applications/`
4. Rebuild with `npm run build`

### Applications Database Location:
The application searches for `applications.json` in the following directories (in order):
1. `./data/json/` - Development/local directory (highest priority)
2. `/usr/share/applications/obision-apps/` - System-wide installation
3. `/usr/local/share/applications/obision-apps/` - Local system installation
4. `/var/lib/flatpak/exports/share/applications/obision-apps/` - Flatpak system installations
5. `/var/lib/obision-apps/` - Alternative system location

The first location where `applications.json` is found will be used. This allows you to:
- Use local data during development (`./data/json/`)
- Package custom application lists for system-wide deployment
- Distribute application databases via Flatpak
- Maintain different application lists for different environments

### Supported Package Types:
- **FLATPAK**: Applications from Flathub repository
- **DEBIAN**: Native Debian/Ubuntu packages via APT

## Architecture

### Build System
The project uses a **hybrid build system**:

1. **TypeScript → JavaScript**: Node.js build script (`scripts/build.js`)
   - Compiles TypeScript to CommonJS
   - Strips TypeScript/CommonJS artifacts
   - Converts `@girs` imports to GJS `imports.gi` syntax
   - Combines all modules into single `builddir/main.js`
   - Maintains execution order (services → components → main)

2. **Meson Build**: For system installation
   - Compiles GResources
   - Configures desktop files
   - Installs to system directories
   - Creates launcher script

**Important**: Always use `npm run build` instead of `tsc` directly.

### Component Pattern
Components are instantiated classes that manage GTK widgets:
```typescript
class MyComponent {
  private widget: Gtk.Widget;
  constructor(private parent: Adw.ApplicationWindow) {
    this.setupUI();
  }
  public getWidget(): Gtk.Widget { return this.widget; }
}
```

### Service Pattern
Services use static singleton pattern:
```typescript
class MyService {
  static _instance: MyService;
  static get instance(): MyService {
    if (!MyService._instance) {
      MyService._instance = new MyService();
    }
    return MyService._instance;
  }
}
```

## Troubleshooting

### Common Issues:

1. **Meson setup fails with "pkg-config not found"**:
   ```bash
   sudo apt-get install pkg-config libglib2.0-dev libgtk-4-dev libadwaita-1-dev
   ```

2. **Application doesn't appear in GNOME menu after installation**:
   ```bash
   sudo update-desktop-database /usr/share/applications
   sudo gtk-update-icon-cache /usr/share/icons/hicolor/
   ```

3. **GSettings schema errors**:
   ```bash
   sudo glib-compile-schemas /usr/share/glib-2.0/schemas/
   ```

4. **Permission denied when cleaning mesonbuilddir**:
   ```bash
   sudo rm -rf mesonbuilddir
   sudo chown -R $USER:$USER builddir
   ```

5. **Flatpak installation fails**:
   - Ensure Flathub repository is added: `flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo`

6. **TypeScript compilation errors**:
   - Ensure `@girs` packages are installed: `npm install`
   - Check TypeScript version: `npx tsc --version`

### Debug Mode:
```bash
# Run with debug output
GJS_DEBUG_OUTPUT=stderr ./builddir/main.js

# Run with GJS debugger
gjs --debugger builddir/main.js

# Check system logs for installation issues
journalctl -xe | grep obision-apps
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test with both TypeScript and JavaScript
5. Submit a pull request

## License

This project is licensed under the GPL-3.0 License - see the desktop file for details.

## Resources

- [GJS Documentation](https://gjs-docs.gnome.org/)
- [GTK4 Documentation](https://docs.gtk.org/gtk4/)
- [Libadwaita Documentation](https://gnome.pages.gitlab.gnome.org/libadwaita/)
- [GNOME Developer Documentation](https://developer.gnome.org/)
- [Meson Build System](https://mesonbuild.com/)