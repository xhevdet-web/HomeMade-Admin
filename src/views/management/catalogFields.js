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
  options: [],
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

export const defaultBuilderOptions = (builderType) => {
  if (builderType === 'BOUQUET')
    return [
      { key: 'bouquetSize', name: 'Bouquet Size', type: 'select', required: true, values: [] },
    ]
  return []
}

// Apparel size and colour now live on garment variants, not on Category.options.
export const legacyApparelOptions = (options = []) =>
  options.filter((option) => ['size', 'color'].includes(option.key))

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

const validateStrings = (option) => {
  const values = option.values ?? []
  if (!Array.isArray(values) || values.some((value) => typeof value !== 'string' || !value.trim()))
    throw new Error(`${option.name}: values cannot be empty.`)
  if (!values.length) throw new Error(`${option.name}: add at least one value.`)
  const normalized = values.map((value) => value.trim())
  if (new Set(normalized.map((value) => value.toLowerCase())).size !== normalized.length)
    throw new Error(`${option.name}: values must be unique.`)
  return normalized
}

const validateColors = (option) => {
  const values = option.values ?? []
  if (!Array.isArray(values)) throw new Error(`${option.name}: colors are invalid.`)
  const normalized = values.map((color, index) => {
    const name = color?.name?.trim()
    const value = color?.value?.trim()
    if (!name || !value) throw new Error(`${option.name}: color ${index + 1} is incomplete.`)
    return { name, value }
  })
  if (new Set(normalized.map((color) => color.value.toLowerCase())).size !== normalized.length)
    throw new Error(`${option.name}: color values must be unique.`)
  return normalized
}

export const categoryOptions = (options = []) => {
  const keys = new Set()
  return options.map((option) => {
    if (!option?.key?.trim() || !option?.name?.trim())
      throw new Error('Every option requires a key and name.')
    if (keys.has(option.key)) throw new Error('Option keys must be unique.')
    keys.add(option.key)
    if (!['select', 'color', 'number', 'text'].includes(option.type))
      throw new Error(`${option.name}: invalid option type.`)
    if (typeof option.required !== 'boolean')
      throw new Error(`${option.name}: required must be true or false.`)
    const result = {
      key: option.key,
      name: option.name.trim(),
      type: option.type,
      required: option.required,
    }
    if (option.type === 'select') result.values = validateStrings(option)
    if (option.type === 'color') result.values = validateColors(option)
    if (option.type === 'number') {
      const min = option.min === '' || option.min == null ? undefined : Number(option.min)
      const max = option.max === '' || option.max == null ? undefined : Number(option.max)
      if ((min !== undefined && !Number.isFinite(min)) || (max !== undefined && !Number.isFinite(max)))
        throw new Error(`${option.name}: minimum and maximum must be valid numbers.`)
      if (min !== undefined && max !== undefined && min > max)
        throw new Error(`${option.name}: minimum cannot exceed maximum.`)
      if (min !== undefined) result.min = min
      if (max !== undefined) result.max = max
    }
    if (option.type === 'text') {
      const maxLength = Number(option.maxLength)
      if (!Number.isInteger(maxLength) || maxLength < 1 || maxLength > 10000)
        throw new Error(`${option.name}: maximum length must be a whole number from 1 to 10,000.`)
      result.maxLength = maxLength
    }
    return result
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
      // Unlimited printed designs keep their last stock value; orders never decrement it.
      stock: form.trackStock ? Number(form.stock) : Number(form.stock) || 0,
      trackStock: form.trackStock,
    })
  else {
    payload.builderType = form.builderType || null
    payload.designCategoryId =
      form.builderType === 'APPAREL' ? form.designCategoryId || null : null
    if (form.builderType === 'JEWELRY') {
      payload.sizes = categorySizes(form.sizes ?? [])
      payload.options = null
    } else if (form.builderType) {
      payload.sizes = null
      payload.options = categoryOptions(form.options ?? [])
    } else {
      payload.sizes = null
      payload.options = null
    }
  }
  return payload
}
