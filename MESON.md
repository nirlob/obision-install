# Meson Installation Guide

## ✅ **Fixed: `npm run meson-install` now works!**

### 🔧 **What was fixed:**

1. **Removed problematic GJS dependency** from `meson.build`
2. **Fixed gresource.xml path** to use `data/ui/main-window.ui`
3. **Updated build workflow** to use separate meson build directory
4. **Fixed install command** to run from correct directory

### 🚀 **How to use:**

```bash
# Install the application system-wide
npm run meson-install

# This will:
# 1. Build the TypeScript application
# 2. Set up meson build directory 
# 3. Compile meson resources
# 4. Install to system directories (requires sudo)
```

### 📁 **What gets installed:**

- **Main application**: `/usr/local/share/com.obision.ObisionInstall/main.js`
- **UI files**: `/usr/local/share/com.obision.ObisionInstall/ui/`
- **Resources**: `/usr/local/share/com.obision.ObisionInstall/com.obision.ObisionInstall.src.gresource`
- **Desktop file**: `/usr/local/share/applications/com.obision.ObisionInstall.desktop`
- **Schema**: `/usr/local/share/glib-2.0/schemas/com.obision.ObisionInstall.gschema.xml`

### 🎯 **Available meson commands:**

```bash
npm run meson-setup      # Set up meson build directory
npm run meson-compile    # Compile meson resources
npm run meson-install    # Full build and install workflow
npm run meson-clean      # Clean meson build directory
```

### ⚠️ **Notes:**

- Installation requires `sudo` privileges
- Files are installed to `/usr/local/` prefix
- The application uses our npm build system for TypeScript compilation
- Meson handles desktop integration and resource compilation

The meson installation system is now working correctly! 🎉