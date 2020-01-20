'use strict'
const average = d => d.reduce((a, x) => a + x, 0) / d.length
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
module.exports = (selector, binCount) => {
  const width = selector.width
  const height = selector.height
  const numberOfBars = Math.floor(width / 10)
  const barWidth = width / (2 * numberOfBars)
  const context = selector.getContext('2d')
  const xScale = scaleLinear(0, width, 0, numberOfBars)
  const yScale = scaleLinear(0, height, -128, 0)
  const scale = scaleLinear(0, 100, -256, 0)
  const hueScale = scaleLinear(255, 0, -120, -50)
  const step = binCount / numberOfBars
  const third = Math.floor(binCount / 3)
  return data => {
    context.clearRect(0, 0, width, height)
    const h = average(data.slice(0, third))
    const s = average(data.slice(0, 3))
    const l = average(data)
    const color = `hsla(${hueScale(h)}, ${scale(s)}%, ${scale(l)}%, `
    for (let i = 0; i < numberOfBars; i++) {
      const barHeight = yScale(average(data.slice(
        Math.floor(i * step),      // lower bound
        Math.floor((i + 1) * step) // upper bound
      )))
      const deltaHeight = height - barHeight
      const gradient = context.createLinearGradient(0, deltaHeight, 0, height)
      gradient.addColorStop(0, color + '1.0)')
      gradient.addColorStop(1, color + '0.0)')
      context.fillStyle = gradient
      context.fillRect(xScale(i), deltaHeight, barWidth, barHeight)
    }
  }
}