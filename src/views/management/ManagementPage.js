import { CCard, CCardBody } from '@coreui/react'
import PropTypes from 'prop-types'
import EmptyState from '../../components/EmptyState'

const descriptions = {
  Categories: 'Organize your collections and make every piece easy to find.',
  Products: 'A home for your handmade jewelry and product collections.',
  Components: 'The materials and small details that make each piece unique.',
  Designs: 'A workspace for one-of-a-kind creations and custom designs.',
  Orders: 'Follow every order, from a thoughtful choice to a special delivery.',
}
const ManagementPage = ({ name }) => (
  <>
    <div className="hm-page-heading">
      <div>
        <span className="hm-eyebrow">{name === 'Orders' ? 'SALES' : 'MANAGEMENT'}</span>
        <h1>{name}</h1>
        <p>{descriptions[name]}</p>
      </div>
      <span className="hm-badge">Coming soon</span>
    </div>
    <CCard className="hm-panel">
      <CCardBody>
        <EmptyState
          title={`${name} will live here`}
          description="This workspace is being prepared. Management tools will be available when this feature is connected."
        />
      </CCardBody>
    </CCard>
  </>
)
ManagementPage.propTypes = { name: PropTypes.string.isRequired }
export default ManagementPage
