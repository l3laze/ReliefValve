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

    - [Force Start Download](#force-start-download)
    - [Client Options](#client-options)
    - [Launch Options](#launch-options)

- [Unsigned](#unsigned)

- [Changelog](#change-log)
- [License](#license)
- [Contact](#contact)

# What is it?

> A tool to help manage the Steam client, and apps installed via Steam. Features are based on tricks which can be done manually, or are well-hidden options within the Steam client.

- Manage auto-update settings for the apps you've installed via the Steam client.

- Apply an offline fix to make apps which have an update available playable in offline mode.

- Help "force start" a download for a game that's not compatible with your system.

- Change your Steam skin, including to a random one. Information about ReliefValve.

- What - What the app can do.

- How - How the app is built, powered.
- Warning - Warning that "ReliefValve is in no way affiliated with, authorized, maintained, sponsored or endorsed by Valve or any employees of Valve."

# Installation

## Windows

Download the ReliefValve-v#.#.#-Setup.exe and install it.

## Linux

- Download the AppImage for your system. On 32-bit systems get the ia32 (32-bit) version, on 64-bit systems get the x86_64 (64-bit) version.
- Open a terminal and cd into the folder where the app is.
- Make it executable with

  chmod a+x ReliefValve*.AppImage

- Run it with

  ./ReliefValve*.AppImage

- ...or by double-clicking, if you're into that kinda thing.

  ### Mac

  Download the .dmg, mount it, and then drag ReliefValve.app to Applications.

# Usage

## Notes

The application is "frameless" by default, so does not have an outer edge. This means it can easily blend into other windows and be hard to see the edges of it. Setting a background image will help with this until I can try to add a setting to toggle the window frame on/off.

RV does a lot of reading/writing - it's config file that stores the settings, your Steam installation, and the Windows registry (to change the selected Steam skin). Using it on/from a SSD is not recommended.

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

### Force Start Download

Enter an appid or Steam Store URL of an app to "force download" it on an unsupported platform.

- The text box is where to enter the appid or store url.
- The "Game Name" label will be updated with the name of the game if it's found.
- The "Clear" button will clear the text box.
- The "Add" button will add the forced download.

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

# Change Log

- 1.2.2
  - FIX: Updated code to handle new Linux Steam folder configuration (almost no difference..they moved some stuff into .steam/steam...lol).
  - FIX: Removed line from osInit causing it to make the background draggable for Mac...was making the entire app draggable =| I thought I had fixed that already, sorry!
  - FIX: Error checking so app doesn't crash when "Random" is picked for the skin setting but there are no skins installed.
  - FIX: README had some wrong status badges (pointing to another repo of mine); updated them.
  - FIX: Updated menu; update of w3-css to 4.0+ broke it completely.
  - FIX: "Launch" now uses the saved launch options rather than what's selected when it's pressed.
  - CHANGE: Removed "Developer" launch option as it seems to no longer be supported (WTH?)
  - CHANGE: Steam launch options are now radio button options instead of checkboxes because only one of the current options can be used at a time.
  - CHANGE: Added a 1024x1024 PNG icon for Linux.
  - CHANGE: The Launch Options "Reset" button now resets the settings to default, not to their saved state.
  - CHANGE: Menu buttons now highlight grey when hovered over, and don't have borders except for the menu toggle button.
  - CHANGE: Large lists will now cut off text that overflows and use ellipsis at the end (...).
  - CHANGE: Added "Nothing" to Launch Options so that no options can be selected.
  - CHANGE: Normal buttons (not menu or modal) are all now rounded.
  - CHANGE: Normal buttons now highlight black when hovered over.
  - CHANGE: Updated to latest Electron (1.7.5), electron-builder (19.24.1), and w3-css (4.0.4) as of August 20, 2017.

- 1.2.1

  - FIX: The powered by/built links on the about page now work correctly on Windows, again.
  - FIX: Force download functionality should no longer add multiple copies of a "game" to the Steam Apps list when it has to create the appmanifest file.
  - FIX: Select all/cut/copy/paste keyboard shortcuts are now enabled on Mac (again?).
  - FIX: Removed dependencies (font-awesome, jquery, w3.css, badger.js) from repo, as they should be.
  - FIX: Tabbing with the launch options modal open should now behave properly (you can only use tab to get to controls that are part of the modal, not the window behind it). This also applies to the new "contributors" modal.
  - FIX: Labels attached to checkboxes now function as expected (can click label to check/uncheck the control).
  - FIX: Minor HTML & CSS tweaks.
  - CHANGE: Removed "Warning" tab from About page, just made it part of the default instead.
  - CHANGE: Updated code to use Badger.JS instead of Badger.CSS.
  - CHANGE: Updated W3.CSS to 2.9.9, and jquery to 3.2.1 (versions on NPM).
  - CHANGE: Set default cursor for all elements to prevent the text-editing cursor from showing.
  - ADD: More README updates.
  - ADD: "Contributors" modal dialog for people who request features/otherwise contribute somehow (and want their name included).

- 1.2.0

  - FIX: Removed requirement for Steam install path to actually be named Steam; now it will check for the existence of the file config/loginusers.vdf within the selected folder instead.
  - FIX: Lots of error checking for when a valid Steam path hasn't been set yet.
  - FIX: Implemented search filter functionality for "Steam Apps" and "Blacklist".
  - FIX: Steam Apps and Blacklist should now properly resize on startup.
  - CHANGE: Reverted menu to using a background color; images too often make it difficult to see.
  - CHANGE: Moved Steam installation settings to the Settings tab, and Blacklist to the Main tab.
  - CHANGE: Changed background & text color pickers to use HTML5's color chooser.
  - CHANGE: Updated README.
  - ADD: Added [MIT License](https://github.com/l3laze/ReliefValve/blob/master/README.md).
  - ADD: Implemented support for helping to force start a download.
  - ADD: Support for changing the Steam skin.
  - ADD: Launch Steam with optional arguments; can also close RV when launching Steam.
  - ADD: Button to refresh Steam Apps list.

- 1.1.0

  - ADD: Implemented support for some minor settings - auto-load Steam installation, background (color or image), and text color.
  - CHANGE: Small update to the menu - it's now transparent to better support the use of background images/colors, and only uses one button for the menu toggle (hamburger + X).
  - CHANGE: Updated W3.CSS to the latest version (as of Feb 25th, 2017).
  - FIX: Some other small bugfixes and general improvements of the UI I can't remember, but they're in there somewhere.

- 1.0.1

  - FIX: Stopped browser "devtools" from opening on startup. (Thanks probonopd!)

- 1.0.0

  - Initial release

--------------------------------------------------------------------------------

# License

Distributed under the MIT license. See [LICENSE](https://github.com/l3laze/ReliefValve/blob/master/LICENSE.md) for more information.

--------------------------------------------------------------------------------

# Contact

l3l_aze (Tom Shaver) [GitHub]([https://github.com/l3laze/) [Reddit](https://www.reddit.com/u/l3l_aze) [Steam](http://steamcommunity.com/id/l3l_aze/) [e-mail](mailto:l3l_aze@yahoo.com)

<https://github.com/l3laze/ReliefValve>
