import CIcon from '@coreui/icons-react'
import { cilFolderOpen } from '@coreui/icons'
import PropTypes from 'prop-types'

const EmptyState = ({ title, description, icon = cilFolderOpen, action }) => (
  <div className="hm-empty">
    <span className="hm-empty-icon">
      <CIcon icon={icon} size="xl" />
    </span>
    <h3>{title}</h3>
    <p>{description}</p>
    {action && <div className="mt-2">{action}</div>}
  </div>
)
EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.array,
  action: PropTypes.node,
}
export default EmptyState
