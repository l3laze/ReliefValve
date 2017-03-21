

<img src="https://cloud.githubusercontent.com/assets/18404758/24127483/f846e6f0-0da2-11e7-9d27-ddcdafe026ff.png" width="60" align="center" alt="ReliefValve icon" href="ReliefValve" />ReliefValve
===========

[![Travis-CI Build Status](https://travis-ci.org/l3laze/testingelectron.svg?branch=master)](https://travis-ci.org/l3laze/testingelectron) [![Appveyor Build Status](https://ci.appveyor.com/api/projects/status/sqaop6q2o30cp0wo?svg=true)](https://ci.appveyor.com/project/l3laze/testingelectron)

Table of contents
=================

  * [ReliefValve](#reliefvalve)
  * [Table of contents](#table-of-contents)
  * [Installation](#installation)
  * [Usage](#usage)
    * [Setup](#usage-setup)
    * [Main](#usage-main)
    * [Client](#usage-client)
    * [Settings](#usage-settings)
  * [Unsigned](#unsigned)
  * [Changelog](#changelog)
  * [Contact](#contact)

What is it?
===========

> A tool to help manage the Steam client, and apps installed via Steam. Features are based on tricks which can be done manually, or are well-hidden options within the Steam client.

   * Manage auto-update settings for the apps you've installed via the Steam client

   * Apply an offline fix to make apps which have an update available playable in offline mode.

   * Help "force start" a download for a game that's not compatible with your system.

   * Change your Steam skin, including to a random one.

Installation
============

Usage
=====

  ### Setup

  ### Main

  ### Client

  ### Settings

![screenshot](https://cloud.githubusercontent.com/assets/18404758/24128526/792a0a2a-0daa-11e7-9afd-62e9e8b92c6f.jpg)

Unsigned
========

  This is an unsigned application and it will not run on Windows or Mac
    without first warning the user and asking for consent (on Windows). On Mac
    it can be run by right clicking & pressing "Open" and then "Open" again in
    the dialog that pops up; you may need to enter the admin password to do this.

Change Log
==========

* 1.2.0
    * FIX: Implemented search filters for "Steam Apps" and "Blacklist".
    * FIX: Steam Apps and Blacklist should now properly resize on startup.
    * CHANGE: Reverted menu to using a background color; images too often make it difficult to see.
    * CHANGE: Moved Steam installation settings to the Settings tab, and Blacklist to the Main tab.
    * CHANGE: Changed background & text color pickers to use HTML5's color chooser.
    * CHANGE: Updated README.
    * ADD: Added [MIT License](https://github.com/l3laze/ReliefValve/blob/master/README.md).
    * ADD: Implemented support for force starting a download, changing the Steam skin, and launching Steam with optional arguments; this is on the "Client" tab.

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

l3l_aze (Tom Shaver) – [GitHub]([https://github.com/l3laze/) [Reddit](https://www.reddit.com/u/l3l_aze) [Steam](http://steamcommunity.com/id/l3l_aze/) [e-mail](mailto:l3l_aze@yahoo.com)

Distributed under the MIT license. See [LICENSE](https://github.com/l3laze/ReliefValve/blob/master/LICENSE.md) for more information.

[https://github.com/l3laze/ReliefValve](https://github.com/l3laze/ReliefValve)
