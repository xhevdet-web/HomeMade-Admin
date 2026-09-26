import {
  CCard,
  CCardBody,
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import {
  cilCart,
  cilChartLine,
  cilPeople,
  cilPencil,
  cilArrowRight,
  cilChartPie,
} from '@coreui/icons'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import EmptyState from '../../components/EmptyState'

const metrics = [
  { title: 'Total Orders', icon: cilCart, detail: 'Your orders at a glance' },
  { title: 'Revenue', icon: cilChartLine, detail: 'Sales across your collections' },
  { title: 'Customers', icon: cilPeople, detail: 'The people behind your growth' },
  { title: 'Designs', icon: cilPencil, detail: 'Creativity, beautifully tracked' },
]
const Dashboard = () => {
  const { userData } = useAuthSelector()
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">YOUR BUSINESS, THOUGHTFULLY CONNECTED</span>
          <h1>Welcome back, {userData?.firstName || 'Admin'}</h1>
          <p>Here’s what’s happening with HomeMade today.</p>
        </div>
        <span className="hm-date">
          {new Intl.DateTimeFormat(undefined, {
            month: 'long',
            day: 'numeric',
            year: 'numeric',
          }).format(new Date())}
        </span>
      </div>
      <CRow className="g-4 hm-metrics">
        {metrics.map((metric) => (
          <CCol xs={12} sm={6} xl={3} key={metric.title}>
            <CCard className="hm-metric">
              <CCardBody>
                <div className="hm-metric-top">
                  <span>{metric.title}</span>
                  <span className="hm-metric-icon">
                    <CIcon icon={metric.icon} />
                  </span>
                </div>
                <strong aria-label="Not available">—</strong>
                <small>{metric.detail}</small>
                <span className="hm-metric-status">Insights coming soon</span>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
      <CRow className="g-4 mt-1">
        <CCol lg={8}>
          <CCard className="hm-panel h-100">
            <div className="hm-panel-heading">
              <div>
                <h2>Sales Overview</h2>
                <p>A little perspective on your progress.</p>
              </div>
              <span className="hm-badge">Not available yet</span>
            </div>
            <CCardBody>
              <EmptyState
                icon={cilChartLine}
                title="Your next chapter, in numbers"
                description="Sales insights will appear here when reporting becomes available."
              />
            </CCardBody>
          </CCard>
        </CCol>
        <CCol lg={4}>
          <CCard className="hm-panel h-100">
            <div className="hm-panel-heading">
              <div>
                <h2>Order Status</h2>
                <p>Every step of the journey.</p>
              </div>
            </div>
            <CCardBody>
              <EmptyState
                icon={cilChartPie}
                title="A clearer view of every order"
                description="Order status insights are not available yet."
              />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard className="hm-panel mt-4">
        <div className="hm-panel-heading">
          <div>
            <h2>Recent Orders</h2>
            <p>The latest from your HomeMade community.</p>
          </div>
          <Link className="hm-text-link" to="/orders">
            Orders workspace <CIcon icon={cilArrowRight} />
          </Link>
        </div>
        <CTable responsive className="hm-table mb-0">
          <CTableHead>
            <CTableRow>
              {['Order', 'Customer', 'Date', 'Total', 'Status'].map((label) => (
                <CTableHeaderCell scope="col" key={label}>
                  {label}
                </CTableHeaderCell>
              ))}
            </CTableRow>
          </CTableHead>
          <CTableBody>
            <CTableRow>
              <CTableDataCell colSpan={5}>
                <EmptyState
                  icon={cilCart}
                  title="Every order starts a story"
                  description="Recent orders will be available here once order management is connected."
                />
              </CTableDataCell>
            </CTableRow>
          </CTableBody>
        </CTable>
      </CCard>
      <div className="hm-studio-note">
        <span className="hm-monogram">h.</span>
        <div>
          <strong>Good things are made with care.</strong>
          <p>A considered space to manage your craft and grow your business.</p>
        </div>
      </div>
    </>
  )
}
export default Dashboard
