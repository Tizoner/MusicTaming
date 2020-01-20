'use strict'
let ko = require('knockout')
let visualiserWindow = require('electron').remote.getCurrentWindow()
let ipc = require('electron').ipcRenderer

const noop = function() {}

const ViewModel = function ViewModel() {
  this.files = ko.observableArray([])
  this.files.subscribe(this.listFiles.bind(this))
  this.files.subscribe(this.loadPlayingID3.bind(this))

  this.playingSong = ko.observable(false)
  this.playingSong.subscribe(this.onPlay.bind(this))
  this.nowPlaying = ko.observable('')

  this.playProgress = ko.observable("0:00")
  this.playDuration = ko.observable("0:00")
  this.onPlayPause = noop
  this.isPlaying = noop

  this.dragging = ko.observable(false)
  this.searching = ko.observable(false)
  this.lastFoundFile = ko.observable(null)

  this.loadingSongContents = ko.observable(false)
  this.errorText = ko.observable()
  this.fileList = ko.observableArray([])
  this.onFiles = noop
  this.onRemoveFile = noop

  this.pulloutVisible = ko.observable(true)

  ipc.on('file-search-results', this.onSearchFinished.bind(this))
  ipc.on('file-search-progress', this.onSearchProgress.bind(this))

  ipc.on('id3-result', this.onID3Success.bind(this))
  ipc.on('id3-error', this.onID3Error.bind(this))
}

ViewModel.prototype.onDrag = function(event) {
  this.reset()
  this.dragging(true)
  event.preventDefault()
  event.dataTransfer.dropEffect = "move"
  return false
}

ViewModel.prototype.onDrop = function(event) {
  event.preventDefault()
  const dtFiles = event.dataTransfer.files
  for (let i = 0; i < dtFiles.length; i++) {
    this.fileSearch(dtFiles[i])
  }
  this.dragging(false)
  this.searching(true)
}

ViewModel.prototype.queueFileSearches = function(files) {
  this.fileSearch(files[0]).then(() => {
    if (files.length > 1) {
      this.queueFileSearches(files.slice(1))
    }
  })
}

ViewModel.prototype.fileSearch = function(file) {
  return new Promise((resolve, reject) => {
    ipc.send('file-search', file.path)
    ipc.once('file-search-results', () => resolve())
  })
}

ViewModel.prototype.onSearchFinished = function(event, results) {
  this.searching(false)
  this.lastFoundFile(null)
  this.files(this.files().concat(results))
  this.onFiles(results)
}

ViewModel.prototype.onSearchProgress = function(event, result) {
  this.lastFoundFile(result)
}

ViewModel.prototype.reset = function() {
  this.errorText("")
  this.dragging(false)
  this.loadingSongContents(false)
}

ViewModel.prototype.listFiles = function() {
  const fileNames = this.files().map(function(file) {
    const folderSeparated = file.split(/(\\|\/)/g)
    const dotSeperatedChunks = folderSeparated[folderSeparated.length - 1].split(".")
    const fileExtRemovedChunks = dotSeperatedChunks.slice(0, dotSeperatedChunks.length - 1)
    return fileExtRemovedChunks.join(".")
  })
  this.fileList(fileNames)
}

ViewModel.prototype.loadPlayingID3 = function() {
  const path = this.files()[0]
  ipc.send('id3-parse', path)
}

ViewModel.prototype.onID3Success = function(event, tags) {
  if (tags.title != null && tags.artist != null) {
    this.nowPlaying(tags.title + ' \u2013 ' + tags.artist)
  } else {
    this.onID3Error()
  }
}

ViewModel.prototype.onID3Error = function() {
  this.nowPlaying(this.fileList()[0])
}

ViewModel.prototype.errorDecoding = function() {
  this.reset()
  this.errorText("There was an error decoding the file you dropped.")
}

ViewModel.prototype.togglePullout = function() {
  this.pulloutVisible(!this.pulloutVisible())
}

ViewModel.prototype.removeFile = function(i) {
  this.onRemoveFile(i())
}

ViewModel.prototype.onPlay = function(isPlaying) {
  if (isPlaying) {
    this.pulloutVisible(false)
  }
}

ViewModel.prototype.setProgress = function(progress) {
  this.playProgress(timeFormat(progress))
}

ViewModel.prototype.setDuration = function(time) {
  this.playDuration(timeFormat(time))
}

ViewModel.prototype.playPause = function() {
  this.onPlayPause()
  this.playingSong(this.isPlaying())
}

ViewModel.prototype.minimise = function() {
  visualiserWindow.minimize()
}

ViewModel.prototype.maximise = function() {
  if (!visualiserWindow.isMaximized()) visualiserWindow.maximize()
  else visualiserWindow.restore()
}

ViewModel.prototype.close = function() {
  visualiserWindow.close()
}

module.exports = new ViewModel()

function timeFormat(s) {
  const seconds = Math.floor(s % 60)
  const formattedSeconds = (seconds < 10) ? ("0" + seconds) : seconds
  return Math.floor(s / 60) + ":" + formattedSeconds
}