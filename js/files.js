'use strict'
module.exports = (viewModel, audio, visualiser) => {
  let _files = []
  let _playingFile = null
  const fileManipulator = {
    onUpdate: () => {
      viewModel.files(_files)
    },
    add: files => {
      const autoplay = _files.length === 0
      _files = _files.concat(files)
      fileManipulator.onUpdate()
      if (autoplay) fileManipulator.playFile()
    },
    remove: i => {
      const victimFile = _files[i]
      _files.splice(i, 1)
      if (victimFile === _playingFile) audio.stop()
      fileManipulator.onUpdate()
    },
    playFile: () => {
      if (_files[0]) {
        audio.playFile(_files[0]).then(
          () => {
            _playingFile = _files[0]
            viewModel.loadingSongContents(false)
            viewModel.playingSong(true)
            if (!visualiser.active) visualiser.visualise()
            // On play/pause, restart the visualiser.
            audio.bindPlayingListener(visualiser.visualise)
          },
          () => {
            viewModel.errorDecoding.call(viewModel)
            fileManipulator.remove(0)
          }
        )
      }
    },
    onEnded: () => { // Remove the playing file
      _files = _files.filter(file => file !== _playingFile)
      _playingFile = null
      viewModel.playingSong(false)
      fileManipulator.onUpdate()
      fileManipulator.playFile()
    }
  }
  return fileManipulator
}