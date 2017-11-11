const os = require('os');
const BB = require('bluebird');
const fs = BB.promisifyAll( require('fs'));
const VDF = require('simple-vdf2');
const MyBinVDF = require('./mybinvdf.js');
const SID = require('steamid');

function SteamConfig( blacklisted ) {
  var defaultBlacklist = {
    "250820": "SteamVR"
  };

  this.steamPath = "";
  this.currentUser = -1;
  this.skins = [];
  this.settings = {
    config: {},
    localconfig: {},
    loginusers: [],
    libraryfolders: {},
    sharedconfig: {},
    steamapps: {},
    registry: {}
  };
  this.originalSettings = JSON.parse( JSON.stringify( this.settings ));
  this.blacklist = {
    apps: {},
    libs: [],
    users: []
  };

  if( blacklisted !== undefined ) {
    var blKeys = Object.keys( defaultBlacklist );
    var baKeys = Object.keys( blacklisted.apps );

    for( var i = 0; i < blKeys.length; i++ ) {
      if( baKeys.includes( blKeys[ i ]) === false ) {
        console.info( `Adding app to blacklist: \"${ blKeys[ i ] }\":\"${ defaultBlacklist[ blKeys[ i ]] }\".` );
        blacklisted[ blKeys[ i ]] = JSON.parse( JSON.stringify( defaultBlacklist[ blKeys[ i ]] ));
      }
    }
    this.blacklist.apps = blacklisted.apps;
    this.blacklist.libs = blacklisted.libs;
    this.blacklist.users = blacklisted.users;
  }
  else {
    this.blacklist.apps = defaultBlacklist;
  }
}

function SteamApp( file, data, lib ) {
  this.name = data.AppState.name;
  this.appid = data.AppState.appid;
  this.state = data.AppState.StateFlags;
  this.sizeInBytes = data.AppState.SizeOnDisk;
  this.autoUpdate = data.AppState.AutoUpdateBehavior;
  this.allowDownloadsWhileRunning = data.AppState.AllowOtherDownloadsWhileRunning;
  this.installDir = data.AppState.installdir;
  this.lastUpdated = data.AppState.LastUpdated;
  this.bytesDownloaded = data.AppState.BytesDownloaded;
  this.bytesToDownload = data.AppState.BytesToDownload;
  this.library = lib;
}

/*
 * Meant to store [most of] the actual Steam settings and keep them from being
 *  set to improper values, but hasn't been used yet. - Nov 4th, 2017
 *
    function SteamSetting( va, ty, fi, fr, li = [ 0, 1 ]) {
  var val = va;
  var type = ty;
  var file = fi;
  var from = fr;
  var limits;
  if( type === "boolean" ) {
    va = "" + va;
    if( va !== "false" && va !== "true" ) {
      throw new Error( `Invalid boolean value ${ va }` );
    }
    else {
      val = ( va === "true" ? "1" : "0" );
    }
    limits = li;
  }
  else if( type === "list" ) {
    va = "" + va;
    if( Array.isArray( li )) {
      limits = li.join( ", " );
    }
    else {
      throw new Error( `Invalid limits type ${ typeof( li )}.` );
    }
    if( limits.indexOf( va ) !== -1 ) {
      val = va;
    }
    else {
      throw new Error( `Invalid list value ${ va }; valid: [ ${ limits } ].` );
    }
  }
  else if( type === "number" ) {
    va = parseInt( va );
    if( Number.isNaN( va )) {
      throw new Error( `Invalid number value ${ va }.` );
    }
    else {
      val = va;
    }
    limits = [];
  }
  else if( type === "range" ) {
    if( Array.isArray( li )) {
      limits = {
        min: li[ 0 ],
        max: li[ 1 ]
      };
    }
    else {
      throw new Error( `Invalid limits type ${ typeof( li )}.` );
    }
    va = parseInt( va );
    if( Number.isNaN( va ) || limits.min > va || limits.max < va ) {
      throw new Error( `Invalid value ${ value }; valid: between ${ limits.min } and ${ limits.max } (inclusive).` );
    }
    else {
      val = va;
    }
  }
  else if( type === "string" ) {
    if( typeof( va ) !== "string" ) {
      val = "" + va;
    }
    else {
      val = va;
    }
    limits = "";
  }
  else {
    throw new Error( `Invalid SteamSetting type ${ type }.` );
  }

  var setValue = function( value ) {
    switch( type ) {
      case "boolean":
        value = parseInt( value );
        if( Number.isNaN( value ) || value < 0 || value > 1 ) {
          throw new Error( `Invalid setting value ${value}; valid: [ ${ limits.join( ", " )} ].` );
        }
        else {
          val = value;
        }
      break;
      case "list":
        if( limits.join( "," ).indexOf( value ) === -1 ) {
          throw new Error( `Invalid setting value ${ value }; valid: ${ limits }` );
        }
        else {
          val = value;
        }
      break;
      case "number":
        value = parseInt( value );
        if( Number.isNaN( value )) {
          throw new Error( `Invalid number value ${ value }.` );
        }
        else {
          val = value;
        }
      break;
      case "range":
        value = parseInt( value );
        if( value < limits.min || value > limits.max ) {
          throw new Error( `Invalid value ${ value }; valid: between ${ limits.min } and ${ limits.max } (inclusive).` );
        }
        else {
          val = value;
        }
      break;
      case "string":
        if( typeof( va ) !== "string" ) {
          val = "" + va;
        }
        else {
          val = va;
        }
      break;
    }
  };
  var getValue = function() {
    return val;
  };
  var getFile = function() {
    return file;
  };
  var getLocation = function() {
    return from;
  };
  var getLimits = function() {
    return limits;
  };
}
*/

async function loadTextVDF( file ) {
  return VDF.parse( "" + await fs.readFileAsync( file ));
}

SteamConfig.prototype.loadAppInfo = async function loadAppInfo() {
  var app_entries = {};
  var appinfo;
  var data;
  var item;

  try {
    appinfo = await fs.readFileAsync( path.join( this.steamPath, "appcache", "appinfo.vdf" ));
    data = MyBinVDF.readAppInfo( appinfo );
    for( var i = 0; i < data.length; i++ ) {
      item = data[ i ];

      if( item.entries && item.entries.common && item.entries.common.type.toLowerCase() === "game" && item.entries.common.name && item.entries.extended ) {
        app_entries[ item.entries.appid ] = {
          appid: item.entries.appid,
          name: item.entries.common.name,
          oslist: item.entries.common.oslist || item.entries.extended.validoslist || [],
          controller_support: item.entries.common.controller_support || "",
          metacritic_score: item.entries.common.metacritic_score || "",
          developer: item.entries.extended.developer || "",
          publisher: item.entries.extended.publisher || "",
          languages: ( item.entries.extended.languages !== undefined ? item.entries.extended.languages : ( item.entries.common.languages !== undefined ? Object.keys( item.entries.common.languages ) : [] )),
          /*
          dlc: ( item.entries.extended.listofdlc !== undefined ? getDLCList( data, item.entries.extended.listofdlc ) : [] ),
          */
          homepage: item.entries.extended.homepage || "",
          saves: ( item.entries.ufs !== undefined && item.entries.ufs.savefiles !== undefined ? item.entries.ufs.savefiles : "" )
        };
      }
    }
  }
  catch( err ) {
    console.error( err.stack );
    alert( err );
  }

  console.info( `Finished loading appinfo.vdf @ ${Object.keys( app_entries ).length} entries.` );

  return app_entries;
}

SteamConfig.prototype.loadSteamApps = async function loadSteamApps( steam ) {
  var lfPath = path.join( steam, "steamapps", "libraryfolders.vdf" );
  var lfData = await loadTextVDF( lfPath );
  var lfKeys = Object.keys( lfData.LibraryFolders );
  var libs = [];
  var apps = {};
  var steamApp = {};
  var libPath = "";
  var appFiles = [];
  var blacklistedApps = Object.keys( this.blacklist.apps );

  libs.push( steam );

  for( var i = 0; i < lfKeys.length; i++ ) {
    if( lfKeys[ i ] !== "TimeNextStatsReport" && lfKeys[ i ] !== "ContentStatsID" ) {
      if( this.blacklist.libs.includes( lfData.LibraryFolders[ lfKeys[ i ]]) === false ) {
        libs.push( lfData.LibraryFolders[ lfKeys[ i ]]);
      }
      else {
        console.info( `Skipping blacklisted library ${ lfData.LibraryFolders[ lfKeys[ i ]] }` );
      }
    }
  }

  for( var x = 0; x < libs.length; x++ ) {
    libPath = path.join( libs[ x ], "steamapps" );
    appFiles = await fs.readdirAsync( libPath );

    for( var y = 0; y < appFiles.length; y++ ) {
      if( appFiles[ y ].indexOf( "appmanifest" ) !== -1 ) {
        steamApp = new SteamApp( appFiles[ y ], await loadTextVDF( path.join( libPath, appFiles[ y ])), libs[ x ]);
        if( blacklistedApps.includes( steamApp.appid ) === false ) {
          this.originalSettings.steamapps[ steamApp.appid ] = "" + await fs.readFileAsync( path.join( libPath, appFiles[ y ]));
          apps[ steamApp.appid ] = steamApp;
        }
        else {
          console.info( `Skipping blacklisted app ${ steamApp.appid } (${ steamApp.name }).` );
        }
      }
    }
  }

  this.settings.libraryfolders = libs;
  this.settings.steamapps = apps;
}

SteamConfig.prototype.loadSkins = async function loadSkins( steam ) {
  var skinList = [ "Default" ];
  var skinPath;
  var skinFiles;
  if( os.platform().indexOf( "darwin" ) !== -1 ) {
    skinPath = path.join( steam, "Steam.AppBundle", "Steam", "Contents", "MacOS", "skins" );
  }
  else if( os.platform().indexOf( "win32" ) !== -1 ) {
    skinPath = path.join( steam, "skins" );
  }
  else {
    throw new Error( "Unsupported OS" );
  }

  var skinFiles = fs.readdirAsync( skinPath );

  for( var i = 0; i < skinFiles.length; i++ ) {
    if( skinFiles[ i ] !== "skins_readme.txt" && skinFiles[ i ] !== ".DS_Store" ) {
      skinList.push( skinFiles[ i ]);
    }
  }

  this.skins = skinList;
}

SteamConfig.prototype.loadLoginUsers = async function loadLoginUsers( steam ) {
  var llpath = path.join( steam, "config", "loginusers.vdf" );
  var orig = "" + await fs.readFileAsync( llpath );
  var data = await loadTextVDF( llpath );
  var userKeys = Object.keys( data.users );
  var users = [];

  if( userKeys.length < 1 ) {
    throw new Error( "No users found in \"loginusers.vdf\"." );
  }

  for( var i = 0; i < userKeys.length; i++ ) {
    //  console.info( `Found user: ${data.users[ userKeys[ i ]].AccountName} (${userKeys[ i ]}).` );
    if( this.blacklist.users.includes( data.users[ userKeys[ i ]].AccountName ) === false ) {
      users.push({
        accountName: data.users[ userKeys[ i ]].AccountName,
        personaName: data.users[ userKeys[ i ]].PersonaName,
        rememberPassword: data.users[ userKeys[ i ]].RememberPassword,
        wantsOfflineMode: data.users[ userKeys[ i ]].WantsOfflineMode || 0,
        skipOfflineWarning: data.users[ userKeys[ i ]].SkipOfflineWarning || 0,
        id64: "" + userKeys[ i ],
        id3: "" + this.getID3( userKeys[ i ])
      });
    }
  }

  this.settings.loginusers = users;
  this.originalSettings.loginusers = orig;
};

SteamConfig.prototype.loadConfig = async function loadConfig( steam ) {
  var cPath = path.join( steam, "config", "config.vdf" );
  var orig = "" + await fs.readFileAsync( cPath );
  var data = await loadTextVDF( cPath );

  this.originalSettings.config = orig;
  this.settings.config = {
    autoUpdateRangeEnabled: data.InstallConfigStore.Software.Valve.Steam.AutoUpdateWindowEnabled,
    autoUpdateRangeStart: data.InstallConfigStore.Software.Valve.Steam.AutoUpdateWindowStart,
    autoUpdateRangeEnd: data.InstallConfigStore.Software.Valve.Steam.AutoUpdateWindowEnd,
    dontSavePersonalInfo: data.InstallConfigStore.Software.Valve.Steam.NoSavePersonalInfo,
    maxServerBrowserPingsPerMin: data.InstallConfigStore.Software.Valve.Steam.MaxServerBrowserPingsPerMin,
    downloadThrottleKbps: data.InstallConfigStore.Software.Valve.Steam.DownloadThrottleKbps,
    allowDownloadsDuringGameplay: data.InstallConfigStore.Software.Valve.Steam.AllowDownloadsDuringGameplay,
    streamingThrottleEnabled: data.InstallConfigStore.Software.Valve.Steam.StreamingThrottleEnabled,
    clientBrowserAuth: data.InstallConfigStore.Software.Valve.Steam.ClientBrowserAuth,
    searchSteamFoldersForMusic: data.InstallConfigStore.Music.CrawlSteamInstallFolders,
    searchForMusicAtStartup: data.InstallConfigStore.Music.CrawlAtStartup,
    logSearchForMusic: data.InstallConfigStore.Music.LogCrawling,
    nowPlayingNotification: data.InstallConfigStore.Music.PlaylistNowPlayingNotification,
    pauseOnVoiceChat: data.InstallConfigStore.Music.PauseOnVoiceChat,
    pauseOnAppLaunch: data.InstallConfigStore.Music.PauseOnAppStartedProcess,
    musicVolume: data.InstallConfigStore.Music.MusicVolume
  };
}

SteamConfig.prototype.loadRegistry = async function loadRegistry( steam ) {
  var rPath = path.join( steam, "registry.vdf" );
  var orig = "" + await fs.readFileAsync( rPath );
  var data = await loadTextVDF( rPath );

  this.originalSettings.registry = orig;
  this.settings.registry = {
    autologinUser: data.Registry.HKCU.Software.Valve.Steam.AutoLoginUser,
    language: data.Registry.HKCU.Software.Valve.Steam.language,
    skin: data.Registry.HKCU.Software.Valve.Steam.SkinV4
  };
}

SteamConfig.prototype.loadSharedConfig = async function loadSharedConfig( steam ) {
  var orig;
  var data;
  var apps;
  var hadErr = false;
  var canContinue = true;

  this.settings.sharedconfig = undefined;

  try {
    var scPath = path.join( steam, "userdata", this.settings.loginusers[ this.currentUser ].id3, "7", "remote", "sharedconfig.vdf" );
    orig = "" + await fs.readFileAsync( scPath );
    data = await loadTextVDF( scPath );
    apps = data.UserRoamingConfigStore.Software.Valve.Steam.Apps;

    this.originalSettings.sharedconfig = orig;
    this.settings.sharedconfig = {
      apps: apps,
      favoriteWindow: data.UserRoamingConfigStore.Software.Valve.Steam.SteamDefaultDialog,
      missing: []
    };

    var aPath = path.join( this.steamPath, "appcache", "appinfo.vdf" );
    var orig = "" + await fs.readFileAsync( aPath );

    /* Don't really want to keep the original...it's quite large.
     *  this.originalSettings.appinfo = orig;
     */

    var appinfo = await this.loadAppInfo( this.steamPath );

    var appinfoKeys = Object.keys( this.settings.sharedconfig.apps );
    var missingAI = [];

    for( var i = 0; i < appinfoKeys.length; i++ ) {
      if( appinfo[ appinfoKeys[ i ]]) {
        this.settings.sharedconfig.apps[ appinfoKeys[ i ]].appinfo = appinfo[ appinfoKeys[ i ]];
      }

      if( this.settings.sharedconfig.apps[ appinfoKeys[ i ]].appinfo === undefined ) {
        missingAI.push( appinfoKeys[ i ]);
      }
    }

    console.info( "Missing entries: " + missingAI.length );
    this.settings.sharedconfig.missing = missingAI;
  }
  catch( err ) {
    if( err.message.indexOf( "ENOENT" ) !== -1 ) {
      console.info( "Missing sharedconfig.vdf, or error loading it...using defaults." );
      alert( "Selected user doesn't have a sharedconfig.vdf, or there was an error loading it; using defaults.." );
      hadErr = true;
    }
    else {
      alert( "Error loading localconfig.vdf; please submit a bug report." );
      console.info( err.stack );
      hadErr = true;
      canContinue = false;
    }
  }
  finally {
    if( hadErr && canContinue ) {
      this.settings.sharedconfig = {
        apps: [],
        favoriteWindow: "#app_store",
        missing: []
      };
    }
  }
};

SteamConfig.prototype.loadLocalConfig = async function loadLocalConfig( steam ) {
  var orig;
  var data;
  var hadErr = false;
  var canContinue = true;

  try {
    var lcPath = path.join( steam, "userdata", this.settings.loginusers[ this.currentUser ].id3, "config", "localconfig.vdf" );
    orig = "" + await fs.readFileAsync( lcPath );
    data = await loadTextVDF( lcPath );
    this.settings.localconfig = {
      friendsStatus: data.UserLocalConfigStore.friends.PersonaStateDesired || "0",
      voiceReceiveVolume: data.UserLocalConfigStore.friends.VoiceReceiveVolume || "0",
      joinsGameNotification: data.UserLocalConfigStore.friends.Notifications_ShowIngame || "0",
      joinsGameSound: data.UserLocalConfigStore.friends.Sounds_PlayIngame || "0",
      comesOnlineNotification: data.UserLocalConfigStore.friends.Notifications_ShowOnline || "0",
      comesOnlineSound: data.UserLocalConfigStore.friends.Sounds_PlayOnline || "0",
      messageNotification: data.UserLocalConfigStore.friends.Notifications_ShowMessage || "0",
      messageSound: data.UserLocalConfigStore.friends.Sounds_PlayMessage || "0",
      groupEventNotification: data.UserLocalConfigStore.friends.Notifications_EventsAndAnnouncements || "0",
      groupEventSound: data.UserLocalConfigStore.friends.Sounds_EventsAndAnnouncements || "0",
      flashWindowForNewMessage: data.UserLocalConfigStore.friends.ChatFlashMode || "0",
      showFriendsInOverlay: data.UserLocalConfigStore.friends.ShowFriendsPanelInOverlay || "0",
      autoSignIntoFriends: data.UserLocalConfigStore.friends.AutoSignIntoFriends || "0",

      showFriendsOnStartup: data.UserLocalConfigStore[ "StartupState.Friends" ] || "0",
      showNewsOnStartup: data.UserLocalConfigStore.News.NotifyAvailableGames || "0",

      usePushToTalk: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.UsePushToTalk : "0" ),
      pushToTalkKey: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.PushToTalkKey : "0" ),
      overlayHomepage: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.GameOverlayHomePage : "" ),
      enableOverlay: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.EnableGameOverlay : "0" ),
      overlayShortcut: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayShortcutKey : "" ),
      screenshotNotification: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayScreenshotNotification : "0" ),
      screenshotSound: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayScreenshotPlaySound : "0" ),
      saveUncompressedScreenshot: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayScreenshotSaveUncompressed : "0" ),
      fpsCounterContrast: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayShowFPSContrast : "0" ),
      fpsCounterPosition: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayShowFPSCorner : "0" ),
      screenshotShortcut: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.InGameOverlayScreenshotHotKey : "" ),
      addressBar: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.NavUrlBar : "0" ),
      displayRatesAsBits: ( data.UserLocalConfigStore.system !== undefined ? data.UserLocalConfigStore.system.displayratesasbits : "0" )
    }
  }
  catch( err ) {
    if( err.message.indexOf( "ENOENT" ) !== -1 ) {
      console.info( "Missing localconfig.vdf, or error loading it...using defaults." );
      alert( "Selected user doesn't have a localconfig.vdf, or there was an error loading it; using defaults.." );
      hadErr = true;
    }
    else {
      alert( "Error loading localconfig.vdf; please submit a bug report." );
      console.info( err );
      hadErr = true;
      canContinue = false;
    }
  }
  finally {
    if( hadErr && canContinue ) {
      this.settings.localconfig = {
        friendsStatus: "0",
        voiceReceiveVolume: "0",
        joinsGameNotification: "0",
        joinsGameSound: "0",
        comesOnlineNotification: "0",
        comesOnlineSound: "0",
        messageNotification: "0",
        messageSound: "0",
        groupEventNotification: "0",
        groupEventSound: "0",
        flashWindowForNewMessage: "0",
        showFriendsInOverlay: "0",
        autoSignIntoFriends: "0",
        showFriendsOnStartup: "0",
        showNewsOnStartup: "0",
        usePushToTalk: "0",
        pushToTalkKey: "0",
        overlayHomepage: "",
        enableOverlay: "0",
        overlayShortcut: "",
        screenshotNotification: "0",
        screenshotSound: "0",
        saveUncompressedScreenshot: "0",
        fpsCounterContrast: "0",
        fspCounterPosition: "0",
        screenshotShortcut: "",
        addressBar: "0",
        displayRatesAsBits: "0"
      }
    }
  }
}

SteamConfig.prototype.loadCommonData = async function loadSteamCommonData( steam, progressCallback ) {
  await this.loadLoginUsers( steam );
  console.info( "Got loginusers.vdf..." );
  progressCallback( 5 );

  await this.loadConfig( steam );
  console.info( "Got config.vdf..." );
  progressCallback( 5 );

  await this.loadRegistry( steam );
  console.info( "Got registry.vdf..." );
  progressCallback( 5 );

  await this.loadSteamApps( steam );
  console.info( "Got libraryfolders.vdf + steamapps..." );
  progressCallback( 20 );

  await this.loadSkins( steam );
  console.info( "Got skins..." );
  progressCallback( 5 );
};

SteamConfig.prototype.loadUserData = async function loadUserData( steam, progressCallback, alone ) {
  var half = 0;

  if( alone ) {
    half = 50;
  }
  else {
    half = 30;
  }

  if( this.currentUser !== undefined && JSON.stringify( this.currentUser ) !== "{}" ) {

    await this.loadSharedConfig( steam );
    console.info( "Got sharedconfig.vdf..." );
    progressCallback( half );

    await this.loadLocalConfig( steam );
    console.info( "Got localconfig.vdf..." );
    progressCallback( half );
  }
  else {
    console.info( "Multiple users, no user set; can't load private data" );
    progressCallback( half + half );
    alert( "There are multiple users; set a user to load private user data." );
  }
};

SteamConfig.prototype.loadSteam = async function loadSteam( steamPath, progressCallback ) {
  console.info( "Loading common data..." );
  this.progress = 0;
  progressCallback( 0 );
  try {
    this.steamPath = "" + steamPath;
    await this.loadCommonData( "" + steamPath, progressCallback );
    await this.loadUserData( "" + steamPath, progressCallback, false );
  }
  catch( err ) {
    alert( err );
  }
};

SteamConfig.prototype.setUser = function setUser( accountName ) {
  this.currentUser = -1;

  for( var i = 0; i < this.settings.loginusers.length; i++ ) {
    if( this.settings.loginusers[ i ].accountName === accountName ) {
      this.currentUser = i;
    }
  }

  if( this.currentUser === -1 ) {
    throw new Error( `Invalid user: ${ accountName }.` );
  }
};

SteamConfig.prototype.getUserNames = function getUserNames() {
  var usernames = [];

  for( var i = 0; i < this.settings.loginusers.length; i++ ) {
    usernames.push( this.settings.loginusers[ i ].accountName );
  }

  return usernames;
};

SteamConfig.prototype.getAppNames = function getAppNames() {
  var appNames = [];
  var appKeys = Object.keys( this.settings.steamapps );

  for( var i = 0; i < appKeys.length; i++ ) {
    appNames.push( this.settings.steamapps[ appKeys[ i ]].name );
  }

  return appNames;
};

SteamConfig.prototype.getBlacklistedAppNames = function getBlacklistedAppNames() {
  var names = [],
      blKeys = Object.keys( this.blacklist.apps );

  for( var i = 0; i < blKeys.length; i++ ) {
    names.push( this.blacklist.apps[ blKeys[ i ]]);
  }

  return names;
};

SteamConfig.prototype.getDefaultLocation = function getDefaultLocation() {
  if( os.platform().indexOf( "darwin" ) !== -1 ) {
    return path.join( app.getPath( "appData" ), "Steam" );
  }
  else if( os.platform().indexOf( "linux" ) !== -1 ) {
    return path.join( app.getPath( "home" ), ".share", "steam" );
  }
  else if ( os.platform().indexOf( "win32" ) !== -1 ) {
    if( fs.existsSync( path.join( "C:", "Program Files (x86)" ))) {
      return path.join( "C:", "Program Files (x86)", "Steam" );
    }
    else {
      return path.join( "C:", "Program Files", "Steam" );
    }
  }
  else {
    throw new Error ( "Unknown default location for this OS; sorry." );
  }
};

SteamConfig.prototype.toValveKeyCode = function toValveKeyCode( key ) {
  if( key === "[" ) {
    return "KEY_LBRACKET";
  }
  else if( key === "]" ) {
    return "KEY_RBRACKET";
  }
  else if( key === " " ) {
    return "KEY_SPACE";
  }
  else if( key === "/" ) {
    return "KEY_SLASH";
  }
  else if( key === "\\" ) {
    return "KEY_BACKSLASH";
  }
  else if( key === "," ) {
    return "KEY_COMMA";
  }
  else if( key === "." ) {
    return "KEY_PERIOD";
  }
  else if( key === ";" ) {
    return "KEY_SEMICOLON";
  }
  else if( key === "'" ) {
    return "KEY_APOSTROPHE";
  }
  else if( key === "-" ) {
    return "KEY_MINUS";
  }
  else if( key === "=" ) {
    return "KEY_NONE";
    /*
      if( os.platform().indexOf( "darwin" ) !== -1 ) {
        retVal = "None";
      }
    */
  }
  else if( key === "`" ) {
    return "KEY_BACKQUOTE";
  }
  else if( key === "ArrowUp" ) {
    return "KEY_UP";
  }
  else if( key === "ArrowDown" ) {
    return "KEY_DOWN";
  }
  else if( key === "ArrowLeft" ) {
    return "KEY_LEFT";
  }
  else if( key === "ArrowRight" ) {
    return "KEY_RIGHT";
  }
  else {
    return "KEY_" + key.toUpperCase();
  }
};

SteamConfig.prototype.getID3 = function getID3( id64 ) {
  return "" + ( new SID( id64 ).accountid );
};

SteamConfig.prototype.getUserIndex = function getUserIndex( accountName ) {
  for( var i = 0; i < this.settings.loginusers.length; i++ ) {
    if( this.settings.loginusers[ i ].accountName === accountName ) {
      return i;
    }
  }

  throw new Error( `Couldn't find ${ accountName }.` );
};

module.exports = {
  SteamConfig: SteamConfig
};
