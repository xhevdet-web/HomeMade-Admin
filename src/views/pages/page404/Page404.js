import { CButton } from '@coreui/react'
import { Link } from 'react-router-dom'
import EmptyState from '../../../components/EmptyState'

const Page404 = () => (
  <div className="text-center">
    <EmptyState
      title="This page couldn’t be found"
      description="Return to your dashboard to continue exploring HomeMade."
    />
    <CButton as={Link} to="/dashboard" color="primary">
      Back to dashboard
    </CButton>
  </div>
)
export default Page404
