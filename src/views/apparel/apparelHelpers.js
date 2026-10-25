export const silhouettes = { HOODIE: 'Hoodie', TSHIRT: 'T-Shirt' }
export const presetSizes = ['XS', 'S', 'M', 'L', 'XL', 'XXL']
export const designTypes = { ICON: 'Icon', LOGO: 'Logo', LETTERING: 'Lettering', ILLUSTRATION: 'Illustration' }
export const LOW_STOCK = 4

export const defaultPrintArea = (side = 'front') =>
  side === 'back'
    ? { x: 0.25, y: 0.22, width: 0.5, height: 0.5, widthCm: 35, heightCm: 40 }
    : { x: 0.3, y: 0.28, width: 0.4, height: 0.42, widthCm: 30, heightCm: 40 }

/** Euro text such as "35" or "35.5" to cents; '' stays null when allowed. */
export const eurosToCents = (value, label = 'Price', optional = false) => {
  const euros = String(value ?? '').trim().replace(',', '.')
  if (!euros) {
    if (optional) return null
    throw new Error(`${label} is required.`)
  }
  if (!/^\d+(?:\.\d{1,2})?$/.test(euros))
    throw new Error(`${label} must be a nonnegative euro amount with at most two decimals.`)
  const [whole, decimal = ''] = euros.split('.')
  const cents = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
  if (!Number.isSafeInteger(cents) || cents > 2147483647)
    throw new Error(`${label} exceeds the supported range.`)
  return cents
}
export const centsToEuros = (cents) =>
  cents === null || cents === undefined || cents === '' ? '' : (Number(cents) / 100).toFixed(2)

const round = (value) => Math.round(value * 10000) / 10000
const MIN_SIZE = 0.02

/** Keeps a print area inside the mockup: positive size, x + width ≤ 1, y + height ≤ 1. */
export const clampArea = (area) => {
  const width = Math.min(Math.max(Number(area.width) || MIN_SIZE, MIN_SIZE), 1)
  const height = Math.min(Math.max(Number(area.height) || MIN_SIZE, MIN_SIZE), 1)
  return {
    ...area,
    x: round(Math.min(Math.max(Number(area.x) || 0, 0), 1 - width)),
    y: round(Math.min(Math.max(Number(area.y) || 0, 0), 1 - height)),
    width: round(width),
    height: round(height),
  }
}

export const printAreaPayload = (area, label) => {
  if (!area) return null
  const result = clampArea(area)
  for (const key of ['widthCm', 'heightCm']) {
    const raw = area[key]
    if (raw === '' || raw === null || raw === undefined) {
      delete result[key]
      continue
    }
    const cm = Number(raw)
    if (!Number.isFinite(cm) || cm <= 0 || cm > 200)
      throw new Error(`${label}: real print size must be between 0 and 200 cm.`)
    result[key] = cm
  }
  return result
}

// ---------- Sizes & inventory ----------

/** Editable rows from a product's stored sizes: [{ size: 'M', stock: '28' }]. */
export const sizeRows = (sizes) =>
  (Array.isArray(sizes) ? sizes : []).map((entry) => ({
    size: entry.size,
    stock: String(entry.stock ?? 0),
  }))

/** Validated sizes for the API; an empty list means the product is not sold in sizes. */
export const sizesPayload = (rows) => {
  const seen = new Set()
  return rows.map((row, index) => {
    const size = row.size.trim()
    if (!size || size.length > 20) throw new Error(`Size ${index + 1}: enter a size of 1–20 characters.`)
    if (seen.has(size.toLowerCase())) throw new Error(`Size ${size} is listed twice.`)
    seen.add(size.toLowerCase())
    const stock = Number(row.stock)
    if (!String(row.stock).trim() || !Number.isInteger(stock) || stock < 0 || stock > 2147483647)
      throw new Error(`Size ${size}: stock must be a nonnegative whole number.`)
    return { size, stock }
  })
}

/** "S 20 · M 28 · L 35", or null for an unsized product. */
export const sizeSummary = (sizes) =>
  Array.isArray(sizes) && sizes.length
    ? sizes.map((entry) => `${entry.size} ${entry.stock}`).join(' · ')
    : null

export const totalSizeStock = (sizes) =>
  (Array.isArray(sizes) ? sizes : []).reduce((sum, entry) => sum + (entry.stock || 0), 0)

// ---------- Production ----------

const cm = (value) => (Number.isFinite(value) ? `${(Math.round(value * 10) / 10).toFixed(1)} cm` : '—')

/** Position and size of one placed design, in centimetres of the real print area. */
export const placementMeasurements = (item, area) => {
  const scale = item.scale ?? 1
  const widthCm = Number(area?.widthCm)
  const heightCm = Number(area?.heightCm)
  return {
    width: cm(scale * 0.5 * widthCm),
    left: cm(item.x * widthCm),
    top: cm(item.y * heightCm),
    rotation: `${Math.round((item.rotation ?? 0) * 10) / 10}°`,
    hasRealSize: Number.isFinite(widthCm) && Number.isFinite(heightCm),
  }
}

// In the app, a text box spans 90% of the print area's width at scale 1.
export const TEXT_WIDTH_SHARE = 0.9

/** Position and width of printed text, in centimetres of the real print area. */
export const textMeasurements = (layer, area) => ({
  ...placementMeasurements(layer, area),
  width: cm((layer.scale ?? 1) * TEXT_WIDTH_SHARE * Number(area?.widthCm)),
})

export const TEXT_FONT_LABELS = { SERIF: 'Classic (serif)', SANS: 'Modern (sans)', SCRIPT: 'Script' }
export const TEXT_WEIGHT_LABELS = { LIGHT: 'Light', REGULAR: 'Regular', BOLD: 'Bold' }

/** e.g. "Script · Bold · Italic"; a layer without a weight is Regular. */
export const textStyleLabel = (layer) =>
  [
    TEXT_FONT_LABELS[layer.font] || TEXT_FONT_LABELS.SERIF,
    TEXT_WEIGHT_LABELS[layer.weight] || TEXT_WEIGHT_LABELS.REGULAR,
    ...(layer.italic ? ['Italic'] : []),
  ].join(' · ')

/** CSS for printed text, matching the app's lettering. */
export const textCss = (layer) => ({
  color: layer.color || '#2D3250',
  fontFamily:
    layer.font === 'SANS'
      ? 'system-ui, sans-serif'
      : layer.font === 'SCRIPT'
        ? 'cursive'
        : 'Georgia, serif',
  fontWeight: layer.weight === 'BOLD' ? 700 : layer.weight === 'LIGHT' ? 300 : 400,
  fontStyle: layer.italic ? 'italic' : 'normal',
})
