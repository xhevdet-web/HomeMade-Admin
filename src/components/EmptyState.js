import CIcon from '@coreui/icons-react'
import { cilFolderOpen } from '@coreui/icons'
import PropTypes from 'prop-types'

const EmptyState = ({ title, description, icon = cilFolderOpen }) => (
  <div className="hm-empty">
    <span className="hm-empty-icon">
      <CIcon icon={icon} size="xl" />
    </span>
    <h3>{title}</h3>
    <p>{description}</p>
  </div>
)
EmptyState.propTypes = {
  title: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  icon: PropTypes.array,
}
export default EmptyState
