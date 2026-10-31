import { centsToEuros, eurosToCents } from '../apparel/apparelHelpers'

/** Sticker shapes the app can draw and the workshop can cut. */
export const stickerShapes = {
  SQUARE: 'Square',
  CIRCLE: 'Circle',
  RECTANGLE: 'Rectangle',
  OVAL: 'Oval',
}
/** Square and circle stickers have one size: the side, or the diameter. */
export const equalSides = (shape) => shape === 'SQUARE' || shape === 'CIRCLE'
/** The largest sticker that can be produced: 7 × 7 cm (stored as 70 mm). */
export const MAX_STICKER_CM = 7

const cmText = (mm) => (Number.isFinite(mm) ? String(mm / 10) : '')

/** A sticker size as the app shows it, e.g. "5 cm" for a circle or "7 × 4 cm". */
export const stickerSizeLabel = (size) =>
  size.shape === 'CIRCLE'
    ? `⌀ ${cmText(size.widthMm)} cm`
    : `${cmText(size.widthMm)} × ${cmText(size.heightMm)} cm`

/** Sticker sizes as the form edits them: centimetres and euros. */
export const stickerFormSizes = (sizes = []) =>
  sizes
    .filter((size) => size && stickerShapes[size.shape])
    .map((size) => ({
      id: size.id,
      name: size.name,
      shape: size.shape,
      widthCm: cmText(size.widthMm),
      heightCm: cmText(size.heightMm),
      price: centsToEuros(size.price),
    }))

/** Centimetres as typed ("5", "4.5", "4,5") to whole millimetres, at most 7 cm. */
const stickerMm = (value, label) => {
  const text = String(value ?? '')
    .trim()
    .replace(',', '.')
  if (!/^\d+(?:\.\d)?$/.test(text))
    throw new Error(`${label} must be in cm with at most one decimal, e.g. 5 or 4.5.`)
  const mm = Math.round(Number(text) * 10)
  if (mm < 1 || mm > MAX_STICKER_CM * 10)
    throw new Error(`${label} must be between 0.1 and ${MAX_STICKER_CM} cm.`)
  return mm
}

/** Validated sticker sizes in millimetres and cents; throws a readable Error. */
export const stickerSizesPayload = (sizes = []) => {
  const ids = new Set()
  return sizes.map((size, index) => {
    const shape = size.shape
    if (!stickerShapes[shape]) throw new Error(`Sticker size ${index + 1}: choose a shape.`)
    const label = `Sticker size ${index + 1} (${stickerShapes[shape]})`
    const widthMm = stickerMm(
      size.widthCm,
      `${label}: ${shape === 'CIRCLE' ? 'diameter' : 'width'}`,
    )
    const heightMm = equalSides(shape) ? widthMm : stickerMm(size.heightCm, `${label}: height`)
    const name = size.name.trim() || stickerSizeLabel({ shape, widthMm, heightMm })
    // The shape is part of the id, so a 5 cm square and a 5 cm circle stay distinct.
    const id = `${shape.toLowerCase()}-${widthMm}x${heightMm}`
    if (ids.has(id)) throw new Error(`${label}: this shape and size is listed twice.`)
    ids.add(id)
    return {
      id,
      name,
      shape,
      widthMm,
      heightMm,
      price: eurosToCents(size.price, `${label}: price`),
    }
  })
}
