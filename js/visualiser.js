'use strict'
const frequency = require('./visualisations/frequency')
const waveform = require('./visualisations/waveform')

module.exports = audio => {
  const frequencySelector = document.querySelector('.frequency')
  const waveformSelector = document.querySelector('.waveform')
  const noop = () => {}
  const visualiser = {}
  let waveformVisualiser
  let frequencyVisualiser


  function initialise() {
    const width = window.innerWidth || document.body.offsetWidth
    const halfHeight = (window.innerHeight || document.body.offsetHeight) / 2

    frequencySelector.setAttribute("width", width)
    frequencySelector.setAttribute("height", halfHeight)
    frequencySelector.style = `
      position: absolute;
      top: 0;
      left: 0;
    `

    waveformSelector.setAttribute("width", width)
    waveformSelector.setAttribute("height", halfHeight)
    waveformSelector.style = `
      position: absolute;
      top: ${halfHeight};
      left: 0;
    `

    // Recreate the visualisers on each resize (no major difference to calling a resize funct)
    waveformVisualiser = waveform(waveformSelector, audio.fftSize)
    frequencyVisualiser = frequency(frequencySelector, audio.frequencyBinCount)
  }

  visualiser.visualise = function() {
    const playing = audio.isPlaying()
    if (playing) {
      const waveformArray = new Float32Array(audio.fftSize)
      audio.getFloatWaveform(waveformArray)
      const frequencyArray = new Float32Array(audio.frequencyBinCount)
      audio.getFloatFrequency(frequencyArray)

      if (isFinite(frequencyArray[0])) {
        frequencyVisualiser(frequencyArray)
        waveformVisualiser(waveformArray)
        visualiser.updateProgress(audio.getProgress())
        visualiser.updateDuration(audio.getDuration())
      }

      requestAnimationFrame(visualiser.visualise)
    }
    visualiser.active = playing
  }

  visualiser.active = false
  visualiser.onResize = initialise
  visualiser.updateDuration = noop
  visualiser.updateProgress = noop

  initialise()

  return visualiser
}