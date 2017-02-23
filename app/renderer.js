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
    defaultSizeG = null,
    defaultSizeB = null,
    logger = require('electron-log'),
    logPath = path.join( app.getPath( "userData" ), "log.txt" ),
    timer;


logger.transports.file.level = 'info';
logger.transports.file.file = logPath;
logger.transports.file.size = 5 * 1024 * 1024; // 5MB.
logger.transports.file.streamConfig = { flags: "a" };

logger.info( "---------------- Begin New ----------------" + eol + eol );
logger.info( logPath );

function openView( evt, viewName ) {
  var i, x, tablinks;
  x = document.getElementsByClassName( "appView" );
  for( i = 0; i < x.length; i++ ) {
    x[ i ].style.display = "none";
  }
  tablinks = document.getElementsByClassName( "tablink" );
  for( i = 0; i < tablinks.length; i++ ) {
    tablinks[ i ].className = tablinks[ i ].className.replace( " active", "" );
  }
  evt.currentTarget.className += " active";

  document.getElementById( viewName ).style.display = "block";

  // Hide the menu in small mode after switching views.
  if( window.innerWidth < 601 ) {
    toggleMenu();
  }
}

function toggleMenu() {
  var x = document.getElementById( "VMenu" );
    x.classList.toggle( "w3-show" );
    x.classList.toggle( "w3-hide" );
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
    logger.info( "Steam directory selected." );
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
  logger.info( selected );

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
  if( loc === "..." ) return logger.info( "Choose a Steam install location first." );
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
        if( Object.keys( blacklist ).includes( loading.appid ) === false )
          apps.push({ "appid": loading.appid, "name": loading.name, "state": loading.StateFlags, "aub": loading.AutoUpdateBehavior, "path": path.join( libs[ x ], l[ y ])});
        else
          logger.info( "Skipped loading blacklisted app \"" + loading.name + "\" (" + loading.appid + ")"  );
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

function loadBlacklist() {
  var i, sel, opt, blacklistKeys;
  if( config.has( "blacklist" ) === false ) {
    logger.info( "There is no blacklist in config." );
    blacklist = {};
    blacklist[ "250820" ] = "SteamVR"; // Blacklist SteamVR
    config.set( "blacklist", blacklist );
  }
  else {
    logger.info( "Loading blacklist from config (" + config.path + ")." );
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
        logger.info( "Ignoring; already-blacklisted: " + val[ 1 ]);
        alert( "\"" + val[ 1 ] + "\" is already on the blacklist; ignoring it." );
      }
      else {
        logger.info( "Adding \"" + val[ 1 ] + "\" to the blacklist." );
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
        logger.info( "Ignoring SteamVR; it must be kept on the blacklist." );
      }
      else {
        selected.push( i );
      }
    }
  }

  for( i = selected.length - 1; i >= 0; i-- ) {
    val = sel[ selected[ i ]].value;
    logger.info( "Removing: " + blacklist[ val ] + " from blacklist." );
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

/* Code from
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
});
