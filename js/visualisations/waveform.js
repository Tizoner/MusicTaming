'use strict'
const scaleLinear = (rangeStart, rangeEnd, domainStart, domainEnd) => {
  const ratio = (rangeEnd - rangeStart) / (domainEnd - domainStart)
  return x => {
    if (
      (domainEnd > domainStart && domainStart > x) ||
      (domainEnd < domainStart && domainStart < x)
    ) return rangeStart
    else if (
      (domainEnd > domainStart && domainEnd < x) ||
      (domainEnd < domainStart && domainEnd > x)
    ) return rangeEnd
    return (x - domainStart) * ratio + rangeStart
  }
}
module.exports = (selector, fftSize) => {
  const width = selector.width
  const step = fftSize / width
  const height = selector.height
  const context = selector.getContext('2d')
  const yScale = scaleLinear(height, 0, -1, 1)
  context.strokeStyle = 'white'
  return data => {
    const prepared = new Float32Array(width);
    for (let i = 0; i < width; i++) {
      prepared[i] = yScale(data[Math.floor(i * step)])
    }
    context.clearRect(0, 0, width, height)
    context.beginPath()
    for (let i = 0; i < width; i++) {
      context.lineTo(i, prepared[i])
    }
    context.stroke()
  }
}

