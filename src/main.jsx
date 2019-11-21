import React, { useRef } from 'react'
import PropTypes from 'prop-types'

// NOTE --  Majority of this code is referenced from: https://github.com/alexvandesande/blockies
//          Mostly to ensure congruence to Ethereum Mist's Identicons

// The random number is a js implementation of the Xorshift PRNG
function seedrand(seed) {
  const randseed = new Array(4) // Xorshift: [x, y, z, w] 32 bit values

  for (let i = 0; i < randseed.length; i++) {
    randseed[i] = 0
  }
  for (let i = 0; i < seed.length; i++) {
    randseed[i % 4] =
      (randseed[i % 4] << 5) - randseed[i % 4] + seed.charCodeAt(i)
  }

  // based on Java's String.hashCode(), expanded to 4 32bit values
  return function random() {
    const t = randseed[0] ^ (randseed[0] << 11)

    randseed[0] = randseed[1]
    randseed[1] = randseed[2]
    randseed[2] = randseed[3]
    randseed[3] = randseed[3] ^ (randseed[3] >> 19) ^ t ^ (t >> 8)

    return (randseed[3] >>> 0) / ((1 << 31) >>> 0)
  }
}

function createColor(random) {
  // saturation is the whole color spectrum
  const h = Math.floor(random() * 360)
  // saturation goes from 40 to 100, it avoids greyish colors
  const s = random() * 60 + 40 + '%'
  // lightness can be anything from 0 to 100, but probabilities are a bell curve around 50%
  const l = (random() + random() + random() + random()) * 25 + '%'

  const color = 'hsl(' + h + ',' + s + ',' + l + ')'
  return color
}

function createImageData(size, random) {
  const width = size // Only support square icons for now
  const height = size

  const dataWidth = Math.ceil(width / 2)
  const mirrorWidth = width - dataWidth

  const data = []
  for (let y = 0; y < height; y++) {
    let row = []
    for (let x = 0; x < dataWidth; x++) {
      // this makes foreground and background color to have a 43% (1/2.3) probability
      // spot color has 13% chance
      row[x] = Math.floor(random() * 2.3)
    }
    const r = row.slice(0, mirrorWidth)
    r.reverse()
    row = row.concat(r)

    for (let i = 0; i < row.length; i++) {
      data.push(row[i])
    }
  }

  return data
}

function drawCanvas(
  identicon,
  scale,
  { imageData, color, bgColor, spotColor }
) {
  const width = Math.sqrt(imageData.length)
  const size = width * scale

  identicon.width = size
  identicon.style.width = `${size}px`

  identicon.height = size
  identicon.style.height = `${size}px`

  const cc = identicon.getContext('2d')
  cc.fillStyle = bgColor
  cc.fillRect(0, 0, identicon.width, identicon.height)
  cc.fillStyle = color

  for (let i = 0; i < imageData.length; i++) {
    // if data is 2, choose spot color, if 1 choose foreground
    cc.fillStyle = imageData[i] === 1 ? color : spotColor

    // if data is 0, leave the background
    if (imageData[i]) {
      const row = Math.floor(i / width)
      const col = i % width

      cc.fillRect(col * scale, row * scale, scale, scale)
    }
  }
}

function generateIdenticon({ bgColor, color, seed, size, spotColor }) {
  const random = seedrand(seed)

  // order matters since we are using random()
  if (!color) color = createColor(random)
  if (!bgColor) bgColor = createColor(random)
  if (!spotColor) spotColor = createColor(random)

  return {
    bgColor,
    color,
    imageData: createImageData(size, random),
    spotColor,
  }
}

const Identicon = React.memo(function Identicon({
  bgColor,
  className,
  color,
  scale,
  seed,
  size,
  spotColor,
  ...props
}) {
  const identiconData = generateIdenticon({
    bgColor,
    color,
    seed,
    size,
    spotColor,
  })

  const canvasRef = useRef()

  if (canvasRef.current) {
    drawCanvas(canvasRef.current, scale, identiconData)
  }

  return (
    <canvas
      ref={canvas => {
        canvasRef.current = canvas
        drawCanvas(canvas, scale, identiconData)
      }}
      className={className}
      {...props}
    />
  )
})

Identicon.defaultProps = {
  className: 'identicon',
  scale: 4,
  seed: Math.floor(Math.random() * Math.pow(10, 16)).toString(16),
  size: 8,
}

Identicon.propTypes = {
  bgColor: PropTypes.string,
  className: PropTypes.string,
  color: PropTypes.string,
  scale: PropTypes.number,
  seed: PropTypes.string,
  size: PropTypes.number,
  spotColor: PropTypes.string,
}

export default Identicon
