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
export const productPayload = (form) => {
  const fields = {
    name: form.name.trim(),
    description: form.description.trim() || null,
    categoryId: form.categoryId,
    isActive: form.isActive,
  }
  if (form.productType === 'READY_MADE') {
    const euros = String(form.price).trim()
    if (!/^\d+(?:\.\d{1,2})?$/.test(euros))
      throw new Error('Price must be a nonnegative euro amount with at most two decimal places.')
    const [whole, decimal = ''] = euros.split('.')
    const price = Number(whole) * 100 + Number(decimal.padEnd(2, '0'))
    if (!Number.isSafeInteger(price) || price > 2147483647)
      throw new Error('Price exceeds the supported range.')
    const stock = Number(form.stock)
    if (!String(form.stock).trim() || !Number.isInteger(stock) || stock < 0 || stock > 2147483647)
      throw new Error('Stock must be a nonnegative whole number.')
    return { ...fields, productType: 'READY_MADE', price, stock }
  }
  return {
    ...fields,
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
  }
}
