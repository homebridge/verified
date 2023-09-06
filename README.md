<p align="center">
  <a href="https://github.com/homebridge/homebridge"><img src="https://raw.githubusercontent.com/homebridge/branding/master/logos/homebridge-color-round-stylized.png" height="140"></a>
</p>

<span align="center">

# Verified By Homebridge

</span>

The **Verified By Homebridge** program allows plugin developers to get their plugins reviewed and endorsed by the Homebridge project team.

## Benefits

* Have your plugin reviewed by the Homebridge team.
* Increase the visibility of your plugin.
* Increase the level of trust end users place in your plugin.
* The **"*Verified*"** badge will appear next to your plugin in the [Homebridge UI](https://github.com/oznu/homebridge-config-ui-x).
* Add a ["Donate"](https://github.com/oznu/homebridge-config-ui-x/wiki/Developers:-Donation-Links) button on your plugin tile in the Homebridge UI.
* Your plugin is bumped to the top of the search results in the Homebridge UI.

## Requirements

The Homebridge project team will check that your plugin meets the following criteria:

* The plugin must successfully install.
* The plugin must implement the [Homebridge Plugin Settings GUI](https://developers.homebridge.io/#/config-schema).
* The plugin must not start unless it is configured.
* The plugin must not offer (1) the same or (2) less functionality than that of any existing verified plugin.
  * If you feel that your plugin should replace the verification status of an existing plugin, let us know and this will be dealt with on an individual basis.
* The plugin must not execute post-install scripts that modify the users' system in any way.
* The plugin must not contain any analytics or calls that enable you to track the user.
* The plugin must not throw unhandled exceptions, the plugin must catch and log its own errors.
* The plugin must be published to npm and the source code available on GitHub.
  * A GitHub release - with patch notes - should be created for every new version of your plugin.
* The plugin must run on all [supported LTS versions of Node.js](https://github.com/homebridge/homebridge/wiki/How-To-Update-Node.js), at the time of writing this is Node.js v16 and v18.
* The plugin must not require the user to run Homebridge in a TTY or with non-standard startup parameters, even for initial configuration.
* If the plugin needs to write files to disk (cache, keys, etc.), it must store them inside the Homebridge storage directory.

## How To Request Verification

If you would like your plugin verified, please open an [issue](https://github.com/homebridge/verified/issues/new/choose) on this repository and fill in the template. The Homebridge project team will then review your plugin and provide constructive feedback if required.

If you need assistance meeting the verification requirements, please reach out on the [Homebridge Discord](https://discord.gg/A7nCjbz).

## Post Verification

Once your plugin has been verified you will remain in full control of the GitHub repository and npm package. Your plugin will appear on the "Verified By Homebridge" plugin list and the **"*Verified*"** badge will appear next to your plugin when the next update to the [Homebridge UI](https://github.com/oznu/homebridge-config-ui-x) is published.

You may *optionally* add the **Verified By Homebridge** badge to your plugin README:

[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)

```
[![verified-by-homebridge](https://badgen.net/badge/homebridge/verified/purple)](https://github.com/homebridge/homebridge/wiki/Verified-Plugins)
```

If you decide you no longer wish to maintain your plugin, please reach out to the Homebridge team on the [Homebridge Discord](https://discord.gg/6GUFCb). We can assist in finding a new owner, or take over the repository until a new maintainer can be found.

## Community

The [#plugin-development](https://discord.gg/A7nCjbz) channel in the official Homebridge Discord server is where Homebridge plugin developers can get tips and advice from other developers and the Homebridge project team.

<span align="center">

[![Homebridge Discord](https://discordapp.com/api/guilds/432663330281226270/widget.png?style=banner2)](https://discord.gg/kqNCe2D)

</span>

## Unverification

Your plugin may be subject to another review or be removed from the verification list when deemed necessary by the Homebridge team - this could be (but not limited to) the following scenarios:

- We notice an increased amount of issues arising from your plugin, which results in a suboptimal experience for the user, for example, a Homebridge crash loop.
- Your plugin has been unmaintained for some time, and a fork or new plugin offering improved functionality is created.

We will generally do our best to contact existing developers of plugins before removing verification status. However, we may **immediately** remove verification status in the following (but not limited to) the following scenarios:

- We notice any sort of user analysis tracking in a verified plugin
- A new plugin requests verification which replaces the functionality of any existing plugin, and we notice that the existing plugin has not been maintained for an extended period of time (and we deem it likely that any contact attempt with the developer would be unsuccessful).
