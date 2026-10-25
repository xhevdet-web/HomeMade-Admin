import {
  centsToEuros,
  defaultPrintArea,
  eurosToCents,
  printAreaPayload,
  sizeRows,
  sizesPayload,
} from '../apparel/apparelHelpers'

export const formatPrice = (cents) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
export const creatorName = (creator) =>
  [creator?.firstName, creator?.lastName].filter(Boolean).join(' ') ||
  creator?.userName ||
  'Unavailable creator'

export const componentSummary = (items = []) =>
  items
    .map((item) => `${item.subCategory?.name || 'Unavailable component'} ×${item.quantity}`)
    .join(', ') || 'No components'

export const originLabels = { COMPANY: 'Company', CUSTOMER: 'Customer' }
export const isCompany = (product) => product?.origin === 'COMPANY'
// Apparel products are one colour each, with print areas for the studio.
export const isApparel = (category) => category?.builderType === 'APPAREL'

/** The picture that represents a product: a design's preview, else its photo. */
export const productImage = (product) =>
  isCompany(product) ? product?.imageUrl : (product?.designPreviewUrl ?? product?.imageUrl)

export const productDate = (date) => {
  const value = new Date(date)
  return Number.isNaN(value.getTime())
    ? '—'
    : new Intl.DateTimeFormat('en-IE', { dateStyle: 'medium' }).format(value)
}

export const emptyProductForm = (categoryId = '', apparel = false) => ({
  categoryId,
  name: '',
  description: '',
  price: '',
  stock: '0',
  sized: apparel,
  sizes: apparel ? [{ size: 'M', stock: '0' }] : [],
  color: '',
  colorHex: '#111111',
  frontEnabled: apparel,
  backEnabled: false,
  frontPrintArea: defaultPrintArea('front'),
  backPrintArea: defaultPrintArea('back'),
  isActive: true,
})

export const productForm = (product) => ({
  ...emptyProductForm(product.categoryId),
  name: product.name ?? '',
  description: product.description ?? '',
  price: centsToEuros(product.price),
  stock: String(product.stock ?? 0),
  sized: Array.isArray(product.sizes) && product.sizes.length > 0,
  sizes: sizeRows(product.sizes),
  color: product.color ?? '',
  colorHex: product.colorHex ?? '#111111',
  frontEnabled: !!product.printAreas?.front,
  backEnabled: !!product.printAreas?.back,
  frontPrintArea: { ...(product.printAreas?.front || defaultPrintArea('front')) },
  backPrintArea: { ...(product.printAreas?.back || defaultPrintArea('back')) },
  isActive: product.isActive ?? true,
})

/** Validated COMPANY product fields; throws a readable Error. */
export const companyPayload = (form, apparel) => {
  if (!form.name.trim()) throw new Error('Name is required.')
  const fields = {
    categoryId: form.categoryId,
    name: form.name.trim(),
    description: form.description.trim() || null,
    price: eurosToCents(form.price),
    isActive: form.isActive,
  }
  if (form.sized) {
    fields.sizes = sizesPayload(form.sizes)
    if (!fields.sizes.length) throw new Error('Add at least one size, or turn off sizes.')
  } else {
    const stock = Number(form.stock)
    if (!String(form.stock).trim() || !Number.isInteger(stock) || stock < 0 || stock > 2147483647)
      throw new Error('Stock must be a nonnegative whole number.')
    fields.stock = stock
    fields.sizes = null
  }
  if (apparel) {
    fields.color = form.color.trim() || null
    if (fields.color && !/^#[0-9a-f]{6}$/i.test(form.colorHex))
      throw new Error('Choose the colour swatch as a hex value such as #111111.')
    fields.colorHex = fields.color ? form.colorHex.toUpperCase() : null
    const front = form.frontEnabled ? printAreaPayload(form.frontPrintArea, 'Front print area') : null
    const back = form.backEnabled ? printAreaPayload(form.backPrintArea, 'Back print area') : null
    fields.printAreas = front || back ? { ...(front ? { front } : {}), ...(back ? { back } : {}) } : null
  }
  return fields
}

/** Multipart body; sizes and printAreas travel as JSON, where "null" clears them. */
export const productFormData = (fields, files = {}) => {
  const data = new FormData()
  Object.entries(fields).forEach(([key, value]) => {
    if (value === undefined) return
    if (key === 'sizes' || key === 'printAreas') data.append(key, JSON.stringify(value))
    else data.append(key, String(value ?? ''))
  })
  Object.entries(files).forEach(([key, file]) => file && data.append(key, file))
  return data
}
