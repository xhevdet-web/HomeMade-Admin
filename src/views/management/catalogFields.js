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
  name: '',
  description: '',
  isActive: true,
  sortOrder: 0,
  categoryId: '',
  color: '',
  type: '',
  price: 0,
  stock: 0,
}

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
      stock: Number(form.stock),
    })
  else payload.sizes = categorySizes(form.sizes ?? [])
  return payload
}
