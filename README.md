

<img src="https://cloud.githubusercontent.com/assets/18404758/24127483/f846e6f0-0da2-11e7-9d27-ddcdafe026ff.png" width="60" align="center" alt="ReliefValve icon" href="ReliefValve" />ReliefValve
===========

[![Travis-CI Build Status](https://travis-ci.org/l3laze/testingelectron.svg?branch=master)](https://travis-ci.org/l3laze/testingelectron) [![Appveyor Build Status](https://ci.appveyor.com/api/projects/status/sqaop6q2o30cp0wo?svg=true)](https://ci.appveyor.com/project/l3laze/testingelectron)

> A tool to help manage the Steam client, and apps installed via Steam.

----

Table of contents
=================

  * [ReliefValve](#reliefvalve)
  * [Table of contents](#table-of-contents)
  * [Installation](#installation)
    * [Windows](#windows)
    * [Linux](#linux)
    * [Mac](#mac)
  * [Usage](#usage)
    * [Note](#note)
    * [Setup](#setup)
    * [Main](#main)
    * [Client](#client)
    * [Settings](#settings)
  * [Unsigned](#unsigned)
  * [Changelog](#change-log)
  * [Contact](#contact)

What is it?
===========

> A tool to help manage the Steam client, and apps installed via Steam. Features are based on tricks which can be done manually, or are well-hidden options within the Steam client.

   * Manage auto-update settings for the apps you've installed via the Steam client.

   * Apply an offline fix to make apps which have an update available playable in offline mode.

   * Help "force start" a download for a game that's not compatible with your system.

   * Change your Steam skin, including to a random one.

   * Launch Steam with optional arguments (Big Picture Mode, Enable Console, Developer Mode).

Installation
============

  ### Windows
   Download the ReliefValve-v#.#.#-Setup.exe and install it. On 32-bit systems get the ia32 (32-bit) version, on 64-bit systems get the x86_64 (64-bit) version.

  ### Linux
   * Download the AppImage for your system.
   * Open a terminal and cd into the folder where the app is.
   * Make it executable with

    chmod a+x ReliefValve*.AppImage

   * Run it with

    ./ReliefValve*.AppImage

   * ...or by double-clicking, if you're into that kinda thing.

  ### Mac
   Download the .dmg, mount it, and then drag ReliefValve.app to Applications.

Usage
=====

  ### Note
  The application is "frameless" by default, so does not have an outer edge. This means it can easily blend into other windows and be hard to see the edges of it. Setting a background image will help with this until I can try to add a setting to toggle the window frame on/off.

  ### Setup
  Open "Settings" and press "Choose", and then select the folder where Steam is installed to load your installation. If you want to automatically load it when RV is started check "Auto-load" and press Apply.

  ### Main
  TODO: Finish documentation. I think it's mostly self-explanatory, though.
  ### Client
  TODO: This, too.
  ### Settings
  TODO: Sorry; I suck at this part :(

Unsigned
========

  This is an unsigned application and it will not run on Windows or Mac
    without first warning the user and asking for consent (on Windows). On Mac
    it can be run by right clicking & pressing "Open" and then "Open" again in
    the dialog that pops up; you may need to enter the admin password to do this.

Change Log
==========

* 1.2.0
    * FIX: Removed requirement for Steam install path to actually be named Steam; now it will check for the existence of the file config/loginusers.vdf within the selected folder instead.
    * FIX: Lots of error checking for when a valid Steam path hasn't been set yet.
    * FIX: Implemented search filter functionality for "Steam Apps" and "Blacklist".
    * FIX: Steam Apps and Blacklist should now properly resize on startup.
    * CHANGE: Reverted menu to using a background color; images too often make it difficult to see.
    * CHANGE: Moved Steam installation settings to the Settings tab, and Blacklist to the Main tab.
    * CHANGE: Changed background & text color pickers to use HTML5's color chooser.
    * CHANGE: Updated README.
    * ADD: Added [MIT License](https://github.com/l3laze/ReliefValve/blob/master/README.md).
    * ADD: Implemented support for helping to force start a download.
    * ADD: Support for changing the Steam skin.
    * ADD: Launch Steam with optional arguments; can also close RV when launching Steam.
    * ADD: Button to refresh Steam Apps list.

* 1.1.0
    * ADD: Implemented support for some minor settings - auto-load Steam installation, background (color or image), and text color.
    * CHANGE: Small update to the menu - it's now transparent to better support the use of background images/colors, and only uses one button for the menu toggle (hamburger + X).
    * CHANGE: Updated W3.CSS to the latest version (as of Feb 25th, 2017).
    * FIX: Some other small bugfixes and general improvements of the UI I can't remember, but they're in there somewhere.

* 1.0.1
    * FIX: Stopped browser "devtools" from opening on startup. (Thanks probonopd!)

* 1.0.0
    * Initial release

Contact
=======

l3l_aze (Tom Shaver)
[GitHub]([https://github.com/l3laze/) [Reddit](https://www.reddit.com/u/l3l_aze) [Steam](http://steamcommunity.com/id/l3l_aze/) [e-mail](mailto:l3l_aze@yahoo.com)

Distributed under the MIT license. See [LICENSE](https://github.com/l3laze/ReliefValve/blob/master/LICENSE.md) for more information.

[https://github.com/l3laze/ReliefValve](https://github.com/l3laze/ReliefValve)
