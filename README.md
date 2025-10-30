# Obision Install - TypeScript GNOME Application

A modern GNOME application built with TypeScript, GTK4, and Libadwaita, featuring a beautiful UI designed with Glade-style UI files.

## Features

- 🚀 **TypeScript Support**: Written in TypeScript for better development experience
- 📱 **Modern UI**: Built with GTK4 and Libadwaita for native GNOME integration
- 🎨 **UI Files**: Declarative UI design using XML UI files
- 🏗️ **Meson Build System**: Professional build system setup
- 📦 **Resource Bundle**: UI files bundled as GResources
- ⚙️ **Settings Schema**: GSettings integration for preferences
- 🖥️ **Desktop Integration**: Proper desktop file and application icon

## Project Structure

```
obision-install/
├── src/                    # Source code
│   └── main.ts            # Main TypeScript application file
├── scripts/               # Build scripts
│   └── build.js          # Node.js build script
├── data/                   # Application data
│   ├── ui/                # UI definition files
│   │   └── main-window.ui # Main window UI layout
│   ├── *.desktop.in       # Desktop file template
│   ├── *.gschema.xml      # Settings schema
│   └── *.gresource.xml    # Resource bundle definition
├── types/                 # TypeScript type definitions
│   └── gjs.d.ts          # GJS and GTK type declarations
├── builddir/              # Generated files (created by build)
│   ├── main.js           # Compiled JavaScript (ready for GJS)
│   └── data/             # Copied UI resources
├── meson.build           # Meson build configuration
├── package.json          # NPM configuration
└── tsconfig.json         # TypeScript configuration
```

## Dependencies

### System Dependencies
- **GJS**: JavaScript runtime for GNOME (>= 1.66.0)
- **GTK4**: GUI toolkit (>= 4.0)
- **Libadwaita**: Modern GNOME widgets (>= 1.0)
- **Meson**: Build system (>= 0.59.0)
- **Node.js**: For TypeScript compilation (>= 16.0.0)

### Install system dependencies on Debian/Ubuntu:
```bash
sudo apt install gjs libgtk-4-dev libadwaita-1-dev meson build-essential nodejs npm
```

### Install system dependencies on Fedora:
```bash
sudo dnf install gjs gtk4-devel libadwaita-devel meson gcc nodejs npm
```

## Building and Running

### Quick Start
```bash
# Clone or download the project
cd obision-install

# Install dependencies and build
npm install

# Build and run the application
npm start
```

### Development with TypeScript
```bash
# Install npm dependencies (includes @girs type definitions)
npm install

# Build and run the application
npm start

# Or build and run separately
npm run build
gjs builddir/main.js

# Development mode (watch for changes)
npm run dev
```

### Production Build with Meson
```bash
# Setup build directory
meson setup builddir

# Compile the project
meson compile -C builddir

# Install system-wide (optional)
sudo meson install -C builddir
```

## NPM Scripts

- `npm start`: Build and run the application (recommended)
- `npm run build`: Build from TypeScript source with automatic conversion
- `npm run dev`: Watch TypeScript files for changes
- `npm run clean`: Clean build directory
- `npm run setup`: Setup Meson build directory
- `npm run compile`: Compile with Meson

## Direct Commands

- `gjs builddir/main.js`: Run the compiled application directly

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

### Current Features:
1. **Main Window**: Modern Libadwaita application window
2. **Interactive Counter**: Button click counter demonstration
3. **About Dialog**: Standard GNOME about dialog
4. **Settings Integration**: GSettings schema ready for preferences
5. **Resource Loading**: UI files loaded from GResource bundle

### Extending the Application:
1. Add new UI files in `data/ui/`
2. Update `data/*.gresource.xml` to include new resources
3. Modify TypeScript source in `src/`
4. Rebuild with `./build.sh`

## Troubleshooting

### Common Issues:

1. **"Cannot find module" errors**: 
   - Ensure all system dependencies are installed
   - Check GJS version compatibility

2. **UI file not found**:
   - Verify UI files are in `data/ui/` directory
   - Check GResource bundle compilation

3. **TypeScript compilation errors**:
   - Update type definitions in `types/gjs.d.ts`
   - Use `any` type for missing definitions temporarily

### Debug Mode:
```bash
# Run with debug output
GJS_DEBUG_OUTPUT=stderr gjs builddir/main.js

# Run with GJS debugger
gjs --debugger builddir/main.js
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