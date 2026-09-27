import PropTypes from 'prop-types'
import { paymentLabels, statusLabels } from './orderHelpers'
const OrderBadge = ({ value, payment = false }) => (
  <span className={`hm-order-badge hm-order-badge-${String(value).toLowerCase()}`}>
    {(payment ? paymentLabels : statusLabels)[value] || value || 'Unknown'}
  </span>
)
OrderBadge.propTypes = { value: PropTypes.string, payment: PropTypes.bool }
export default OrderBadge
