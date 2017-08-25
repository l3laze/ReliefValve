# 1.2.2
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

# 1.2.1

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

# 1.2.0

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

# 1.1.0

  - ADD: Implemented support for some minor settings - auto-load Steam installation, background (color or image), and text color.
  - CHANGE: Small update to the menu - it's now transparent to better support the use of background images/colors, and only uses one button for the menu toggle (hamburger + X).
  - CHANGE: Updated W3.CSS to the latest version (as of Feb 25th, 2017).
  - FIX: Some other small bugfixes and general improvements of the UI I can't remember, but they're in there somewhere.

# 1.0.1

  - FIX: Stopped browser "devtools" from opening on startup. (Thanks probonopd!)

# 1.0.0

  - Initial release
