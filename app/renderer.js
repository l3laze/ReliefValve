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
const eol = os.EOL;
const Registry = require('winreg')

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
  evt.currentTarget.className += " active";

  document.getElementById( viewName ).style.display = "block";

  // Hide the menu in small mode after switching views.
  if( window.innerWidth < 601 ) {
    toggleMenu();
  }
}

function toggleMenu() {
  var x, items = [
    document.getElementById( "VMainContainer" ),
    document.getElementById( "VSettingsContainer" ),
    document.getElementById( "VClientContainer" ),
    document.getElementById( "VHelpContainer" ),
    document.getElementById( "VAboutContainer" ),
    document.getElementById( "VExitContainer" )
  ],
  m = document.getElementById( "menuToggle" ),
  state = m[ "data-state" ];
  for( x = 0; x < items.length; x++ ) {
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
  else if( window.innerWidth > 601 ) {
    gList.size = defaultSizeG;
    bList.size = defaultSizeB;
  }
}

function chooseInstall() {
  var folder = ipc.sendSync( "getDirectory" );
  var sp = folder.toLowerCase().split( path.sep );
  if( folder === "undefined" ) return logger.info( "No directory was selected." );
  if( sp[ sp.length - 1 ] !== ( "steam" )) {
    alert( "Select a directory named \"Steam\" to continue." );
    logger.info( "Select a directory named \"Steam\" to continue." );
  }
  else if( ! ipc.sendSync( "fileExists", path.join( folder, "steamapps" ))) {
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
  var libloc = path.join( loc, "steamapps", "libraryfolders.vdf" ),
      file = vdf.parse( ipc.sendSync( "readFile", libloc )).LibraryFolders,
      libs = [],
      loading = [], l, x, y, sel, opt;
  apps = [];
  libs.push( path.join( loc, "steamapps" ));
  l = Object.keys( file );
  for( var x = 0; x < l.length; x++ ) {
    if( l[ x ] !== "TimeNextStatsReport" && l[ x ] !== "ContentStatsID" ) {
      libs.push( file[ l[ x ]]);
    }
  }

  for( x = 0; x < libs.length; x++ ) {
    l = ipc.sendSync( "getFileList", libs[ x ]);
    for( y = 0; y < l.length; y++ ) {
      if( path.parse( l[ y ]).ext === ".acf" ) {
        loading = vdf.parse( ipc.sendSync( "readFile", path.join( libs[ x ], l [ y ]))).AppState;
        if( Object.keys( blacklist ).includes( loading.appid )) {
          logger.info( "Skipped loading blacklisted app \"" + loading.name + "\" (" + loading.appid + ")"  );
        }
        else {
          apps.push({ "appid": loading.appid, "name": loading.name, "state": loading.StateFlags, "aub": loading.AutoUpdateBehavior, "path": path.join( libs[ x ], l[ y ])});
        }
      }
    }
  }

  sel = document.getElementById( "gameList" );
  sel.length = 0;

  // Case-insensitive, descending order, A-Z.
  apps.sort( function compare( a, b ) {
    if( a.name.toUpperCase() < b.name.toUpperCase())
      return -1;
    else if( a.name.toUpperCase() > b.name.toUpperCase())
      return 1;
    return 0;
  });

  for( x = 0; x < apps.length; x++ ) {
    opt = document.createElement( "option" );
    opt.appendChild( document.createTextNode( apps[ x ].name ));
    opt.value = apps[ x ].appid + "|" + apps[ x ].name + "|" + apps[ x ].state + "|" + apps[ x ].aub + "|" + apps[ x ].path;
    sel.appendChild( opt );
  }

  document.getElementById( "numberTotal" ).innerHTML = apps.length;
  document.getElementById( "blacklistTotal" ).innerHTML = Object.keys( blacklist ).length;
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
      launchoptions: {
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
    settings = config.get( "settings" );
    if( settings.hasOwnProperty( "launchOptions") === false ) {
      settings.launchoptions = {
        clearbeta: false,
        console: false,
        developer: false,
        silent: false,
        tcp: false,
        nobpm: false,
        bpm: false,
        bpmMode: 0
      };
    }
    value = parseInt( settings.bg );
    document.getElementById( "bgSettingsList" ).selectedIndex = value;
    if( value === 1 ) {
      document.getElementById( "bgSettingsSolid" ).selectedIndex = parseInt( settings.bgValue );
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
    document.getElementById( "textSettingsColor" ).selectedIndex = parseInt( settings.text );
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
    applyRVSettings( el );
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
  var selected = [], i, val, sel, keys, opt;
  for( i = 0; i < list.length; i++ ) {
    val = list[ i ].value.split( "|" );
    if( list[ i ].selected ) {
      if( val[ 0 ] in blacklist ) {
        alert( "\"" + val[ 1 ] + "\" is already on the blacklist; ignoring it." );
      }
      else {
        selected[ val[ 0 ]] = val[ 1 ];
      }
    }
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

function removeFromBlacklist() {
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
}

function resetBlacklist() {
  if( window.confirm( "Are you sure you want to reset the blacklist?" ) === true ) {
    config.delete( "blacklist" );
    loadBlacklist();
    loadSteamApps( document.getElementById( "installLocation" ).innerHTML );
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
      document.getElementById( "bgSettingsImageCurrent" ).innerHTML = pic.substring( pic.lastIndexOf( "/" ) + 1 );
    }
  }
}

function validateColor( col ) {
  if([
    "red", "pink", "purple", "deep-purple", "indigo",
    "blue", "light-blue", "cyan", "aqua", "teal", "green",
    "light-green", "lime", "sand", "khaki", "yellow", "white",
    "amber", "orange", "deep-orange", "blue-grey", "brown",
    "light-grey", "grey", "dark-grey", "black", "palered",
    "paleyellow", "palegreen", "paleblue", "transparent"
  ].includes( col )) {
    return true;
  }
  return false;
}

function addForcedDownload( app ) {
  app = parseInt( app );
  if( isNaN( app ) === false ) {
    var forcing = {
      AppState: {
        AppID: app,
        Universe: "1",
        installdir: scrapeAppName( app ),
        StateFlags: "1026"
      }
    };
    ipc.sendSync( "writeFile", path.join( steamPath, "steamapps", "appmanifest_" + app + ".acf" ), vdf.stringify( forcing, true ));
    console.log( "Created appmanifest for " + app + "." );
  }
  else {
    alert( "Enter a valid appid for an app to force download first." );
  }
}

function scrapeAppName( appid ) {
  var name;
  $.ajax({
    url: "http://store.steampowered.com/api/appdetails/?appids=" + appid,
    dataType: 'text',
    async: false,
    success: function( info ) {
      name = JSON.parse( info )[ appid ].data.name;
    }
  });
  return name;
}

function resetLaunchOpts() {
  if( settings === undefined ) {
    console.log( "Settings is undefined @ resetLaunchOpts..." );
    settings = {};
  }
  if( settings[ "launchoptions" ] === undefined )
    settings[ "launchoptions" ] = {
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

  document.getElementById( "lo_clearbeta" ).checked = settings.launchoptions.clearbeta;
  document.getElementById( "lo_console" ).checked = settings.launchoptions.console;
  document.getElementById( "lo_developer" ).checked = settings.launchoptions.developer;
  document.getElementById( "lo_silent" ).checked = settings.launchoptions.silent;
  document.getElementById( "lo_tcp" ).checked = settings.launchoptions.tcp;
  lnb.checked = settings.launchoptions.nobpm;
  lb.checked = settings.launchoptions.bpm;
  document.getElementById( "bpmModeList" ).selectedIndex = settings.launchoptions.bpmMode;

  toggleNoBPM( lnb, settings.launchoptions.nobpm );

  console.log( "Launch options have been reset to default." );
}

function saveLaunchOpts() {
  if( settings === undefined ) {
    console.log( "Settings is undefined @ saveLaunchOpts..." );
    settings = {};
  }
  if( settings[ "launchOptions" ] === undefined ) {
    settings[ "launchoptions" ] = {};
  }
  var lnb = document.getElementById( "lo_no_bpm" ),
      lb = document.getElementById( "lo_bpm" );
  settings.launchoptions.clearbeta = document.getElementById( "lo_clearbeta" ).checked;
  settings.launchoptions.console = document.getElementById( "lo_console" ).checked;
  settings.launchoptions.developer = document.getElementById( "lo_developer" ).checked;
  settings.launchoptions.silent = document.getElementById( "lo_silent" ).checked;
  settings.launchoptions.tcp = document.getElementById( "lo_tcp" ).checked;
  settings.launchoptions.nobpm = lnb.checked;
  settings.launchoptions.bpm = lb.checked;
  settings.launchoptions.bpmMode = document.getElementById( "bpmModeList" ).selectedIndex;
  settings.launchoptions.bpmWindowed = document.getElementById( "lo_bpm_windowed" ).checked;
  applyRVSettings( document.getElementById( "bgSettingsList" ));
  console.log( "Launch options have been saved." );
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

  if( process.platform !== "darwin" ) {
    var ll = document.getElementById( "launchLink" );
    if( args.length > 0 ) {
      args.forEach( function( item ) {
        ll.href = "steam:" + item;
        ll.click();
      });
    }
  }
  else {
    if( args.length > 0 ) {
      console.log( "open -a Steam.app --args " + args.join( " " ));
    }
    else {
      console.log( "open -a Steam.app" );
    }
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
    skinPath = path.join( steamPath, "Steam.AppBundle/Steam.app/Contents/MacOS/skins" );
  else
    skinPath = path.join( steamPath, "skins" );

  if( ipc.sendSync( "fileExists", skinPath ) === false )
    alert( "Your Steam installation does not have a skins folder!" );
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

  console.log( skins );
}

function applySteamAppSettings() {
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
    var data = vdf.parse( ipc.sendSync( "readFile", file ));
    if( settings.fix && data.AppState.StateFlags === "6" )
      data.AppState.StateFlags = "4";
    if( data.AppState.AutoUpdateBehavior !== settings.aub )
      data.AppState.AutoUpdateBehavior = settings.aub;
    ipc.sendSync( "writeFile", file, vdf.stringify( data ));
    list[ selected[ i ]].value = data.AppState.appid + "|" + data.AppState.name + "|" + data.AppState.StateFlags + "|" + data.AppState.AutoUpdateBehavior + "|" + file;
  }
}

function applySkinSetting( toWhat, list ) {
  var rand;
  if( toWhat === "<Random>" ) {
    /* Based on code from:
     *   https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Math/random
     */
    var min = 2, // Don't want to select <Default> or <Random>.
        max = list.length - 1;
    rand = Math.floor( Math.random() * ( max - min + 1)) + min;
    toWhat = list[ rand ].text;
  }
  if( toWhat !== "<Default>" && process.platform === "darwin" || process.platform === "linux" ) {
    var regvdf = vdf.parse( ipc.sendSync( "readFile", path.join( steamPath, "registry.vdf" )));
    regvdf.Registry.HKCU.Software.Valve.Steam.SkinV4 = toWhat;
    ipc.sendSync( "writeFile", path.join( steamPath, "registry.vdf" ), vdf.stringify( regvdf, true ));
    console.log( "Changed Steam skin." );
  }
  else if( toWhat !== "<Default>" && process.platform === "win32" ) {
    reg = new Registry({
      hive: Registry.HKCU,
      key: "Software\\Valve\\Steam"
    });
    reg.set( "SkinV4", Registry.REG_SZ, toWhat, function( entry ) {
      if( entry !== toWhat ) {
        console.log( "Failed to set Steam skin!" );
        alert( "Failed to set Steam skin!" );
      }
      else console.log( "Changed Steam skin." );
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

function applyRVSettings( list ) {
  var bg = list.options[ list.selectedIndex ].text,
      value, i, j, el;

  settings.bg = list.selectedIndex;

  if( bg === "Solid" ) {
    el = document.getElementById( "bgSettingsSolid" );
    value = el.options[ el.selectedIndex ].value;
    if( validateColor( value )) {
      document.getElementById( "theBody" ).style = "background: " + value;
      settings.bgValue = el.selectedIndex;
    }
    else {
      alert( "The color value you entered for the background color is invalid." );
    }
    el = document.getElementById( "bgImage" );
    el.style[ "background" ] = "";
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
    document.getElementById( "bgImage" ).style[ "background" ] = "";
  }

  el = document.getElementById( "textSettingsColor" );
  value = el.options[ el.selectedIndex ].value;

  settings.text = el.selectedIndex;

  el = document.getElementById( "theBody" );
  for( i = 0; i < el.classList.length; i++ ) {
    if( el.classList[ i ].indexOf( "w3-text" ) !== -1 ) {
      el.classList.remove( el.classList[ i ]);
    }
  }
  el.classList.add( "w3-text-" + value );

  el = document.getElementById( "aboutView" );
  for( i = 0; i < el.classList.length; i++ ) {
    if( el.classList[ i ].indexOf( "w3-text" ) !== -1 ) {
      el.classList.remove( el.classList[ i ]);
    }
  }
  el.classList.add( "w3-text-" + value );

  config.set( "settings", settings );
  console.log( "Saved RV settings." );
}

function applyUserSettings( auto, loc ) {
  settings.autoLoad = auto;
  settings.autoLoadValue = loc;
  config.set( "settings", settings );
  console.log( "Saved user settings." );
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
  /* Code from or based on
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
         if (selectSingleMatch === true &&
             $(select).children().length === 1) {
           $(select).children().get(0).selected = true;
         }
       });
     });
   };

   $(function() {
     $('#gameList').filterByText($('#searchGames'), false );
   });

   $(function() {
    $('#blackList').filterByText($('#searchBlacklist'), false );
  });
}
