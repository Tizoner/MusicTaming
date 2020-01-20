'use strict'
window.AudioContext = window.AudioContext || window.webkitAudioContext
const ctx = new AudioContext()
const analyser = ctx.createAnalyser()
analyser.connect(ctx.destination)
let audioElement
let sourceNode
const audio = {
  stop: () => {
    if (sourceNode) {
      sourceNode.disconnect()
      sourceNode = null
      audio.releasePlayingListeners()
      audioElement.pause()
      audioElement = null
      audio.onEnded()
    }
  },
  playPause: () => {
    if (audioElement) {
      if (audioElement.paused) {
        audioElement.play()
      } else {
        audioElement.pause()
      }
    }
  },
  playFile: file => {
    audio.stop()
    return new Promise((resolve, reject) => {
      if (!audioElement) {
        audioElement = document.createElement('audio')
        audioElement.src = file
        sourceNode = ctx.createMediaElementSource(audioElement)
        sourceNode.connect(analyser)
        const once = (target, event, callback) => {
          const wrappedCallback = () => {
            target.removeEventListener(event, wrappedCallback)
            callback()
          }
          target.addEventListener(event, wrappedCallback)
        }
        once(audioElement, 'playing', resolve)
        once(audioElement, 'error', reject)
        once(audioElement, 'ended', audio.stop)
        audioElement.play()
      }
    })
  },
  bindPlayingListener: callback => {
    audio._callbacks = audio._callbacks ? audio._callbacks.concat(callback) : [callback]
    audioElement.addEventListener('playing', callback)
  },
  releasePlayingListeners: () => {
    audio._callbacks.forEach(callback => {
      audioElement.removeEventListener('playing', callback)
    })
  },
  isPlaying: () => !!sourceNode && (audioElement && !audioElement.paused),
  getFloatWaveform: floatArray => {
    analyser.getFloatTimeDomainData(floatArray)
  },
  getFloatFrequency: floatArray => {
    analyser.getFloatFrequencyData(floatArray)
  },
  getProgress: () => audioElement.currentTime,
  getDuration: () => audioElement.duration,
  fftSize: analyser.fftSize,
  frequencyBinCount: analyser.frequencyBinCount
}
module.exports = audio
