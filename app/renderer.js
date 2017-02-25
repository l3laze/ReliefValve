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
const eol = require('os').EOL;

var apps,
    hasUpdate = false,
    blacklist,
    settings,
    defaultSizeG = null,
    defaultSizeB = null,
    logger = require('electron-log'),
    logPath = path.join( app.getPath( "userData" ), "log.txt" ),
    timer;

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

function handleResize() {
  var gList = document.getElementById( "gameList" ),
      bList = document.getElementById( "blackList" );
  if( defaultSizeG === null || defaultSizeG === undefined ) {
    defaultSizeG = gList.size;
  }
  if( defaultSizeB === null || defaultSizeB === undefined ) {
    defaultSizeB = bList.size;
  }
  if( window.innerWidth < 601 ) {
    gList.size = 3;
    bList.size = 3;
  }
  else {
    gList.size = parseInt( defaultSizeG );
    bList.size = parseInt( defaultSizeB );
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
  }
}

function applySteamAppSettings() {
  var list = document.getElementById( "gameList" ),
      selected = [], i,
      settings = {
        "aub": document.getElementById( "autoUpdateBehaviorList" ).selectedIndex,
        "fix": document.getElementById( "cbOfflineFix" ).checked
      };
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
}

function changeSelection( list ) {
  var selected = [], i, val, total = 0, ready = 0, needUpdate = 0, useless = 0, totalEl, readyEl, updateEl, uselessEl;
  hasUpdate = false;
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
      "bg": "0",
      "bgValue": "...",
      "text": "0",
      "autoLoad": false,
      "autoLoadValue": "..."
    };
    config.set( "settings", settings );
  }
  else {
    settings = config.get( "settings" );
  }

  logger.info( settings );

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
    document.getElementById( "installLocation" ).innerHTML = settings.autoLoadValue;
  }

  el = document.getElementById( "bgSettingsList" );
  changeBGSelection( el );
  applyRVSettings( el );
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

  el = document.getElementById( "autoLoad" );
  settings.autoLoad = el.checked;
  settings.autoLoadValue = document.getElementById( "installLocation" ).innerHTML;

  config.set( "settings", settings );
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

timer = window.setTimeout( "handleResize()", 10 );

process.on('uncaughtException', (err) => {
    logger.error('Whoops! There was an uncaught error', err);
    // do a graceful shutdown,
    // close the database connection etc.
    process.exit( 1 );
})
