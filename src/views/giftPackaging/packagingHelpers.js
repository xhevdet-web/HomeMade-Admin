import { centsToEuros, eurosToCents } from '../apparel/apparelHelpers'

// OPAQUE is the stored value; admins and customers read it as "Closed".
export const packagingTypes = {
  TRANSPARENT: {
    label: 'Transparent',
    hint: 'See-through: customers see what is inside. No colours.',
  },
  OPAQUE: {
    label: 'Closed',
    hint: 'Keeps the gift a surprise. Can be offered in colours.',
  },
}
export const typeLabel = (type) => packagingTypes[type]?.label || 'Not set'

// The box drawn in the Gift Studio, and the space customers arrange their gift in.
export const packagingShapes = { SQUARE: 'Square', RECTANGULAR: 'Rectangular' }
/** "Closed · Rectangular"; transparent packaging is the clear bag, so it has no shape. */
export const kindLabel = (packaging) =>
  packaging?.type === 'OPAQUE'
    ? `${typeLabel(packaging.type)} · ${packagingShapes[packaging.shape] || packagingShapes.SQUARE}`
    : typeLabel(packaging?.type)

export const hasColors = (packaging) => packaging?.type === 'OPAQUE' && packaging.colors?.length > 0

/** Stock customers can order: per colour for coloured packaging, else the packaging's own. */
export const availableStock = (packaging) =>
  hasColors(packaging)
    ? packaging.colors
        .filter((color) => color.isActive)
        .reduce((sum, color) => sum + color.stock, 0)
    : packaging.stock

const wholeNumber = (value, label) => {
  const number = Number(value)
  if (!String(value).trim() || !Number.isInteger(number) || number < 0 || number > 2147483647)
    throw new Error(`${label} must be a nonnegative whole number.`)
  return number
}

export const emptyPackagingForm = {
  name: '',
  description: '',
  type: 'TRANSPARENT',
  shape: 'SQUARE',
  price: '',
  stock: 0,
  isActive: true,
  sortOrder: 0,
}

export const packagingForm = (record) =>
  record
    ? {
        name: record.name,
        description: record.description || '',
        type: record.type,
        shape: record.shape || 'SQUARE',
        price: centsToEuros(record.price),
        stock: record.stock,
        isActive: record.isActive,
        sortOrder: record.sortOrder,
      }
    : emptyPackagingForm

/** Validated packaging fields; throws a readable Error. Prices are typed in euros. */
export const packagingPayload = (form, colored) => {
  if (!form.name.trim()) throw new Error('Name is required.')
  if (!packagingTypes[form.type]) throw new Error('Choose a packaging type.')
  return {
    name: form.name.trim(),
    description: form.description.trim() || null,
    type: form.type,
    // Transparent packaging is drawn as a clear bag; its shape stays the default.
    shape: form.type === 'OPAQUE' ? form.shape : 'SQUARE',
    price: eurosToCents(form.price),
    // Coloured packaging keeps its stock per colour.
    ...(colored ? {} : { stock: wholeNumber(form.stock, 'Stock') }),
    isActive: form.isActive,
    sortOrder: wholeNumber(form.sortOrder, 'Sort order'),
  }
}

export const emptyColorForm = {
  name: '',
  hex: '#E8B4BC',
  priceAdjustment: '0',
  stock: 0,
  isActive: true,
  sortOrder: 0,
}

export const colorForm = (color) =>
  color
    ? {
        name: color.name,
        hex: color.hex,
        priceAdjustment: centsToEuros(color.priceAdjustment),
        stock: color.stock,
        isActive: color.isActive,
        sortOrder: color.sortOrder,
      }
    : emptyColorForm

export const colorPayload = (form) => {
  if (!form.name.trim()) throw new Error('Colour name is required.')
  if (!/^#[0-9a-f]{6}$/i.test(form.hex.trim()))
    throw new Error('Hex colour must look like #E8B4BC.')
  return {
    name: form.name.trim(),
    hex: form.hex.trim().toUpperCase(),
    priceAdjustment: eurosToCents(form.priceAdjustment || '0', 'Price adjustment'),
    stock: wholeNumber(form.stock, 'Stock'),
    isActive: form.isActive,
    sortOrder: wholeNumber(form.sortOrder, 'Sort order'),
  }
}

/** "Classic Closed Box · Pink" for a gift design or ordered gift, else null. */
export const packagingLabel = (product) =>
  product?.giftPackaging
    ? [product.giftPackaging.name, product.giftPackagingColor?.name].filter(Boolean).join(' · ')
    : null
