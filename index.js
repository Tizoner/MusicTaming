'use strict'
const fs = require('fs')
const path = require('path')
const id3 = require('id3js')
const {app, ipcMain, BrowserWindow} = require('electron')
const { autoUpdater } = require('electron-updater')

class FileSearcher {
  constructor(renderer) {
    this.renderer = renderer
    this.results = []
  }
  _statFile(file) {
    return new Promise((resolve, reject) => {
      fs.stat(file, (err, stats) => resolve(stats))
    })
  }
  _scan(pathToFolder, type) {
    return new Promise((resolve, reject) => {
      const contents = fs.readdir(pathToFolder, (err, foundFiles) => {
        const promises = []
        const folders = []
        foundFiles.forEach(file => {
          const pathToFile = path.join(pathToFolder, file)
          promises.push(this._statFile(pathToFile).then(stats => {
            if (stats.isDirectory()) {
              folders.push(pathToFile)
            } else if (stats.isFile() && pathToFile.toLowerCase().match(type)) {
              this.renderer.send('file-search-progress', pathToFile)
              this.results.push(pathToFile)
            }
          }))
        })
        Promise.all(promises).then(() => {
          resolve({files: [], folders: folders})
        }).catch(e => console.log(e))
      })
    })
  }
  scanForFiles(pathToFolder, type) {
    return new Promise((resolve, reject) => {
      const promise = this._scan(pathToFolder, type)
      let files = []
      const folderPromises = []
      promise.then(results => {
        results.folders.forEach(folder => {
          folderPromises.push(this.scanForFiles(folder, type).then(expandedFiles => {
            files = files.concat(expandedFiles)
          }))
        })

        Promise.all(folderPromises).then(expandedFiles => {
          resolve(this.results)
        })
      })
    })
  }
  startScan(pathToTarget, type) {
    return new Promise((resolve, reject) => {
      this._statFile(pathToTarget).then(stats => {
        if (stats.isFile()) {
          resolve([pathToTarget])
        } else {
          this.scanForFiles(pathToTarget, type).then(files => resolve(files))
        }
      })
    })
  }
}

ipcMain.on('file-search', (event, path) => {
  console.log('file search started for path %s', path)
  let searcher = new FileSearcher(event.sender)
  searcher.startScan(path, /\.(mp3|wav|ogg)/)
    .then((files) => event.sender.send('file-search-results', files))
    .catch((e) => event.sender.send('file-search-error', e))
})

ipcMain.on('id3-parse', (event, path) => {
  id3({file: path, type: id3.OPEN_LOCAL}, (err, tags) => {
    if (tags) event.sender.send('id3-result', tags)
    else event.sender.send('id3-error', err)
  })
})

// Keep a global reference of the window object, if you don't, the window will
// be closed automatically when the JavaScript object is garbage collected.
let mainWindow

function createWindow() {
  // Create the browser window.
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    icon: __dirname + '/build/medium.png',
    // frame: false
  })

  // and load the index.html of the app.
  mainWindow.loadURL('file://' + __dirname + '/index.html')
  // mainWindow.setMenu(null)
  // Emitted when the window is closed.
  mainWindow.on('closed', function() {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    mainWindow = null
  })
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on('ready', () => {
  createWindow()
  autoUpdater.checkForUpdatesAndNotify()
})

// Quit when all windows are closed.
app.on('window-all-closed', function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', function() {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createWindow()
  }
})