export const formatPrice = (cents) =>
  new Intl.NumberFormat('en-IE', { style: 'currency', currency: 'EUR' }).format(cents / 100)
export const creatorName = (creator) =>
  [creator?.firstName, creator?.lastName].filter(Boolean).join(' ') ||
  creator?.userName ||
  'Unavailable creator'

export const componentSummary = (items = []) =>
  items
    .map((item) => `${item.subCategory?.name || 'Unavailable component'} \u00d7${item.quantity}`)
    .join(', ') || 'No components'
export const editableItems = (items = []) =>
  items.map((item) => ({
    subCategoryId: item.subCategoryId,
    quantity: item.quantity,
    position: item.position ?? '',
  }))
export const productPayload = (form) => ({
  name: form.name.trim(),
  description: form.description.trim() || null,
  imageUrl: form.imageUrl.trim() || null,
  categoryId: form.categoryId,
  isActive: form.isActive,
  items: form.items.map((item) => {
    const quantity = Number(item.quantity)
    const position = item.position === '' ? undefined : Number(item.position)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 2147483647)
      throw new Error('Component quantities must be positive whole numbers.')
    if (
      position !== undefined &&
      (!Number.isInteger(position) || position < 0 || position > 2147483647)
    )
      throw new Error('Positions must be nonnegative whole numbers or empty.')
    return {
      subCategoryId: item.subCategoryId,
      quantity,
      ...(position === undefined ? {} : { position }),
    }
  }),
})
