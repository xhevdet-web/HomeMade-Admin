export const garmentEndpoints = {
  list: (categoryId) => `/garments?categoryId=${encodeURIComponent(categoryId)}`,
  create: '/garments',
  detail: (id) => `/garments/${encodeURIComponent(id)}`,
  variants: (id) => `/garments/${encodeURIComponent(id)}/variants`,
}

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

const fieldsOf = (form) => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  basePrice: eurosToCents(form.basePrice, 'Base price'),
  silhouette: form.silhouette || null,
  isActive: form.isActive,
  sortOrder: Number(form.sortOrder),
  frontPrintArea: form.frontEnabled ? printAreaPayload(form.frontPrintArea, 'Front print area') : null,
  backPrintArea: form.backEnabled ? printAreaPayload(form.backPrintArea, 'Back print area') : null,
})

/** Validated garment fields; throws a readable Error. */
export const garmentPayload = (form) => {
  if (!form.name.trim()) throw new Error('Name is required.')
  const sortOrder = Number(form.sortOrder)
  if (!Number.isInteger(sortOrder) || sortOrder < 0 || sortOrder > 2147483647)
    throw new Error('Sort order must be a nonnegative whole number.')
  return fieldsOf(form)
}

/**
 * Multipart body for POST/PATCH. Multipart cannot carry null, so a cleared print area is
 * sent as the JSON text "null" and a cleared silhouette as "" (the API maps it to null).
 * An empty description is left out; the caller clears it with a JSON PATCH when needed.
 */
export const garmentFormData = (fields, files, categoryId) => {
  const data = new FormData()
  if (categoryId) data.append('categoryId', categoryId)
  Object.entries(fields).forEach(([key, value]) => {
    if (key === 'frontPrintArea' || key === 'backPrintArea') data.append(key, JSON.stringify(value))
    else if (key === 'description' && value === null) return
    else data.append(key, String(value ?? ''))
  })
  Object.entries(files).forEach(([key, file]) => file && data.append(key, file))
  return data
}

export const emptyGarmentForm = () => ({
  name: '',
  description: '',
  basePrice: '',
  silhouette: 'HOODIE',
  isActive: true,
  sortOrder: 0,
  frontEnabled: true,
  backEnabled: true,
  frontPrintArea: defaultPrintArea('front'),
  backPrintArea: defaultPrintArea('back'),
})

export const garmentForm = (garment) => ({
  name: garment.name ?? '',
  description: garment.description ?? '',
  basePrice: centsToEuros(garment.basePrice),
  silhouette: garment.silhouette ?? '',
  isActive: garment.isActive ?? true,
  sortOrder: garment.sortOrder ?? 0,
  frontEnabled: !!garment.frontPrintArea,
  backEnabled: !!garment.backPrintArea,
  frontPrintArea: { ...(garment.frontPrintArea || defaultPrintArea('front')) },
  backPrintArea: { ...(garment.backPrintArea || defaultPrintArea('back')) },
})

// ---------- Variant matrix ----------

export const cellKey = (size, colorValue) => `${size}\u0000${String(colorValue).toLowerCase()}`
const sizeRank = (size) => {
  const index = presetSizes.indexOf(size.toUpperCase())
  return index < 0 ? presetSizes.length : index
}

/** { sizes, colors, cells } from saved variants; a cell exists only for sold combinations. */
export const matrixFromVariants = (variants = []) => {
  const sizes = []
  const colors = []
  const cells = {}
  for (const variant of variants) {
    if (!sizes.includes(variant.size)) sizes.push(variant.size)
    if (!colors.some((color) => color.value.toLowerCase() === variant.colorValue.toLowerCase()))
      colors.push({ name: variant.colorName, value: variant.colorValue, saved: true })
    cells[cellKey(variant.size, variant.colorValue)] = {
      stock: String(variant.stock ?? 0),
      price: centsToEuros(variant.price),
      sku: variant.sku ?? '',
      isActive: variant.isActive ?? true,
      saved: true,
    }
  }
  sizes.sort((a, b) => sizeRank(a) - sizeRank(b))
  return { sizes, colors, cells, savedSizes: [...sizes] }
}

export const emptyCell = () => ({ stock: '0', price: '', sku: '', isActive: true })
export const isSold = (cell) => !!cell && String(cell.stock).trim() !== ''

export const stockLevel = (cell) => {
  if (!isSold(cell)) return 'empty'
  const stock = Number(cell.stock)
  if (stock === 0) return 'sold-out'
  if (stock < LOW_STOCK) return 'low'
  return 'ok'
}

const slug = (value) =>
  String(value)
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')

export const skuPrefix = (name) => slug(name).replace(/-/g, '').slice(0, 4) || 'SKU'
export const autoSku = (prefix, colorName, size) =>
  [slug(prefix), slug(colorName), slug(size)].filter(Boolean).join('-').slice(0, 64)

/** Validates the whole matrix and returns the PUT body rows. */
export const variantsPayload = ({ sizes, colors, cells }) => {
  const seenSizes = new Set()
  for (const size of sizes) {
    if (!size.trim() || size.length > 20) throw new Error('Sizes must be 1–20 characters.')
    if (seenSizes.has(size.toLowerCase())) throw new Error(`Size ${size} is listed twice.`)
    seenSizes.add(size.toLowerCase())
  }
  const seenColors = new Set()
  for (const [index, color] of colors.entries()) {
    if (!color.name.trim() || color.name.trim().length > 60)
      throw new Error(`Colour ${index + 1} needs a name (up to 60 characters).`)
    if (!/^#[0-9a-f]{6}$/i.test(color.value))
      throw new Error(`${color.name}: choose a colour as a hex value such as #C0392B.`)
    if (seenColors.has(color.value.toLowerCase()))
      throw new Error(`${color.name}: two colours use ${color.value}. Each colour must be unique.`)
    seenColors.add(color.value.toLowerCase())
  }
  const rows = []
  const skus = new Map()
  colors.forEach((color, colorIndex) =>
    sizes.forEach((size, sizeIndex) => {
      const cell = cells[cellKey(size, color.value)]
      if (!isSold(cell)) return
      const label = `${color.name.trim()} / ${size}`
      const stock = Number(cell.stock)
      if (!Number.isInteger(stock) || stock < 0 || stock > 2147483647)
        throw new Error(`${label}: stock must be a nonnegative whole number.`)
      const sku = cell.sku.trim()
      if (sku.length > 64) throw new Error(`${label}: SKU must be at most 64 characters.`)
      if (sku && skus.has(sku))
        throw new Error(`SKU ${sku} is used by both ${skus.get(sku)} and ${label}.`)
      if (sku) skus.set(sku, label)
      rows.push({
        size,
        colorName: color.name.trim(),
        colorValue: color.value.toUpperCase(),
        sku: sku || null,
        stock,
        price: eurosToCents(cell.price, `${label} price`, true),
        isActive: cell.isActive,
        sortOrder: colorIndex * sizes.length + sizeIndex,
      })
    }),
  )
  return rows
}

export const garmentStock = (garment) =>
  (garment.variants || [])
    .filter((variant) => variant.isActive)
    .reduce((sum, variant) => sum + (variant.stock || 0), 0)

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
