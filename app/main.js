'use strict';

const electron = require('electron')
// Module to control application life.
const app = electron.app
// Module to create native browser window.
const BrowserWindow = electron.BrowserWindow
// Module to use native dialogs.
const dialog = electron.dialog
// Module to use FileSystem.
const fs = require('fs')

const path = require('path')
const url = require('url')

const ipcMain = require('electron').ipcMain

const logger = require('electron-log')

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
var mainWindow
var logPath = path.join( app.getPath( "userData" ), "log.txt" );

logger.transports.file.level = 'info';
logger.transports.file.file = logPath;
logger.transports.file.size = 5 * 1024 * 1024; // 5MB.
logger.transports.file.streamConfig = { flags: "a" };

function createWindow () {
	// Create the browser window.
	mainWindow = new BrowserWindow({
		title: "ReliefValve",
		frame: false,
		show: false,
		width: 800,
		height: 620,
		"minWidth": 400,
		"minHeight": 620
	})

  // and load the index.html of the app.
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  require('./menu/mainmenu')

  // Emitted when the window is closed.
  mainWindow.on('closed', function () {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })

  mainWindow.on('ready-to-show', function() {
    mainWindow.show();
    mainWindow.focus();
  })

	// Open the DevTools.
	//  mainWindow.webContents.openDevTools()

  /* Code from or based on [pravdomil's comment]:
   * https://github.com/electron/electron/issues/1344
   * Open external URL's in the OS-default browser.
   */

  var handleRedirect = (e, url) => {
    if(url != mainWindow.webContents.getURL()) {
      e.preventDefault()
      require('electron').shell.openExternal(url)
    }
  }

  mainWindow.webContents.on('will-navigate', handleRedirect)
  mainWindow.webContents.on('new-window', handleRedirect)

  console.log( "Logging to:" + logPath );
}

// Make app single-instance.
var shouldQuit = app.makeSingleInstance(function(commandLine, workingDirectory) {
  // Someone tried to run a second instance, we should focus our window
  if (mainWindows) {
    if (mainWindow.isMinimized()) mainWindow.restore();
    mainWindow.focus();
  }
  return true;
});

if (shouldQuit) {
  app.quit();
  return;
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', createWindow)

// Quit when all windows are closed.
app.on('window-all-closed', function () {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function () {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.

ipcMain.on( 'fileExists', function( event, file ) {
  if( file === undefined ) {
    logger.info( "Path is not defined." );
    event.returnValue = "undefined";
  }
  else {
    event.returnValue = fs.existsSync( file );
  }
})

ipcMain.on( 'createDirectory', function( event, dir ) {
  fs.mkdir( dir, function( e ) {
    if( ! e || ( e && e.code === "EEXIST" )) {
      logger.info( "That directory already exists." );
      event.returnValue = false;
    }
    else if( e !== 0 ) {
      event.returnValue = false;
      logger.error( "There was an error creating the directory:\n\n" + e );
    }
    else {
      event.returnValue = true;
    }
  })
})

ipcMain.on( 'getDirectory', function( event ) {
  dialog.showOpenDialog({
    title: "Select a folder",
    properties: ['openDirectory']
    },
    function (folders) {
      if (folders === undefined) {
        event.returnValue = "undefined";
      }
      else {
        event.returnValue = folders[ 0 ];
      }
    }
  )
})

ipcMain.on( 'getFileList', function( event, dir ) {
  var filePaths = [];
  if( dir === undefined ) {
    logger.info( "Path is not defined." );
    event.returnValue = "undefined";
  }
  else {
    var data = fs.readdirSync( dir );
    for( var i = 0, l = data.length; i < l; i++ ) {
      filePaths.push( `${data[ i ]}` );
    }
    event.returnValue = filePaths;
  }
})

ipcMain.on( 'getFile', function( event ) {
  dialog.showOpenDialog(function (fileNames) {
    // fileNames is an array that contains all the selected files.
    if(fileNames === undefined){
      logger.info("No file(s) selected");
      event.returnValue = "undefined";
    } else {
      event.returnValue = fileNames[0] + "";
    }
  })
})

ipcMain.on( 'openFile', function( event ) {
  dialog.showOpenDialog(function (fileNames) {
    // fileNames is an array that contains all the selected files.
    if(fileNames === undefined){
      logger.info("No file(s) selected");
    } else {
      logger.info( `Selected: ${fileNames[0]}` )
      fs.readFile(fileNames[0], 'utf-8', function (err, data) {
        if(err){
            alert("An error ocurred reading the file :" + err.message);
        }
        // Change how to handle the file content
        event.returnValue = data;
      })
    }
  })
})

ipcMain.on( 'saveFile', function( event, file ) {
  dialog.showSaveDialog(function (fileName) {
    if (fileName === undefined) return;
    fs.writeFile(fileName, file, function (err) {
      logger.error;( "An error occured writing the file: " + err.message );
    })
  })
})

ipcMain.on( 'readFile', function( event, file ) {
  var data = fs.readFileSync( file );
  event.returnValue = data.toString();
})

ipcMain.on( 'writeFile', function( event, file, data ) {
  var ret = fs.writeFileSync( file, data );
  event.returnValue = "undefined";
})

/* Code from or based on
 * https://www.loggly.com/blog/node-js-error-handling/
 */
process.on('uncaughtException', (err) => {
    logger.error('Whoops! There was an uncaught error', err);
    // do a graceful shutdown,
    // close the database connection etc.
    process.exit( 1 );
});
