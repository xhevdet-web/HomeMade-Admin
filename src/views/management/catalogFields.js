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
  return payload
}
