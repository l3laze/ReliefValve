// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.

'use strict';

const electron = require('electron')
const remote = require('electron').remote
const app = remote.require('electron').app
const path = require('path')
const ipc = require('electron').ipcRenderer
const vdf = require('simple-vdf')
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
    tablinks[ i ].classList.remove( "active" );
  }
  evt.currentTarget.classList.add( "active" );

  document.getElementById( viewName ).style.display = "block";

  // Hide the menu in small mode after switching views.
  if( window.innerWidth < 601 ) {
    toggleMenu();
  }
}

function toggleMenu() {
  var x, items = $( "#VMenu li a " ),
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
  }
  else {
    m.innerHTML = "&#9776;";
  }

  m[ "data-state" ] = ( !state );
}

function toggleLaunchOptions() {
  var lo = document.getElementById( "launchOptionsContainer" );
  if( lo.style.display === "block" )
    lo.style.display = "none";
  else
    lo.style.display = "block";
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
  if( ! ipc.sendSync( "fileExists", path.join( folder, "config", "loginusers.vdf" ))) {
    alert( "The selected Steam installation is invalid." );
    logger.info( "The selected Steam installation is invalid." );
  }
  else {
    document.getElementById( "installLocation" ).innerHTML = folder;
    loadSteamApps( folder );
    steamPath = folder;
    loadSteamSkins();
  }
}

function loadSteamApps( loc ) {
  if( loc === "..." ) {
    alert( "Choose a Steam install location first." );
    return logger.info( "Choose a Steam install location first." );
  }
  else if( ipc.sendSync( "fileExists", loc ) === false ) {
    alert( "Tried to load a Steam folder that doesn't exist: " + loc );
    return logger.warn( "Tried to load a Steam install that doesn't exist." );
  }
  else {
    var libloc = path.join( loc, "steamapps", "libraryfolders.vdf" );
    if( ipc.sendSync( "fileExists", libloc ) === true ) {
        var file = vdf.parse( ipc.sendSync( "readFile", libloc )).LibraryFolders,
        libs = [],
        loading = [], l, x, y, sel, opt;
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
        clearbeta: false,
        console: false,
        developer: false,
        silent: false,
        tcp: false,
        nobpm: false,
        bpm: false,
        bpmMode: 0
      }
    };
    config.set( "settings", settings );
  }
  else {
    logger.info( "Loading settings from config." );
    settings = config.get( "settings" );
    if( ! ( settings.hasOwnProperty( "launchOptions"))) {
      settings.launchOptions = {
        clearbeta: false,
        console: false,
        developer: false,
        silent: false,
        tcp: false,
        nobpm: false,
        bpm: false,
        bpmMode: 0
      };
      logger.info( "Upgraded settings to v1.2 (add launchOptions)." );
    }
    value = parseInt( settings.bg );
    document.getElementById( "bgSettingsList" ).selectedIndex = value;
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
    temp = getAppInfo( app );
    fing = temp[ 0 ];
    ow = temp[ 1 ];
    if( fing.AppState.installdir !== undefined ) {
      document.getElementById( "forceGameName" ).innerText = fing.AppState.installdir;
      ipc.sendSync( "writeFile", path.join( steamPath, "steamapps", "appmanifest_" + app + ".acf" ), vdf.stringify( fing, true ));
      console.log( "Created appmanifest for " + name + " ("+ app + ")." );
      apps.push({ "appid": fing.AppState.AppID, "name": fing.AppState.name, "state": fing.AppState.StateFlags, "aub": fing.AppState.AutoUpdateBehavior, "path": path.join( steamPath, "steamapps", "appmanifest_" + app + ".acf" )});
      sortAppList();
    }
    else {
      alert( "Failed to get info from Steam. Please try again. If the issue continues submit a bug report through GitHub, reddit, or Steam." );
      console.log( "Failed to scrape app name for appid: " + app );
    }
  }
}

function getAppInfo( appid ) {
  var name, overwrite;

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

    if( overwrite === undefined || overwrite === true ) {
      var forcing = {
        AppState: {
          AppID: appid,
          Universe: "1",
          installdir: name,
          StateFlags: "1026",
          name: name,
          AutoUpdateBehavior: "1"
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
      clearbeta: false,
      console: false,
      developer: false,
      silent: false,
      tcp: false,
      nobpm: false,
      bpm: false,
      bpmMode: 0,
      bpmWindowed: false
    };

  var lnb = document.getElementById( "lo_no_bpm" ),
      lb = document.getElementById( "lo_bpm" );

  document.getElementById( "lo_clearbeta" ).checked = settings.launchOptions.clearbeta;
  document.getElementById( "lo_console" ).checked = settings.launchOptions.console;
  document.getElementById( "lo_developer" ).checked = settings.launchOptions.developer;
  document.getElementById( "lo_silent" ).checked = settings.launchOptions.silent;
  document.getElementById( "lo_tcp" ).checked = settings.launchOptions.tcp;
  lnb.checked = settings.launchOptions.nobpm;
  lb.checked = settings.launchOptions.bpm;
  document.getElementById( "bpmModeList" ).selectedIndex = settings.launchOptions.bpmMode;

  toggleNoBPM( lnb, settings.launchOptions.nobpm );
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
        clearbeta: false,
        console: false,
        developer: false,
        silent: false,
        tcp: false,
        nobpm: false,
        bpm: false,
        bpmMode: 0,
        bpmWindowed: false
      }
    };
  }

  if( settings.hasOwnProperty( "launchOptions" ) === false ) {
    settings[ "launchOptions" ] = {};
  }

  var lnb = document.getElementById( "lo_no_bpm" ),
      lb = document.getElementById( "lo_bpm" );
  settings.launchOptions.clearbeta = document.getElementById( "lo_clearbeta" ).checked;
  settings.launchOptions.console = document.getElementById( "lo_console" ).checked;
  settings.launchOptions.developer = document.getElementById( "lo_developer" ).checked;
  settings.launchOptions.silent = document.getElementById( "lo_silent" ).checked;
  settings.launchOptions.tcp = document.getElementById( "lo_tcp" ).checked;
  settings.launchOptions.nobpm = lnb.checked;
  if( lnb.checked === false ) {
    settings.launchOptions.bpm = lb.checked;
    settings.launchOptions.bpmMode = document.getElementById( "bpmModeList" ).selectedIndex;
    settings.launchOptions.bpmWindowed = document.getElementById( "lo_bpm_windowed" ).checked;
  }
  else {
    settings.launchOptions.bpm = false;
    settings.launchOptions.bpmMode = 0;
    settings.launchOptions.bpmWindowed = false;
  }

  config.set( "settings", settings)
  console.log( "Launch options have been saved." );
  toggleLaunchOptions();
}

function launchSteamApp() {
  var lnb = document.getElementById( "lo_no_bpm" ),
      lb = document.getElementById( "lo_bpm" ),
      opts = {
        clearbeta: document.getElementById( "lo_clearbeta" ).checked,
        console: document.getElementById( "lo_console" ).checked,
        developer: document.getElementById( "lo_developer" ).checked,
        silent: document.getElementById( "lo_silent" ).checked,
        tcp: document.getElementById( "lo_tcp" ).checked,
        nobpm: lnb.checked,
        bpm: lb.checked,
        bpmMode: document.getElementById( "bpmModeList" ).selectedIndex,
        bpmWindowed: document.getElementById( "lo_bpm_windowed" ).checked
      },
      args = [],
      skinSel = document.getElementById( "skinList" );

  if( opts.clearbeta ) args.push( "-clearbeta" );
  if( opts.console ) args.push( "-console" );
  if( opts.developer ) args.push( "-developer" );
  if( opts.silent ) args.push( "-silent" );
  if( opts.tcp ) args.push( "-tcp" );
  if( opts.nobpm ) args.push( "-nobigpicture" );
  else if( opts.bpm ) {
    args.push( "-bigpicture" );
    if( opts.bpmMode === 1 ) args.push( "-480p" );
    if( opts.bpmMode === 2 ) args.push( "-720p" );
    if( opts.bpmMode === 3 ) args.push( "-fulldesktopres" );
    if( opts.bpmWindowed ) args.push( "-windowed" );
  }

  var ll = document.getElementById( "launchLink" );
  if( args.length > 0 ) {
    args.forEach( function( item ) {
      ll.href = "steam:" + item;
      ll.click();
    });
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

  if( platform === "darwin" )
    skinPath = path.join( steamPath, "Steam.AppBundle/Steam/Contents/MacOS/skins" );
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

function applySkinSetting( toWhat, list ) {
  var rand;
  if( steamPath === undefined ) {
    return alert( "Set a valid Steam path first!" );
  }

  if( toWhat === "<Random>" ) {
    /* Based on code from:
     *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     */
    var min = 2, // Don't want to select <Default> or <Random>.
        max = list.length - 1;
    rand = Math.floor( Math.random() * ( max - min + 1)) + min;
    toWhat = list[ rand ].text;
  }

  if( toWhat === "<Default?" ) {
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
    const Registry = require('winreg')
    reg = new Registry({
      hive: Registry.HKCU,
      key: "\\Software\\Valve\\Steam"
    });
    reg.set( "SkinV4", Registry.REG_SZ, toWhat, function( entry ) {
      if( entry !== toWhat ) {
        console.log( "Failed to set Steam skin!" );
        alert( "Failed to change Steam skin!" );
      }
    });
  }
}

function toggleNoBPM( el, state ) {
  state = state || el.checked;
  var lb = document.getElementById( "lo_bpm" ),
      lw = document.getElementById( "lo_bpm_windowed" ),
      bml = document.getElementById( "bpmModeList" );

  el.checked = state;

  lb.disabled = el.checked;
  lw.disabled = el.checked;
  bml.disabled = el.checked;
}

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
    el.style[ "background-image" ] = "";
  }
  else if( bg === "Image" ) {
    el = document.getElementById( "bgImage" );
    value = el[ "data-location" ];
    if( value !== "..." ) {
      settings.bgValue = value;
      el.style[ "background-image" ] = "url( " + value + " )";
    }
  }
  else if( bg === "Default" ) {
    settings.bgValue = "";
    document.getElementById( "theBody" ).style[ "background" ] = "";
    document.getElementById( "bgImage" ).style[ "background-image" ] = "";
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

function modalTabbing( event ) {
  var firstInput = $( "#closeModal" );
  var lastInput = $( "#saveLaunchOptions" );

  /*redirect last tab to first input*/
  lastInput.on('keydown', function (e) {
     if ((e.which === 9 && !e.shiftKey)) {
         e.preventDefault();
         firstInput.focus();
     }
  });

  /*redirect first shift+tab to last input*/
  firstInput.on('keydown', function (e) {
      if ((e.which === 9 && e.shiftKey)) {
          e.preventDefault();
          lastInput.focus();
      }
  });
}

function openAboutTab( event, which ) {
  var tabs = document.querySelectorAll( "#aboutView #aboutHeader > div" ),
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

  if( el.id === "howItsRun" ) {
    made.classList.remove( "w3-hide" );
    run.classList.add( "w3-hide" );
  }
  else {
    made.classList.add( "w3-hide" );
    run.classList.remove( "w3-hide" );
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
