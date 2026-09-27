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
