import { designTypes } from '../apparel/apparelHelpers'

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
}

export const builderLabels = {
  JEWELRY: 'Jewelry',
  APPAREL: 'Apparel',
  BOUQUET: 'Bouquet',
  GIFT: 'Gift',
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

export const categorySizes = (sizes = []) => {
  const ids = new Set()
  return sizes.map((size, index) => {
    const name = size.name.trim()
    const id = size.id || sizeId(name)
    const unit = size.unit.trim()
    const measurement = Number(size.measurement)
    const maxItems = Number(size.maxItems)
    if (!name || !id) throw new Error(`Size ${index + 1}: name is required.`)
    if (ids.has(id))
      throw new Error('Size names must generate unique IDs. Rename the duplicate size.')
    ids.add(id)
    if (!unit) throw new Error(`Size ${index + 1}: unit is required.`)
    if (!Number.isFinite(measurement) || measurement <= 0)
      throw new Error(`Size ${index + 1}: measurement must be greater than zero.`)
    if (!Number.isInteger(maxItems) || maxItems < 1 || maxItems > 2147483647)
      throw new Error(`Size ${index + 1}: Max Items must be a positive whole number.`)
    return { id, name, measurement, unit, maxItems }
  })
}

export const categoryForm = (record) => {
  const form = Object.fromEntries(
    Object.entries(emptyCatalogForm).map(([key, fallback]) => [key, record?.[key] ?? fallback]),
  )
  form.silhouette = record?.builderConfig?.silhouette ?? ''
  return form
}

export const catalogPayload = (form, isSubCategory) => {
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
  else {
    payload.builderType = form.builderType || null
    payload.designCategoryId =
      form.builderType === 'APPAREL' ? form.designCategoryId || null : null
    payload.sizes = form.builderType === 'JEWELRY' ? categorySizes(form.sizes ?? []) : null
    // Colour and size live on each apparel product; the category only keeps the shape.
    if (form.builderType === 'APPAREL')
      payload.builderConfig = form.silhouette ? { silhouette: form.silhouette } : null
  }
  return payload
}
