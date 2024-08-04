# Homebridge Plugin Repo

The purpose of this project is to help make the plugin installation process faster and more reliable for [verified Homebridge plugins](https://homebridge.io/w/Verified-Plugins).

### Why This Is Needed

Homebridge plugins are published and distributed to the NPM registry and installed using the `npm` cli tool.

While `npm` works for the most part, later versions have become increasingly resource hungry and prone to failure on low powered devices with limited RAM and slow disk I/O (such as a Raspberry Pi).

When using `npm` to install a plugin, it has to individually fetch the metadata, and download, verify and extract the tarball for every dependency a plugin has. This can result in hundreds of HTTP requests every time a plugin is installed or updated. An error during any of these operations will often result in the plugin failing to install or update.

This project pre-bundles [verified Homebridge plugins](https://homebridge.io/w/Verified-Plugins), making them to available to download, with all their dependencies, in a single tarball. Additionally a SHA256 sum of the tarball is available so the integrity of the bundle can be verified after being downloaded to the users system.

A plugin installed via a bundle from this repo can be downloaded and installed in seconds, compared the minutes it might take for some plugins on the same hardware.

### How The Bundle Generation Process Works

Every 30 minutes, a job is excuted using GitHub Actions to check for updates made to any [verified Homebridge plugins](https://homebridge.io/w/Verified-Plugins).

Plugins that require updates are then:

  1. Installed using `npm` in a clean work directory, post install scripts are disabled;
  2. then a `.tar.gz` bundle is created for the plugin, including all it's dependencies;
  3. then a `.sha256` checksum file is generated for the bundle;
  4. finally the resulting tarball and checksum file are uploaded to the [Homebridge Plugin Repo](https://github.com/homebridge/plugin-repo/releases/tag/v1).

The two most recent versions of a plugin are retained in the [Homebridge Plugin Repo](https://github.com/homebridge/plugin-repo/releases/tag/v1), older versions are purged automatically.

### How Plugins Are Installed Via Bundles

Bundles are only used on certain systems:

  * Debian-based Linux ([via apt package](https://github.com/homebridge/homebridge-apt-pkg)): requires apt package update (=>1.0.27)
  * Docker: requires image update (=>2022-07-07)
  * Synology DSM 7: requires package update via DSM Package Center (=>3.0.7)

When a user requests a plugin to be installed or updated via the Homebridge UI the following workflow is executed:

  1. Check if running on a compatible system
  2. Check the plugin is verified
  3. Check if a download bundle is available for the requested version
  4. Download the `.sha256` checksum for the bundle
  5. Download the `.tar.gz` tarball
  6. Check the integrity of the tarball against the checksum
  7. Create a backup of the existing plugin installation (if already installed)
  8. Extract the tarball
  9. Run `npm rebuild` in the plugin's root directory to have any post install scripts executed locally
  10. Update the local `package.json` with the plugin and it's version

If the extraction, or `npm rebuild` steps fail, the old version of the plugin will be restored.

If at any step, the process fails, the Homebridge UI will fallback to using `npm` to complete the installation.

### Download Statistics

This project may impact the download stats for plugins provided by the NPM registry.

As such download stats are available via the [download-statistics.json](https://github.com/homebridge/plugin-repo/releases/download/v1/download-statistics.json) file. This file contains the total downloads from this repo for each verified plugin, as well as the download count for each version (including old versions that have been purged).

The `download-statistics.json` file is updated every 30 minutes.

If you are accessing the file programatically, you will need add a `nonce` query string to the URL to prevent it being redirected to an older (deleted) version of the file. Eg. `/download-statistics.json?nonce=1657193776`.

### FAQ

#### How do I get my plugin included?

All [verified Homebridge plugins](https://homebridge.io/w/Verified-Plugins) are automatically included.

#### What happens if a user attempts to install the latest version of my plugin before the bundle is created?

The plugin will be installed directly from the NPM registry instead.

#### How do I exclude my plugin from being bundled by this project?

Create a pull request adding your plugin's name to the `pluginFilter: string[]` array in the [main.ts](./main.ts) file.

## License

Copyright (C) 2022-2024 oznu

This program is free software: you can redistribute it and/or modify it under the terms of the GNU General Public License as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the [GNU General Public License](./LICENSE) for more details.
