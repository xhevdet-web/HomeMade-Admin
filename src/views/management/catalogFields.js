import { designTypes } from '../apparel/apparelHelpers'
import { stickerFormSizes, stickerSizesPayload } from './stickerSizes'

export const catalogConfig = {
  categories: {
    title: 'Categories',
    singular: 'Category',
    endpoint: '/categories',
    description: 'Organize your handmade collections.',
  },
  'sub-categories': {
    title: 'SubCategories',
    singular: 'SubCategory',
    endpoint: '/sub-categories',
    description: 'Manage the details within each collection.',
  },
}

export const emptyCatalogForm = {
  sizes: [],
  builderType: '',
  // APPAREL: the app-drawn garment shape shown until a product has its own images.
  silhouette: '',
  // JEWELRY: BRACELET (sized by length) or NECKLACE (sized by component count).
  jewelryShape: '',
  designCategoryId: '',
  name: '',
  description: '',
  isActive: true,
  sortOrder: 0,
  categoryId: '',
  color: '',
  type: '',
  price: 0,
  stock: 0,
  trackStock: true,
  // Jewelry components: physical size in mm.
  effectiveLengthMm: '',
}

export const builderLabels = {
  JEWELRY: 'Jewelry',
  APPAREL: 'Apparel',
  BOUQUET: 'Bouquet',
  GIFT: 'Gift',
  CASE: 'Phone cases',
  STICKER: 'Stickers',
}

// Component types per studio. The app uses them for its picker filters (Flowers, Greenery,
// Decorations…) and a sensible starting size; customers arrange pieces freely.
const componentTypes = {
  APPAREL: designTypes,
  BOUQUET: {
    FLOWER: 'Flower',
    GREENERY: 'Greenery',
    FILLER: 'Filler',
    DECORATION: 'Decoration',
    WRAPPING: 'Wrapping',
  },
  GIFT: { BAG: 'Bag & box', FILLER: 'Filler', ITEM: 'Item', DECORATION: 'Decoration' },
  // Case artwork is digital: printed full-bleed, never stocked or measured.
  CASE: { ILLUSTRATION: 'Illustration', PATTERN: 'Pattern', PHOTO: 'Photo', LOGO: 'Logo' },
  // Sticker designs are printed on demand like case artwork; the app filters by these.
  STICKER: { ILLUSTRATION: 'Illustration', QUOTE: 'Quote', LOGO: 'Logo', EMOJI: 'Emoji', PATTERN: 'Pattern' },
}
/** Type choices for a component of a category with this builder; free text is always allowed. */
export const typesFor = (builderType) => componentTypes[builderType] || {}

export const sizeId = (name) =>
  name
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')

export const categoryForm = (record) => {
  const form = Object.fromEntries(
    Object.entries(emptyCatalogForm).map(([key, fallback]) => [key, record?.[key] ?? fallback]),
  )
  form.silhouette = record?.builderConfig?.silhouette ?? ''
  form.jewelryShape =
    record?.builderType === 'JEWELRY' ? (isNecklaceCategory(record) ? 'NECKLACE' : 'BRACELET') : ''
  if (form.jewelryShape) form.sizes = jewelryFormSizes(record?.sizes ?? [])
  if (record?.builderType === 'STICKER') form.sizes = stickerFormSizes(record?.sizes ?? [])
  return form
}

/** `measuredComponent`: the component's category is jewelry, so it needs a physical size. */
export const catalogPayload = (form, isSubCategory, measuredComponent = false) => {
  const nullable = (value) => value.trim() || null
  const payload = {
    name: form.name.trim(),
    description: nullable(form.description),
    isActive: form.isActive,
    sortOrder: Number(form.sortOrder),
  }
  if (isSubCategory)
    Object.assign(payload, {
      categoryId: form.categoryId,
      color: nullable(form.color),
      type: nullable(form.type),
      price: Number(form.price),
      // Unlimited printed designs keep their last stock value; orders never decrement it.
      stock: form.trackStock ? Number(form.stock) : Number(form.stock) || 0,
      trackStock: form.trackStock,
    })
  if (isSubCategory && measuredComponent) {
    const length = Number(form.effectiveLengthMm)
    if (!String(form.effectiveLengthMm).trim() || !Number.isInteger(length) || length < 1 || length > 1000)
      throw new Error(
        'Enter the physical size of this bead or component in whole millimetres, e.g. 8.',
      )
    payload.effectiveLengthMm = length
  }
  if (!isSubCategory) {
    payload.builderType = form.builderType || null
    // Any studio may share another category's subcategories (e.g. beads for bracelets and necklaces).
    payload.designCategoryId = form.builderType ? form.designCategoryId || null : null
    // Jewelry (bracelets and necklaces) is sized by length ranges; stickers by shape and size.
    payload.sizes =
      form.builderType === 'JEWELRY'
        ? jewelrySizesPayload(form.sizes ?? [])
        : form.builderType === 'STICKER'
          ? stickerSizesPayload(form.sizes ?? [])
          : null
    if (form.builderType === 'JEWELRY')
      payload.builderConfig = { silhouette: form.jewelryShape || 'BRACELET' }
    // Colour and size live on each apparel product; the category only keeps the shape.
    if (form.builderType === 'APPAREL')
      payload.builderConfig = form.silhouette ? { silhouette: form.silhouette } : null
  }
  return payload
}

/** Jewelry (bracelets and necklaces) is sized by real length; its components are measured. */
export const isJewelryCategory = (category) => category?.builderType === 'JEWELRY'

/**
 * Jewelry categories are necklaces when their shape says so; older categories without a
 * shape are recognised by name, the same rule the app and API use. Other jewelry is a
 * bracelet.
 */
export const isNecklaceCategory = (category) =>
  category?.builderType === 'JEWELRY' &&
  (category.builderConfig?.silhouette
    ? category.builderConfig.silhouette === 'NECKLACE'
    : /neck/i.test(category.name || ''))

export const jewelryShapes = { BRACELET: 'Bracelet', NECKLACE: 'Necklace' }

const cmText = (mm) => (Number.isFinite(mm) ? String(mm / 10) : '')

/**
 * Jewelry sizes as the form edits them, in centimetres. Sizes still in the old format
 * (e.g. measurement 18, unit "24cm") are pre-filled from those values where they read
 * clearly, and flagged so the admin checks them and sets the default length.
 */
export const jewelryFormSizes = (sizes = []) =>
  sizes.map((size) => {
    if (Number.isFinite(size.minMeasurementMm))
      return {
        id: size.id,
        name: size.name,
        minCm: cmText(size.minMeasurementMm),
        maxCm: cmText(size.maxMeasurementMm),
        defaultCm: cmText(size.defaultMeasurementMm),
        converted: false,
      }
    const min = Number(size.measurement)
    const max = Number(/^\s*(\d+(?:[.,]\d+)?)\s*cm\s*$/i.exec(size.unit || '')?.[1]?.replace(',', '.'))
    return {
      id: size.id,
      name: size.name || '',
      minCm: min > 0 ? String(min) : '',
      maxCm: max > min ? String(max) : '',
      defaultCm: '',
      converted: true,
    }
  })

/** Centimetres as typed ("18", "18.5", "18,5") to whole millimetres. */
const cmToMm = (value, label) => {
  const text = String(value ?? '').trim().replace(',', '.')
  if (!/^\d+(?:\.\d)?$/.test(text))
    throw new Error(`${label} must be a length in cm with at most one decimal, e.g. 18 or 18.5.`)
  const mm = Math.round(Number(text) * 10)
  if (mm <= 0 || mm > 1000) throw new Error(`${label} must be between 0.1 and 100 cm.`)
  return mm
}

/** Validated jewelry sizes in millimetres; throws a readable Error. */
export const jewelrySizesPayload = (sizes = []) => {
  const ids = new Set()
  return sizes.map((size, index) => {
    const name = size.name.trim()
    const id = size.id || sizeId(name)
    const label = `Size ${index + 1}${name ? ` (${name})` : ''}`
    if (!name || !id) throw new Error(`Size ${index + 1}: name is required.`)
    if (ids.has(id)) throw new Error('Size names must be unique. Rename the duplicate size.')
    ids.add(id)
    const minMeasurementMm = cmToMm(size.minCm, `${label}: minimum`)
    const maxMeasurementMm = cmToMm(size.maxCm, `${label}: maximum`)
    const defaultMeasurementMm = cmToMm(size.defaultCm, `${label}: default length`)
    if (maxMeasurementMm <= minMeasurementMm)
      throw new Error(`${label}: the maximum must be longer than the minimum.`)
    if (defaultMeasurementMm < minMeasurementMm || defaultMeasurementMm > maxMeasurementMm)
      throw new Error(`${label}: the default length must be between the minimum and maximum.`)
    return { id, name, minMeasurementMm, maxMeasurementMm, defaultMeasurementMm }
  })
}
