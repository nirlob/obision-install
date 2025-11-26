# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-11-26

### Added
- Centralized logging system with GLib/journald integration
- Window state persistence (remembers size and maximized state between sessions)
- SettingsService singleton for centralized configuration management
- Structured logging with context objects for better debugging
- Dual output logging: console (timestamped) + journald (structured)

### Changed
- Extracted settings management to dedicated SettingsService
- Improved development workflow with better npm start script
- Clean separation of concerns with service layer architecture

### Fixed
- GSettings schema not found error in npm start (added GSETTINGS_SCHEMA_DIR)
- Window now properly saves and restores its state between sessions

## [1.1.0] - 2025-11-26

### Added
- Expanded application catalog from 31 to 67 applications
- Added 2 new categories: Education and Science
- New applications in Development Tools, Office, Multimedia, Design, Internet, and Tools categories
- Downloaded 37 application icons and 2 category icons from Flathub

### Changed
- **BREAKING CHANGE**: Project renamed from `obision-install` to `obision-apps`
- Application ID changed to `com.obision.ObisionApps`
- Updated all references, file names, and documentation
- Version bumped to 1.1.0

### Fixed
- Debian packaging infrastructure completed and working
- Fixed debian/control dependencies (removed invalid 'apt', added pkgconf)

## [1.0.0] - 2025-11-26

### Added
- Initial release
- GTK4/Libadwaita modern UI
- Support for Flatpak and APT package installation
- GNOME app folders integration
- Application categories organization (Development, Games, Office, Multimedia, Design, Internet, Tools)
- Dynamic data loading from multiple system locations
- Icon and desktop entry integration
- Search functionality for applications
- Category expansion/collapse
- Batch installation/removal with progress tracking
- Application info dialogs with package details

### Technical Details
- Built with TypeScript → GJS compilation pipeline
- Custom build system for GNOME JavaScript bindings
- Meson build system for system integration
- Debian packaging support
- Flatpak manifest (development/testing only)

[1.2.0]: https://github.com/nirlob/obision-apps/compare/v1.1.0...v1.2.0
[1.1.0]: https://github.com/nirlob/obision-apps/compare/v1.0...v1.1.0
[1.0.0]: https://github.com/nirlob/obision-apps/releases/tag/v1.0
