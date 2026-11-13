/**
 * Jewelry components (beads, charms, spacers) are drawn in the studio by fitting the whole
 * image into a square the size of the piece. An image whose background was removed in an
 * external editor keeps its original canvas, so the piece would be drawn far too small.
 * These helpers crop such an image to a square around the piece.
 *
 * The pure functions work on RGBA pixel arrays so they can be unit tested without a DOM.
 */

export const TRIM_DEFAULTS = Object.freeze({
  // Alpha (0–255) a pixel needs to count as part of the piece; faint halos are ignored.
  alphaThreshold: 16,
  // A row/column counts as content only with at least this share of its pixels...
  minFraction: 0.005,
  // ...and at least this many, so stray specks and dust do not stretch the box.
  minPixels: 2,
  // Transparent margin around the piece, as a share of the square's side.
  margin: 0.02,
  // Larger results are downscaled to this side.
  maxSide: 1024,
})

/**
 * Bounding box of the visible content in an RGBA array.
 * Returns { hasTransparency, bounds } where bounds is { left, top, right, bottom }
 * (inclusive pixel coordinates) or null when no row/column has enough content.
 */
export const findContentBounds = (data, width, height, options = {}) => {
  const { alphaThreshold, minFraction, minPixels } = { ...TRIM_DEFAULTS, ...options }
  const rowCounts = new Uint32Array(height)
  const colCounts = new Uint32Array(width)
  let hasTransparency = false
  for (let y = 0; y < height; y += 1) {
    let offset = y * width * 4 + 3
    for (let x = 0; x < width; x += 1, offset += 4) {
      const alpha = data[offset]
      if (alpha < 255) hasTransparency = true
      if (alpha > alphaThreshold) {
        rowCounts[y] += 1
        colCounts[x] += 1
      }
    }
  }
  const rowMin = Math.max(minPixels, Math.ceil(width * minFraction))
  const colMin = Math.max(minPixels, Math.ceil(height * minFraction))
  const first = (counts, min) => counts.findIndex((count) => count >= min)
  const last = (counts, min) => {
    for (let index = counts.length - 1; index >= 0; index -= 1)
      if (counts[index] >= min) return index
    return -1
  }
  const top = first(rowCounts, rowMin)
  const left = first(colCounts, colMin)
  if (top < 0 || left < 0) return { hasTransparency, bounds: null }
  return {
    hasTransparency,
    bounds: { left, top, right: last(colCounts, colMin), bottom: last(rowCounts, rowMin) },
  }
}

/**
 * Square crop centred on `bounds`: { sx, sy, side } in source pixels (it may extend past the
 * image edges; that area stays transparent) and `outputSide`, the exported size.
 */
export const squareCrop = (bounds, options = {}) => {
  const { margin, maxSide } = { ...TRIM_DEFAULTS, ...options }
  const boxWidth = bounds.right - bounds.left + 1
  const boxHeight = bounds.bottom - bounds.top + 1
  const side = Math.ceil(Math.max(boxWidth, boxHeight) * (1 + margin))
  const centerX = bounds.left + boxWidth / 2
  const centerY = bounds.top + boxHeight / 2
  return {
    sx: centerX - side / 2,
    sy: centerY - side / 2,
    side,
    outputSide: Math.min(side, maxSide),
  }
}

const pngName = (name) => `${(name || 'image').replace(/\.[^./\\]+$/, '')}.png`

const loadImage = async (file) => {
  if (typeof createImageBitmap === 'function') {
    const bitmap = await createImageBitmap(file)
    return { source: bitmap, width: bitmap.width, height: bitmap.height, close: () => bitmap.close() }
  }
  const url = URL.createObjectURL(file)
  try {
    const image = new Image()
    image.src = url
    await image.decode()
    return { source: image, width: image.naturalWidth, height: image.naturalHeight, close() {} }
  } finally {
    URL.revokeObjectURL(url)
  }
}

const canvasBlob = (canvas) =>
  new Promise((resolve, reject) =>
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Unable to export the image.'))),
      'image/png',
    ),
  )

/**
 * Crops transparent space around the piece and returns a square PNG `File` with it centred.
 * Returns the original file unchanged when there is nothing to trim: no transparency (JPEG
 * or fully opaque), no visible content, or an image that is already a tight square.
 */
export const trimTransparentImage = async (file, options = {}) => {
  if (!file || file.type === 'image/jpeg') return file
  const settings = { ...TRIM_DEFAULTS, ...options }
  const image = await loadImage(file)
  try {
    const { width, height } = image
    if (!width || !height) return file
    const canvas = document.createElement('canvas')
    canvas.width = width
    canvas.height = height
    const context = canvas.getContext('2d', { willReadFrequently: true })
    context.drawImage(image.source, 0, 0)
    const { data } = context.getImageData(0, 0, width, height)
    const { hasTransparency, bounds } = findContentBounds(data, width, height, settings)
    if (!hasTransparency || !bounds) return file
    const crop = squareCrop(bounds, settings)
    const alreadyTight =
      width === height &&
      width <= settings.maxSide &&
      bounds.left === 0 &&
      bounds.top === 0 &&
      bounds.right === width - 1 &&
      bounds.bottom === height - 1
    if (alreadyTight) return file

    const output = document.createElement('canvas')
    output.width = crop.outputSide
    output.height = crop.outputSide
    const outputContext = output.getContext('2d')
    outputContext.imageSmoothingEnabled = true
    outputContext.imageSmoothingQuality = 'high'
    // Drawing the whole image shifted and scaled avoids out-of-bounds source rectangles,
    // which some browsers reject; the canvas clips everything outside the square.
    const scale = crop.outputSide / crop.side
    outputContext.drawImage(
      image.source,
      -crop.sx * scale,
      -crop.sy * scale,
      width * scale,
      height * scale,
    )
    const blob = await canvasBlob(output)
    return new File([blob], pngName(file.name), { type: 'image/png', lastModified: Date.now() })
  } finally {
    image.close()
  }
}

export default trimTransparentImage
