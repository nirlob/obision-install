# Obision Install - Flatpak Build Instructions

## Prerequisites

Install flatpak-builder and required runtimes:

```bash
# Install flatpak-builder
sudo apt install flatpak-builder

# Add Flathub repository
flatpak remote-add --if-not-exists flathub https://flathub.org/repo/flathub.flatpakrepo

# Install GNOME SDK and runtime
flatpak install -y flathub org.gnome.Platform//46 org.gnome.Sdk//46 org.freedesktop.Sdk.Extension.node20//24.08
```

## Build Flatpak

Build and install locally:

```bash
flatpak-builder --user --install --force-clean build-dir com.obision.ObisionApps.yml
```

## Run Flatpak

```bash
flatpak run com.obision.ObisionApps
```

## Create Flatpak Bundle

To create a distributable `.flatpak` bundle:

```bash
flatpak-builder --repo=repo --force-clean build-dir com.obision.ObisionApps.yml
flatpak build-bundle repo obision-apps.flatpak com.obision.ObisionApps
```

## Install from Bundle

```bash
flatpak install --user obision-apps.flatpak
```

## Submit to Flathub

To submit to Flathub:

1. Fork https://github.com/flathub/flathub
2. Create a new repository named `com.obision.ObisionApps`
3. Add the manifest file `com.obision.ObisionApps.yml` and `flathub.json`
4. Submit a pull request to https://github.com/flathub/flathub

## Notes

- The application requires network access to download packages
- Host filesystem access is required to manage system packages
- Requires D-Bus access to GNOME Shell for app folders integration
