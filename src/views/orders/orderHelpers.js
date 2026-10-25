export const workflow = [
  'ORDERED',
  'CREATING',
  'CREATED',
  'READY_FOR_COURIER',
  'PICKED_UP_BY_COURIER',
  'COMPLETED',
]
export const statusLabels = {
  ORDERED: 'Ordered',
  CREATING: 'Creating',
  CREATED: 'Created',
  READY_FOR_COURIER: 'Ready for courier',
  PICKED_UP_BY_COURIER: 'Picked up by courier',
  COMPLETED: 'Completed',
}
export const paymentLabels = {
  UNPAID: 'Unpaid',
  PAID: 'Paid',
  FAILED: 'Failed',
  REFUNDED: 'Refunded',
}
export const paymentTypes = {
  CASH_ON_DELIVERY: 'Cash on delivery',
  CASH_ON_PICKUP: 'Cash on pickup',
  CARD: 'Card',
}
export const personName = (person) =>
  [person?.firstName, person?.lastName].filter(Boolean).join(' ') || 'Unavailable customer'
export const orderDate = (date, time = false) => {
  const value = new Date(date)
  return Number.isNaN(value.getTime())
    ? 'Unavailable date'
    : new Intl.DateTimeFormat('en-IE', {
        dateStyle: 'medium',
        ...(time ? { timeStyle: 'short' } : {}),
      }).format(value)
}
export const nextStatus = (status) => {
  const index = workflow.indexOf(status)
  return index < 0 ? null : workflow[index + 1] || null
}

export const originLabels = { COMPANY: 'Company', CUSTOMER: 'Customer' }

// The API returns the product as purchased (from the order snapshot, every snapshot
// version in one shape), so catalog edits never change an order.
export const orderedProduct = (order) => order?.product ?? order?.designSnapshot?.product
export const isCompanyProduct = (product) => product?.origin === 'COMPANY'
export const orderProductLabel = (order) =>
  isCompanyProduct(orderedProduct(order)) ? 'Company product' : 'Customer design'
export const orderDesignImage = (order) => {
  const product = orderedProduct(order)
  return isCompanyProduct(product)
    ? product.imageUrl
    : order?.designPreviewUrl ?? product?.designPreviewUrl
}
/** "L", or "Medium · 18 cm" for a jewelry size preset. */
export const sizeLabel = (size) =>
  size?.name ? `${size.name}${size.measurement ? ` · ${size.measurement} ${size.unit}` : ''}` : null
