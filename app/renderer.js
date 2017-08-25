// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const electron = require('electron')
const remote = require('electron').remote
const app = remote.require('electron').app
const path = require('path')
const ipc = require('electron').ipcRenderer
const vdf = require('simple-vdf2')
const Config = require('electron-config')
const config = new Config()
const os = require('os')
const eol = os.EOL

var apps,
    blacklist = {},
    settings = {},
    defaultSizeG,
    defaultSizeB,
    logger = require('electron-log'),
    logPath = path.join( app.getPath( "userData" ), "log.txt" ),
    timer,
    arch = process.env.PROCESSOR_ARCHITECTURE,
    platform = process.platform,
    steamPath;

logger.transports.file.level = 'info';
logger.transports.file.file = logPath;
logger.transports.file.size = 5 * 1024 * 1024; // 5MB.
logger.transports.file.streamConfig = { flags: "a" };

logger.info( "---------------- Begin New ----------------" );

function openView( evt, viewName ) {
  var i, x, tablinks;
  x = document.getElementsByClassName( "appView" );
  for( i = 0; i < x.length; i++ ) {
    x[ i ].style.display = "none";
  }
  tablinks = document.getElementsByClassName( "tablink" );
  for( i = 0; i < tablinks.length; i++ ) {
    tablinks[ i ].classList.add( "w3-white" );
    tablinks[ i ].classList.remove( "w3-black" );
    tablinks[ i ].style.border="";
  }
  evt.currentTarget.classList.add( "w3-black" );
  evt.currentTarget.style[ "border-bottom" ] = "2px solid black";

  if( evt.type === "click" ) {
    evt.currentTarget.blur();
  }

  document.getElementById( viewName ).style.display = "block";

  // Hide the menu in small mode after switching views.
  if( window.innerWidth < 601 ) {
    toggleMenu();
  }
}

function toggleMenu() {
  var x, items = $( "#VMenu a " ),
  m = document.getElementById( "menuToggle" ),
  state = m[ "data-state" ];
  for( x = 0; x < items.length; x++ ) {
    if( items[ x ] !== m )
      if( ! state ) {
        items[ x ].classList.add( "w3-hide" );
      }
      else {
        items[ x ].classList.remove( "w3-hide" );
      }
  }

  if( state ) {
    m.innerHTML = "&times;";
    document.getElementById( "VMenu" ).classList.add( "w3-white" );
  }
  else {
    m.innerHTML = "&#9776;";
    document.getElementById( "VMenu" ).classList.remove( "w3-white" );
  }

  m[ "data-state" ] = ( !state );
}

function toggleLaunchOptions() {
  var lo = document.getElementById( "launchOptionsContainer" ),
      settings = config.get( "settings" );
  if( lo.style.display === "block" )
    lo.style.display = "none";
  else {
    lo.style.display = "block";
    document.getElementById( "lo_console" ).checked = settings.launchOptions.console;
    document.getElementById( "lo_bpm" ).checked = settings.launchOptions.bpm;
    document.getElementById( "lo_nothing" ).checked = settings.launchOptions.nothing;
    document.getElementById( "lo_exit" ).checked = settings.launchOptions.exit_rv;
  }

  var el = document.getElementById( "theBody" );
  if( isWhiteish( el.style.color )) {
    lo.style.color = "#555555";
  }
  else {
    lo.style.color = "";
  }
}

function toggleContributors() {
  var mm = document.getElementById( "contributorContainer" );
  if( mm.style.display === "block" )
    mm.style.display = "none";
  else
    mm.style.display = "block";

  var el = document.getElementById( "theBody" );
  if( isWhiteish( el.style.color )) {
    mm.style.color = "#555555";
  }
  else {
    mm.style.color = "";
  }
}

function isWhiteish( col ) {
  col = rgbExtract( col );
  if( col === null ) return false;
  if( col[ 'r' ] > 140 && col[ 'g' ] > 140 && col[ 'b' ] > 140 )
  return true;
}

/*
 * Code from:
 * http://stackoverflow.com/a/34458994/7665043
 */

function rgbExtract(s) {
  var match = /^\s*rgb\(\s*(\d+),\s*(\d+),\s*(\d+)\)\s*$/.exec(s);
  if (match === null) {
    return null;
  }
  return { r: parseInt(match[1], 10),
           g: parseInt(match[2], 10),
           b: parseInt(match[3], 10) };
}

function handleResize() {
  var gList = document.getElementById( "gameList" ),
      bList = document.getElementById( "blackList" ),
      defSize = 15;

  if( defaultSizeG === undefined ) {
    defaultSizeG = defSize;
  }

  if( defaultSizeB === undefined ) {
    defaultSizeB = defSize;
  }

  if( window.innerWidth < 601 ) {
    gList.size = 4;
    bList.size = 3;
  }
  else if( window.innerWidth > 600 ) {
    gList.size = defaultSizeG;
    bList.size = defaultSizeB;
  }
}

function chooseInstall() {
  var folder = ipc.sendSync( "getDirectory" );
  var sp = folder.toLowerCase().split( path.sep );
  if( folder === "undefined" ) return logger.info( "No directory was selected." );

  if( process.platform !== "linux" && ! ipc.sendSync( "fileExists", path.join( folder, "config", "loginusers.vdf" ))) {
    alert( "The selected Steam installation is invalid." );
    logger.info( "The selected Steam installation is invalid (no /config/loginusers.vdf)." );
  }
  else if ( process.platform === "linux" && ! ipc.sendSync( "fileExists", path.join( folder, "steam", "config", "loginusers.vdf" ))) {
    alert( "The selected Steam installation is invalid." );
    logger.info( "The selected Steam installation is invalid (no /config/loginusers.vdf)." );
  }
  else {
    document.getElementById( "installLocation" ).innerHTML = folder;
    loadSteamApps( folder );
    steamPath = folder;
    loadSteamSkins();
  }
}

function refreshSteamApps( elem ) {
  loadSteamApps( steamPath );
  elem.blur();
}

function loadSteamApps( loc ) {
  if( loc === "..." ) {
    alert( "Choose a Steam install location first." );
    return logger.warn( "Choose a Steam install location first." );
  }

  if( process.platform === "linux" ) {
    loc = path.join( loc, "steam" );
  }

  if( ipc.sendSync( "checkAccess", loc ) === false ) {
    alert( "Program can't access the folder \"loc\"." );
    return logger.warn( "Program can't access the folder \"loc\"." );
  }
  else if( ipc.sendSync( "fileExists", loc ) === false ) {
    alert( "Tried to load a Steam folder that doesn't exist: " + loc );
    return logger.warn( "Tried to load a Steam folder that doesn't exist (" + loc + ")" );
  }
  else {
    var libloc = path.join( loc, "steamapps", "libraryfolders.vdf" );
    if( ipc.sendSync( "fileExists", libloc ) === true ) {
        var file = vdf.parse( ipc.sendSync( "readFile", libloc )).LibraryFolders,
        libs = [],
        loading = [], l, x, y, sel, opt;
      logger.info( "Found default Steam Library Folder: " + loc );
      apps = [];
      libs.push( path.join( loc, "steamapps" ));
      l = Object.keys( file );
      for( var x = 0; x < l.length; x++ ) {
        if( l[ x ] !== "TimeNextStatsReport" && l[ x ] !== "ContentStatsID" ) {
          if( ipc.sendSync( "fileExists", file[ l[ x ]]))
            libs.push( file[ l[ x ]]);
          else {
            return alert( "Steam Library Folder \"" + file[ l[ x ]] + "\" does not exist." );
          }
        }
      }

      for( x = 0; x < libs.length; x++ ) {
        l = ipc.sendSync( "getFileList", libs[ x ]);
        for( y = 0; y < l.length; y++ ) {
          if( path.parse( l[ y ]).ext === ".acf" ) {
            loading = vdf.parse( ipc.sendSync( "readFile", path.join( libs[ x ], l [ y ]))).AppState;
            if( Object.keys( blacklist ).includes( loading.appid ) === false ) {
              apps.push({ "appid": loading.appid, "name": loading.name, "state": loading.StateFlags, "aub": loading.AutoUpdateBehavior, "path": path.join( libs[ x ], l[ y ])});
            }
          }
        }
      }

      sortAppList();

      document.getElementById( "numberTotal" ).innerHTML = apps.length;
      document.getElementById( "blacklistTotal" ).innerHTML = Object.keys( blacklist ).length;
    }
    else {
      logger.warn( "Expected Steam Library Folder doesn't exist: " + loc );
    }
  }
}

function sortAppList() {
  var sel = document.getElementById( "gameList" ),
      opt;
  sel.length = 0;

  // Case-insensitive, descending order, A-Z.
  apps.sort( function compare( a, b ) {
    if( a.name.toUpperCase() < b.name.toUpperCase())
      return -1;
    else if( a.name.toUpperCase() > b.name.toUpperCase())
      return 1;
    return 0;
  });

  for( var x = 0; x < apps.length; x++ ) {
    opt = document.createElement( "option" );
    opt.appendChild( document.createTextNode( apps[ x ].name ));
    opt.value = apps[ x ].appid + "|" + apps[ x ].name + "|" + apps[ x ].state + "|" + apps[ x ].aub + "|" + apps[ x ].path;
    sel.appendChild( opt );
  }
}

function changeSelection( list ) {
  var selected = [], i, val, total = 0, ready = 0, needUpdate = 0, useless = 0, totalEl, readyEl, updateEl, uselessEl;
  for( i = 0; i < list.length; i++ ) {
    if( list[ i ].selected ) {
      val = list[ i ].value.split( "|" )[ 2 ];
      if( val === "6" )
        needUpdate += 1;
      else if( val === "4" )
        ready += 1;
      else
        useless += 1;
      total += 1;
      document.getElementById( "autoUpdateBehaviorList" ).selectedIndex = list[ i ].value.split( "|" )[ 3 ];
    }
  }

  document.getElementById( "numberSelected" ).innerHTML = total;
  document.getElementById( "numberReady" ).innerHTML = ready;
  document.getElementById( "numberFixable" ).innerHTML = needUpdate;
  document.getElementById( "numberUseless" ).innerHTML = useless;
}

function loadSettings() {
  var el, value;
  if( config.has( "settings" ) === false ) {
    logger.info( "There is no \"settings\" in config." );
    settings = {
      bg: "0",
      bgValue: "...",
      text: "0",
      autoLoad: false,
      autoLoadValue: "...",
      launchOptions: {
        console: false,
        bpm: false,
        nothing: true,
        exit_rv: false
      }
    };
    config.set( "settings", settings );
  }
  else {
    logger.info( "Loading settings from config." );
    settings = config.get( "settings" );
    if( ! ( settings.hasOwnProperty( "launchOptions"))) {
      settings.launchOptions = {
        console: false,
        bpm: false,
        nothing: true,
        exit_rv: false
      };
      logger.info( "Upgraded settings to v1.2.2 (add launchOptions + lo_nothing)." );
    }
    value = parseInt( settings.bg );
    if( process.platform === "win32" && value === 2 )
      settings.bgValue = JSON.parse( settings.bgValue );
    if( value === 1 ) {
      document.getElementById( "bgSettingsSolid" ).value = settings.bgValue;
    }
    else if( value === 2 ) {
      if( ipc.sendSync( "fileExists", settings.bgValue )) {
        document.getElementById( "bgImage" )[ "data-location" ] = settings.bgValue;
        document.getElementById( "bgSettingsImageCurrent" ).innerHTML = settings.bgValue.substring( settings.bgValue.lastIndexOf( "/" ) + 1 );
      }
      else {
        logger.info( "The background image that was set is not in the saved location; removing it from settings & using the default background value instead." );
        alert( "The background image that was set is not in the saved location; removing it from settings & using the default background instead." );
        settings.bg = "0";
        settings.bgValue = "...";
      }
    }
    document.getElementById( "bgSettingsList" ).selectedIndex = value;
    document.getElementById( "textSettingsColor" ).value = settings.text;
    el = document.getElementById( "autoLoad" );
    el.checked = settings.autoLoad;
    el[ "data-location" ] = settings.autoLoadValue;
    if( settings.autoLoadValue !== "..." && settings.autoLoad ) {
      loadBlacklist();
      loadSteamApps( settings.autoLoadValue );
      steamPath = settings.autoLoadValue;
      loadSteamSkins();
      document.getElementById( "installLocation" ).innerHTML = settings.autoLoadValue;
    }

    resetLaunchOpts();

    el = document.getElementById( "bgSettingsList" );
    changeBGSelection( el );
    applyRVSettings( el, false );
  }

  initFiltering();
}

function loadBlacklist() {
  var i, sel, opt, blacklistKeys;
  if( config.has( "blacklist" ) === false ) {
    logger.info( "There is no \"blacklist\" in config." );
    blacklist = {};
    blacklist[ "250820" ] = "SteamVR"; // Blacklist SteamVR
    config.set( "blacklist", blacklist );
  }
  else {
    blacklist = config.get( "blacklist" );
  }

  sel = document.getElementById( "blackList" );
  sel.length = 0;

  blacklistKeys = Object.keys( blacklist );

  blacklistKeys.sort( function compare( a, b ) {
    if( blacklist[ a ].toUpperCase() < blacklist[ b ].toUpperCase())
      return -1;
    else if( blacklist[ a ].toUpperCase() > blacklist[ b ].toUpperCase())
      return 1;
    return 0;
  });

  for( i = 0; i < blacklistKeys.length; i++ ) {
    opt = document.createElement( "option" );
    opt.appendChild( document.createTextNode( blacklist[ blacklistKeys[ i ]] ));
    opt.value = blacklistKeys[ i ];
    sel.appendChild( opt );
  }
}

function addToBlacklist( list ) {
  if( steamPath !== undefined ) {
    var selected = [], i, val, sel, keys, opt, ignoring = [];
    for( i = 0; i < list.length; i++ ) {
      val = list[ i ].value.split( "|" );
      if( list[ i ].selected ) {
        if( val[ 0 ] in blacklist ) {
          ignoring.push( val[ 1 ]);
        }
        else {
          selected[ val[ 0 ]] = val[ 1 ];
        }
      }
    }

    if( ignoring.length > 0 ) {
      alert( "The following apps are already on the blacklist, and will not be added again:" + ignoring.join( ", " ));
    }

    sel = document.getElementById( "blackList" );

    keys = Object.keys( selected );

    for( i = 0; i < keys.length; i++ ) {
      blacklist[ keys[ i ]] = selected[ keys[ i ]];
    }

    config.set( "blacklist", blacklist );
    loadBlacklist();
    loadSteamApps( document.getElementById( "installLocation" ).innerHTML );
  }
  else {
    alert( "Set a valid Steam path first." );
  }
}

function removeFromBlacklist() {
  if( steamPath !== undefined ) {
    var selected = [], i, val, sel;
    sel = document.getElementById( "blackList" );
    for( i = 0; i < sel.length; i++ ) {
      val = sel[ i ].value;
      if( sel[ i ].selected ) {
        if( val === "250820" ) { // Keep SteamVR on the blacklist.
          alert( "SteamVR cannot be removed from the blacklist." );
        }
        else {
          selected.push( i );
        }
      }
    }

    for( i = selected.length - 1; i >= 0; i-- ) {
      val = sel[ selected[ i ]].value;
      delete blacklist[ val ];
      sel.remove( selected[ i ]);
    }

    config.set( "blacklist", blacklist );
    loadBlacklist();
    loadSteamApps( document.getElementById( "installLocation" ).innerHTML );
    sel.selectedIndex = 0;
    sel.options[ 0 ].selected = false;
    sel.focus();
  }
  else {
    alert( "Set a valid Steam path first." );
  }
}

function resetBlacklist() {
  if( window.confirm( "Are you sure you want to reset the blacklist?" ) === true ) {
    config.delete( "blacklist" );
    loadBlacklist();
    if( steamPath !== undefined ) {
      loadSteamApps( document.getElementById( "installLocation" ).innerHTML );
    }
  }
}

function changeBGSelection( list ) {
  var i,
      val = list.options[ list.selectedIndex ].text,
      bgs = [
        "Solid",
        "Image"
      ];
  for( i = 0; i < bgs.length; i++ ) {
    if( bgs[ i ] !== val ) {
      document.getElementById( "bgSettings" + bgs[ i ] + "Container" ).classList.add( "w3-hide" );
    }
  }
  if( val !== "Default" ) {
    document.getElementById( "bgSettings" + val + "Container" ).classList.remove( "w3-hide" );
  }
}

function chooseBGImage() {
  var pic = ipc.sendSync( "getFile" ),
      sp = pic.toLowerCase().split( path.sep ),
      extensions = [
        ".jpg", ".jpeg", ".bmp", ".gif", ".png", ".svg"
      ],
      el,
      valid = false;
  if( pic !== "undefined" ) {
    valid = extensions.indexOf(
      sp[ sp.length - 1 ].substring(
        sp[ sp.length - 1 ].indexOf( ".", -1 )
      )
    );
    if( valid !== -1 ) {
      el = document.getElementById( "bgImage" );
      el[ "data-location" ] = pic;
      document.getElementById( "bgSettingsImageCurrent" ).innerText = pic.substring( pic.lastIndexOf( "/" ) + 1 );
    }
  }
}

function addForcedDownload( app ) {
  var ow, fing, temp;
  app = parseInt( app );
  if( steamPath === undefined ) {
    alert( "Set a valid Steam install path first!" );
  }
  else if( isNaN( app )) {
    alert( "Enter a valid appid for an app to force download first." );
  }
  else {
    var exists = false;
    temp = getAppInfo( app );
    fing = temp[ 0 ];
    ow = temp[ 1 ];
    if( fing.AppState.installdir !== undefined ) {
      document.getElementById( "forceGameName" ).innerText = fing.AppState.installdir;
      for( var i = 0; i < apps.length; i++ ) {
        if( apps[ i ].name === fing.AppState.name ) {
          exists = true;
          apps[ i ] = {
            "appid": fing.AppState.AppID,
            "name": fing.AppState.name,
            "state": fing.AppState.StateFlags,
            "aub": fing.AppState.AutoUpdateBehavior,
            "path": path.join( steamPath, "steamapps", "appmanifest_" + fing.AppState.AppID + ".acf" )
          };
          logger.info( "Updated appmanifest for " + apps[ i ].name + " (" + apps[ i ].appid + ")" );
        }
      }
      if( exists === false ) {
        apps.push({
          "appid": fing.AppState.AppID,
          "name": fing.AppState.name,
          "state": fing.AppState.StateFlags,
          "aub": fing.AppState.AutoUpdateBehavior,
          "path": path.join( steamPath, "steamapps", "appmanifest_" + fing.AppState.AppID + ".acf" )
        });
        logger.info( "Created new appmanifest for " + apps[ apps.length - 1 ].name  + " (" + apps[ apps.length - 1 ].appid + ")"  );
      }
      ipc.sendSync( "writeFile", path.join( steamPath, "steamapps", "appmanifest_" + fing.AppState.AppID + ".acf" ), vdf.stringify( fing, true ));
      sortAppList();
    }
    else {
      alert( "Failed to get info from Steam. Please try again. If the issue continues submit a bug report through GitHub, reddit, or Steam." );
      console.log( "Failed to scrape app name for appid: " + app );
    }
  }
}

function getAppInfo( appid ) {
  var name, overwrite, forcing;

  appid = parseInt( appid );
  if( isNaN( appid )) {
    alert( "Enter a valid appid first." );
  }
  else {
    name = scrapeAppName( appid )

    if( ipc.sendSync( "fileExists", path.join( steamPath, "steamapps", "appmanifest_" + appid + ".acf" )) === true ) {
      if( confirm( "The appmanifest for that game already exists! Would you like to overwrite it?" ))
        overwrite = true;
    }

    if( overwrite !== false ) {
      forcing = {
        AppState: {
          AppID: "" + appid,
          Universe: "1",
          installdir: name,
          StateFlags: "6",
          name: name,
          LastUpdated: "0",
          UpdateResult: "0",
          SizeOnDisk: "0",
          buildid: "0",
          LastOwner: "0",
          BytesToDownload: "0",
          BytesDownloaded: "0",
          AutoUpdateBehavior: "0",
          AllowOtherDownloadsWhileRunning: "0",
          UserConfig: {
          },
          InstalledDepots: {
          },
          MountedDepots: {
          },
          StagedDepots: {
          }
        }
      };
    }
    return [ forcing, overwrite ];
  }
  return undefined;
}

function scrapeAppName( appid ) {
  var name;

  $.ajax({
    url: "http://store.steampowered.com/api/appdetails/?appids=" + appid,
    dataType: 'text',
    async: false,
    success: function( info ) {
      var n = JSON.parse( info )[ appid ].data.name;
      name = n;
    }
  });
  return name;
}

function resetLaunchOpts() {
  if( settings === undefined ) {
    console.log( "Settings is undefined @ resetLaunchOpts..." );
    settings = {};
  }
  if( settings[ "launchOptions" ] === undefined )
    settings[ "launchOptions" ] = {
      console: false,
      bpm: false,
      nothing: true,
      exit_rv: false
    };

  var lb = document.getElementById( "lo_bpm" );

  document.getElementById( "lo_console" ).checked = false;
  document.getElementById( "lo_bpm" ).checked = false;
  document.getElementById( "lo_nothing" ).checked = true;
  document.getElementById( "lo_exit" ).checked = false;
}

function saveLaunchOpts() {
  settings = config.get( "settings" );
  if( settings === undefined ) {
    logger.warn( "Settings is undefined @ saveLaunchOpts..." );
    settings = {
      bg: "0",
      bgValue: "...",
      text: "0",
      autoLoad: false,
      autoLoadValue: "...",
      launchOptions: {
        console: false,
        bpm: false,
        nothing: true,
        exit_rv: false
      }
    };
  }

  if( settings.hasOwnProperty( "launchOptions" ) === false ) {
    settings[ "launchOptions" ] = {};
  }

  settings.launchOptions.console = document.getElementById( "lo_console" ).checked;
  settings.launchOptions.bpm = document.getElementById( "lo_bpm" ).checked;
  settings.launchOptions.nothing = document.getElementById( "lo_nothing" ).checked;
  settings.launchOptions.exit_rv = document.getElementById( "lo_exit" ).checked;

  config.set( "settings", settings)
  console.log( "Launch options have been saved." );
  console.log( "settings.launchOptions=" + settings.launchOptions.console + " & " + settings.launchOptions.bpm + " & " + settings.launchOptions.exit_rv );
  toggleLaunchOptions();
}

function launchSteamApp() {
  var lb = document.getElementById( "lo_bpm" ),
      opts = config.get( "settings" ).launchOptions,
      arg = "",
      skinSel = document.getElementById( "skinList" );

  if( opts.console ) arg = "//open/console";
  if( opts.bpm ) arg = "//open/bigpicture";

  if( arg === "" )
    arg = "//open/main";

  var ll = document.getElementById( "launchLink" );
      ll.href = "steam:" + arg;
      ll.click();;

  if( document.getElementById( "lo_exit" ).checked ) {
    app.quit();
  }
}
/*  Replacement, if needed...
    var exec = require('child_process').exec, stdout, stderr;
    exec( "open -a Steam.app --args " + args.join( " " ), ( err, stdout, stderr ) => {
      if( err ) {
        console.error( `exec error: ${err}` );
        return;
      }
    });
    if( stdout !== undefined )
      console.log( `stdOut: ${stdout}` );
    if( stderr !== undefined )
    console.log( `stdErr: ${stderr}` );
*/

function loadSteamSkins() {
  var skins, skinPath, sel, opt;

  if( platform === "darwin" ) {
    skinPath = path.join( steamPath, "Steam.AppBundle/Steam/Contents/MacOS/skins" );
  }
  else
    skinPath = path.join( steamPath, "skins" );

  if( ipc.sendSync( "fileExists", skinPath ) === false )
    alert( "Couldn't find the skins folder of your Steam installation." );
  else {
    skins = ipc.sendSync( "getFileList", skinPath );
    var tmpSkins = [];
    skins.forEach( function( item ) {
      if( item.indexOf( "." ) === -1 )
        tmpSkins.push( item );
    });
    skins = Array.from( tmpSkins );
    sel = document.getElementById( "skinList" );
    skins.forEach( function( item ) {
      opt = document.createElement( "option" );
      opt.appendChild( document.createTextNode( item ));
      sel.appendChild( opt );
    });
  }
}

function applySkinSetting( toWhat, list ) {
  var rand;
  if( steamPath === undefined ) {
    return alert( "Set a valid Steam path first!" );
  }

  if( toWhat === "<Random>" ) {
    if( list.length > 2 ) {
      /* Based on code from:
       *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
       */
      var min = 2, // Don't want to select <Default> or <Random>.
          max = list.length - 1;
      rand = Math.floor( Math.random() * ( max - min + 1)) + min;
      toWhat = list[ rand ].text;
    }

    else {
      alert( "You don't have any skins installed to pick from!" );
    }
  }

  if( toWhat === "<Default>" ) {
    toWhat = "";
  }

  if( process.platform === "darwin" || process.platform === "linux" ) {
    if( ipc.sendSync( "fileExists", path.join( steamPath, "registry.vdf" ))) {
      var regvdf = vdf.parse( ipc.sendSync( "readFile", path.join( steamPath, "registry.vdf" )));
      regvdf.Registry.HKCU.Software.Valve.Steam.SkinV4 = toWhat;
      ipc.sendSync( "writeFile", path.join( steamPath, "registry.vdf" ), vdf.stringify( regvdf, true ));
    }
    else {
      alert( "Couldn't find the file " + path.join( steamPath, "registry.vdf" ));
    }
  }
  else if( process.platform === "win32" ) {
    var Registry = require('winreg'),
        skinKey = new Registry({
          hive: Registry.HKCU,
          key: '\\Software\\Valve\\Steam'
        });

    skinKey.set( 'SkinV4', Registry.REG_SZ, toWhat, function( err ) {
      if( err ) {
        logger.error( "Error with winreg (set): " + err );
      }
    });

    skinKey.get( 'SkinV4', function( err, val ) {
      if( err ) {
        logger.error( "Error with winreg (get#2): " + err );
      }
      else {
        if(( val === null && toWhat === "" ) || val.value === toWhat ) {
          logger.info( "Successfully set skin." );
        }
      }
    });
  }
}

function applySteamAppSettings() {
  if( steamPath !== undefined ) {
    var list = document.getElementById( "gameList" ),
        selected = [], i;
    settings[ "aub" ] = document.getElementById( "autoUpdateBehaviorList" ).selectedIndex;
    settings[ "fix" ] = document.getElementById( "cbOfflineFix" ).checked;
    for( i = 0; i < list.length; i++ ) {
      if( list[ i ].selected ) {
        selected.push( i );
      }
    }

    for( i = 0; i < selected.length; i++ ) {
      var file = list[ selected[ i ]].value.split( "|" )[ 4 ];
      if( ipc.sendSync( "fileExists", file ) === false ) {
        alert( "The file related to the app " + list[ selected[ i ]].value.split( "|" )[ 1 ] + " was not found." );
      }
      else {
        var data = vdf.parse( ipc.sendSync( "readFile", file ));
        if( settings.fix && data.AppState.StateFlags === "6" )
          data.AppState.StateFlags = "4";
        if( data.AppState.AutoUpdateBehavior !== settings.aub )
          data.AppState.AutoUpdateBehavior = settings.aub;
        ipc.sendSync( "writeFile", file, vdf.stringify( data, true ));
        list[ selected[ i ]].value = data.AppState.appid + "|" + data.AppState.name + "|" + data.AppState.StateFlags + "|" + data.AppState.AutoUpdateBehavior + "|" + file;
      }
    }
    list.selectedIndex = 0;
    list.options[ 0 ].selected = false;
    list.focus();
  }
  else {
    alert( "You must set a valid Steam path first." );
  }
}

/*
*/

function applyRVSettings( list, doSave ) {
  var bg = list.options[ list.selectedIndex ].text,
      value, i, j, el;

  settings.bg = list.selectedIndex;

  if( bg === "Solid" ) {
    el = document.getElementById( "bgSettingsSolid" );
    value = el.value;
    document.getElementById( "theBody" ).style = "background: " + value;
    settings.bgValue = value;
    el = document.getElementById( "bgImage" );
    el.style.backgroundImage = "";
  }
  else if( bg === "Image" ) {
    el = document.getElementById( "bgImage" );
    value = el[ "data-location" ];
    if( value === undefined ) value = "...";
    if( value !== "..." ) {
      if( process.platform === "win32" ) {
        value = JSON.stringify( value.substring( value.indexOf( "file:///" )));
      }
      settings.bgValue = value;
      el.style.backgroundImage = "url( " + value + " )";
    }
  }
  else if( bg === "Default" ) {
    settings.bgValue = "";
    document.getElementById( "theBody" ).style[ "background" ] = "";
    document.getElementById( "bgImage" ).style.backgroundImage = "";
  }

  el = document.getElementById( "textSettingsColor" );
  value = el.value;

  settings.text = value;

  el = document.getElementById( "theBody" );
  el.style.color = value;

  el = document.getElementById( "aboutView" );
  el.style.color = value;

  if( doSave )
    config.set( "settings", settings );
}

function applyUserSettings( auto, loc ) {
  if( steamPath !== undefined ) {
    settings.autoLoad = auto;
    settings.autoLoadValue = loc;
    config.set( "settings", settings );
    console.log( "Saved user settings." );
  }
  else {
    alert( "Set a valid Steam installation path first." );
  }
}

function modalTabbing( event, modal ) {
  var firstInput, lastInput;

  firstInput = modal.getElementsByClassName( "closeModal" )[ 0 ];
  if( modal.id === "launchOptionsContainer" ) {
    lastInput = document.getElementById( "saveLaunchOptions" );
  }
  else {
    lastInput = firstInput;
  }

  /*redirect last tab to first input*/
  lastInput.addEventListener('keydown', function (e) {
     if ((e.which === 9 && !e.shiftKey)) {
         e.preventDefault();
         firstInput.focus();
     }
  });

  /*redirect first shift+tab to last input*/
  firstInput.addEventListener('keydown', function (e) {
      if ((e.which === 9 && e.shiftKey)) {
          e.preventDefault();
          lastInput.focus();
      }
  });
}

function openAboutTab( event, which ) {
  var tabs = document.querySelectorAll( "#aboutContent > div" ),
      el = "explain" + event.currentTarget.id.substring( 0, 1 ).toUpperCase() + event.currentTarget.id.substring( 1 ),
      what = document.getElementById( el ),
      isActive = false;

  isActive = ( what.classList.contains( "w3-hide" ) && ! what.classList.contains( "active" ));
  tabs.forEach( function( t ) {
    if( t.classList.contains( "w3-hide" ) === false )
      t.classList.add( "w3-hide" );
    if( t.classList.contains( "active" ) === true )
      t.classList.remove( "active" );
  });

  if( isActive ) {
    document.getElementById( el ).classList.remove( "w3-hide" );
    event.currentTarget.classList.add( "active" );
  }
  else {
    event.currentTarget.blur();
    document.getElementById( "explainTheDefault" ).classList.remove( "w3-hide" );
  }
}

function changeHowTab( event ) {
  var el = event.currentTarget,
      made = document.getElementById( "builtWith" ),
      run = document.getElementById( "poweredBy" );

  if( el.classList.contains( "poweredBy" )) {
    made.style.display = "block"
    run.style.display = "none";
  }
  else {
    made.style.display = "none"
    run.style.display = "block";
    $( "#theHow" ).focus().blur();
  }
}

/* Code from or based on
 * http://stackoverflow.com/questions/979256/sorting-an-array-of-javascript-objects
 */
function sortBy( field, reverse, primer ) {
  var key = primer ?
      function( x ) { return primer( x[ field ])} :
      function( x ) { return x[ field ]};
   reverse = !reverse ? 1 : -1;
   return function( a, b ) {
     return a = key( a ), b = key( b ), reverse * (( a > b ) - ( b > a ));
   }
}

function osInit() {
  if( process.platform === "darwin" ) {
//    document.getElementById( "bgImage" ).style[ "-webkit-app-region" ] = "drag";
  }
}

function initBadges() {
  var builtWithBadges = [
    {
      name: "GitHub",
      home: "https://github.com/",
      license: ""
    },
    {
      name: "GitKraken",
      home: "https://www.gitkraken.com/",
      license: ""
    },
    {
      name: "Atom",
      home: "https://atom.io/",
      license: ""
    },
    {
      name: "Appveyor",
      home: "https://www.appveyor.com/",
      license: ""
    },
    {
      name: "Travis-CI",
      home: "https://travis-ci.org/",
      license: ""
    },
    {
      name: "electron-builder",
      home: "https://github.com/electron-userland/electron-builder",
      license: "https://github.com/electron-userland/electron-builder/blob/master/LICENSE"
    }
  ],
  poweredByBadges = [
    {
      name: "Electron",
      home: "http://electron.atom.io/",
      license: "https://github.com/electron/electron/blob/master/LICENSE"
    },
    {
      name: "electron-config",
      home: "https://github.com/sindresorhus/electron-config",
      license: "https://github.com/sindresorhus/electron-config/blob/master/license"
    },
    {
      name: "electron-log",
      home: "https://github.com/megahertz/electron-log",
      license: "https://github.com/megahertz/electron-log/blob/master/LICENSE"
    },
    {
      name: "simple-vdf2",
      home: "https://github.com/l3laze/vdf-parser",
      license: "https://github.com/rossengeorgiev/vdf-parser/blob/master/LICENSE"
    },
    {
      name: "Font-Awesome",
      home: "http://fontawesome.io/",
      license: "http://fontawesome.io/license/"
    },
    {
      name: "jQuery",
      home: "http://jquery.com/",
      license: "https://github.com/jquery/jquery/blob/master/LICENSE.txt"
    },
    {
      name: "Badger.JS",
      home: "https://github.com/l3laze/Badger.js",
      license: "https://github.com/l3laze/Badger.js/blob/master/LICENSE"
    },
    {
      name: "W3.CSS",
      home: "http://www.w3schools.com/w3css/",
      license: ""
    },
    {
      name: "node-winreg",
      home: "https://github.com/CharlieHess/node-winreg",
      license: ""
    }
  ],
  elBuilt = document.getElementById( "builtWith" ).getElementsByClassName( "badger-container" )[ 0 ],
  elPowered = document.getElementById( "poweredBy" ).getElementsByClassName( "badger-container" )[ 0 ],
  i;

  for( i = 0; i < builtWithBadges.length; i++ ) {
    elBuilt.appendChild( craftBadge( builtWithBadges[ i ]));
  }

  for( i = 0; i < poweredByBadges.length; i++ ) {
    elPowered.appendChild( craftBadge( poweredByBadges[ i ]));
  }
}

process.on('uncaughtException', (err) => {
    logger.error('Whoops! There was an uncaught error', err);
    // do a graceful shutdown,
    // close the database connection etc.
    process.exit( 1 );
})

function initFiltering() {
  /* Code based on
   *   http://www.lessanvaezi.com/filter-select-list-options/
   */
   $.fn.filterByText = function(textbox, selectSingleMatch) {
     return this.each(function() {
       var select = this;
       var options = [];
       $(select).find('option').each(function() {
         options.push({value: $(this).val(), text: $(this).text()});
       });
       $(select).data('options', options);
       $(textbox).bind('change keyup', function() {
         var options = $(select).empty().scrollTop(0).data('options');
         var search = $.trim($(this).val());
         var regex = new RegExp(search,'gi');

         $.each(options, function(i) {
           var option = options[i];
           if(option.text.match(regex) !== null) {
             $(select).append(
                $('<option>').text(option.text).val(option.value)
             );
           }
         });
         if( textbox[ 0 ].id === "searchGames" )
           $( "#numberTotal" ).text( $(select).children().length );
         else if( textbox[ 0 ].id === "searchBlacklist" )
           $( "#blacklistTotal" ).text( $( select ).children().length );
       });
     });
   };

   $(function() {
     $('#gameList').filterByText($('#searchGames'));
   });

   $(function() {
    $('#blackList').filterByText($('#searchBlacklist'));
  });
}
