# ![ReliefValve icon](https://cloud.githubusercontent.com/assets/18404758/24127483/f846e6f0-0da2-11e7-9d27-ddcdafe026ff.png)ReliefValve

[![Travis-CI Build Status](https://travis-ci.org/l3laze/ReliefValve.svg?branch=master)](https://travis-ci.org/l3laze/ReliefValve) [![Appveyor Build Status](https://ci.appveyor.com/api/projects/status/x6rj9gyaqm9o7bje?svg=true)](https://ci.appveyor.com/project/l3laze/ReliefValve)


[![Libraries.io for GitHub](https://img.shields.io/librariesio/github/l3laze/ReliefValve.svg)](https://github.com/l3laze/ReliefValve/issues)

[![GitHub issues](https://img.shields.io/github/issues/l3laze/ReliefValve.svg)](https://github.com/l3laze/ReliefValve/issues)

[![GitHub license](https://img.shields.io/badge/license-MIT-blue.svg)](https://raw.githubusercontent.com/l3laze/ReliefValve/master/LICENSE.md)

[![Total Downloads](https://img.shields.io/github/downloads/l3laze/ReliefValve/total.svg)](https://github.com/l3laze/ReliefValve/releases)
> A tool to help manage the Steam client, and apps installed via Steam.

--------------------------------------------------------------------------------

# Table of contents

- [ReliefValve](#reliefvalve)
- [Table of contents](#table-of-contents)
- [What is it?](#what-is-it)
- [Installation](#installation)

  - [Windows](#windows)
  - [Linux](#linux)
  - [Mac](#mac)

- [Usage](#usage)

  - [Notes](#notes)
  - [Setup](#setup)
  - [Main](#main)

    - [Steam Apps](#steam-apps)
    - [Steam App Controls](#steam-app-controls)
    - [Blacklist](#blacklist)
    - [Blacklist Controls](#blacklist-controls)

  - [Settings](#settings)

    - [Steam Location](#steam-location)
    - [ReliefValve Settings](#reliefvalve-settings)

  - [Client](#client)

    - [Client Options](#client-options)
    - [Launch Options](#launch-options)

- [Unsigned](#unsigned)
- [License](#license)
- [Contact](#contact)

# What is it?

> A tool to help manage the Steam client, and apps installed via Steam. Features are based on tricks which can be done manually, or are well-hidden options within the Steam client.

- Manage auto-update settings for the apps you've installed via the Steam client.

- Apply an offline fix to make apps which have an update available playable in offline mode.

- Manage Steam client settings without opening the Steam client.

- Backup/restore Steam client settings.

- Change your Steam skin, including to a random one.

- What - What the app can do.

- How - How the app is built, powered.
- Warning - Warning that "ReliefValve is in no way affiliated with, authorized, maintained, sponsored or endorsed by Valve or any employees of Valve."

# Installation

## Windows

Download the ReliefValve-v#.#.#-Setup.exe and install it.

## Linux

- Download the AppImage for your system. On 32-bit systems get the i386 (32-bit) version, on 64-bit systems get the x86_64 (64-bit) version.
- Open a terminal and cd into the folder where the AppImage is.
- Make it executable with

  chmod a+x ReliefValve*.AppImage

- Run it with

  ./ReliefValve*.AppImage

- ...or by double-clicking/right clicking and pressing "Run" if you're into that kinda thing, or you can search for it in your Applications and open it from there.

Note: Linux needs to run chmod a+x ReliefValve*.AppImage after updating the app even if you replace the old copy with a new one.

## Mac

  Download the .dmg, mount it, and then drag ReliefValve.app to Applications.

# Usage

## Notes

The application is "frameless" by default, so does not have an outer edge. This means it can easily blend into other windows and be hard to see the edges of it. Setting a background image will help with this.

RV does a lot of reading/writing - it's config file that stores the settings, your Steam installation, and the Windows registry (to change the selected Steam skin). Using it on/from a SSD is not recommended.

As far as I know Steam must be opened using "Steam Browser Protocol" at least once with your system's browser before RV can do so.

--------------------------------------------------------------------------------

## Setup

Open "Settings" and press "Choose", and then select the folder where Steam is installed to load your installation. If you want to automatically load it when RV is started check "Auto-load" and press Apply.

--------------------------------------------------------------------------------

## Main

![main](https://cloud.githubusercontent.com/assets/18404758/24328202/fb20221a-11a8-11e7-8a47-709c91e91e68.jpg)

### Steam Apps

On the left is your list of apps installed via Steam, aka Steam Apps. On the left of it's label is a refresh button to reload the list, and on the right is the number of items currently in the list (which is updated when you filter the list using the search box).

Below that the boxes are:

- Blue - The total number of currently selected apps.
- Green - The total number of currently selected apps that are playable.
- Yellow - The total number of currently selected apps that are fully installed, but have an update available, and can be fixed for offline play.
- Red - The total number of currently selected apps that are useless.

### Steam App Controls

- First is the auto-update setting control, which you may be familiar with from Steam because it's the exact same idea & wording. This will apply the chosen auto-update setting to each selected app when you press "Apply" on the bottom left of the main page.
- Next is the "Offline Fix" checkbox. If any of the selected apps can be fixed for offline play, this will do the fix when you press "Apply" on the bottom left of the main page.
- Next, "Add To Blacklist". This will add all of the currently selected apps to the blacklist on the right, which is explained further below.

### Blacklist

On the right is the Blacklist, which is apps that will be ignored by ReliefValve and not loaded, to keep it from messing with them in any way. Next to the label is the number of items currently in the list (which is also updated when you filter the list using the search box).

Below the Blacklist the box is the same as for the Steam Apps list:

- Blue - The total number of currently selected apps.

### Blacklist Controls

- "Remove Selected" will remove the currently selected apps fromt the Blacklist. Note that SteamVR is permanently blacklisted as I'm not sure how Steam would deal with changing it's appmanifest file.
- "Reset Blacklist" will remove everything (except SteamVR) from the Blacklist, resetting it to it's beginning state.

--------------------------------------------------------------------------------

## Settings

![settings](https://cloud.githubusercontent.com/assets/18404758/24328203/fb24b366-11a8-11e7-8ba9-15ef57f97111.jpg)

### Steam Location

Controls for the Steam install location RV uses.

- Choose button - Select a new Steam Location; also loads it when chosen.

- Auto-load User - Auto-load the chosen Steam Location when ReliefValve starts.

- Apply - Save the auto-load setting, including the chosen Steam Location.

### ReliefValve Settings

Controls for RV's own settings.

- Background - Choose default (nothing, will use default background color), Solid (solid color background), or Image (a background image, as in the screenshots). When you choose "Solid" or "Background" another control will popup. When solid is selected it will be a color bar (as is shown by the "Text Color" setting) which when clicked will open a color picker that lets you pick a solid color. When Image is selected it will display a label with the file name of the current background image or "..." if nothing is selected, and below it a "Choose" button that will let you pick a different background image.
- Text Color - The text color which will be used throughout most of the application.
- Apply - Saves the selected settings and applies them the app.

--------------------------------------------------------------------------------

## Client

![client](https://cloud.githubusercontent.com/assets/18404758/24328199/fb17fd60-11a8-11e7-967f-2d0edf5d9e33.jpg)

### Client Options

Options for the Steam client.

- "Launch Options" opens a dialog with some launch options for the Steam client. Check a box if you want to use an option.
- "Launch" will launch the Steam client with the selected Launch Options.

  ###### Launch Options

  ![client-launch-options](https://cloud.githubusercontent.com/assets/18404758/24328456/eaa49900-11af-11e7-9692-1bf3a2367201.jpg)

  Launch options for the Steam client.

- Enable Console - Enables the debugging console of the Steam client, found under the Console tab when it's enabled. Allows access to some special hidden commands and variables.

- Developer Mode - Enables the console + developer mode of the Steam client. Developer mode enables use of VGUI inspector by pressing F6 (similar to a modern browser's "devtools") or VGUI zoo by pressing F7, which are useful for Steam skin development.

- Big Picture Mode - Open Steam in Big Picture Mode.
- Close ReliefValve - If this is selected then when you press "Launch" to start Steam ReliefValve will close itself.
- Reset - Reset launch options to the last saved defaults.
- Save - Save the currently selected launch options as the default.

### Client Settings

Most of the Steam client settings, along with backup and restore support.

--------------------------------------------------------------------------------

## Help

A very minimal version of the README documentation. Needs an upgrade.

--------------------------------------------------------------------------------

## About

Information about ReliefValve.

- What - What the app can do.
- How - How the app is built, powered.
- Warning - Warning that "ReliefValve is in no way affiliated with, authorized, maintained, sponsored or endorsed by Valve or any employees of Valve."

--------------------------------------------------------------------------------

# Unsigned

This is an unsigned application and it will not run on Windows or Mac without first warning the user and asking for consent (on Windows). On Mac it can be run by right clicking & pressing "Open" and then "Open" again in the dialog that pops up; you may need to enter the admin password to do this.

--------------------------------------------------------------------------------

# License

Distributed under the MIT license. See [LICENSE](https://github.com/l3laze/ReliefValve/blob/master/LICENSE.md) for more information.

--------------------------------------------------------------------------------

# Contact

l3l_aze (Tom Shaver) [GitHub]([https://github.com/l3laze/) [Reddit](https://www.reddit.com/u/l3l_aze) [Steam](http://steamcommunity.com/id/l3l_aze/) [e-mail](mailto:l3l_aze@yahoo.com)

<https://github.com/l3laze/ReliefValve>
