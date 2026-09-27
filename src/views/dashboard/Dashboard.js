import { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CCol,
  CRow,
  CSpinner,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import CIcon from '@coreui/icons-react'
import { cilCart, cilPeople, cilStar, cilCheckCircle, cilCreditCard, cilClock } from '@coreui/icons'
import api, { apiErrorMessage } from '../../_helpers/api'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import EmptyState from '../../components/EmptyState'
import OrderBadge from '../orders/OrderBadge'
import {
  workflow,
  statusLabels,
  paymentLabels,
  personName,
  orderDate,
} from '../orders/orderHelpers'
import { formatPrice } from '../products/productHelpers'

const requests = [
  { key: 'users', path: '/users' },
  { key: 'products', path: '/products' },
  { key: 'orders', path: '/orders', params: { page: 1, limit: 5 } },
  ...workflow.map((status) => ({
    key: status,
    path: '/orders',
    params: { page: 1, limit: 1, status },
  })),
  ...Object.keys(paymentLabels).map((paymentStatus) => ({
    key: paymentStatus,
    path: '/orders',
    params: { page: 1, limit: 1, paymentStatus },
  })),
]
const metrics = [
  {
    key: 'users',
    title: 'Users',
    icon: cilPeople,
    detail: 'All accounts, including admins',
    to: '/users',
  },
  {
    key: 'products',
    title: 'Products',
    icon: cilStar,
    detail: 'All saved products',
    to: '/products',
  },
  {
    key: 'orders',
    title: 'Total Orders',
    icon: cilCart,
    detail: 'All orders placed',
    to: '/orders',
  },
  {
    key: 'COMPLETED',
    title: 'Completed Orders',
    icon: cilCheckCircle,
    detail: 'Workflow completed',
    to: '/orders',
  },
  {
    key: 'UNPAID',
    title: 'Unpaid Orders',
    icon: cilClock,
    detail: 'Payment still outstanding',
    to: '/orders',
  },
  {
    key: 'PAID',
    title: 'Paid Orders',
    icon: cilCreditCard,
    detail: 'Marked as paid',
    to: '/orders',
  },
]
const Dashboard = () => {
  const { userData } = useAuthSelector()
  const [results, setResults] = useState({})
  const [revision, setRevision] = useState(0)
  const [updatedAt, setUpdatedAt] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    setResults({})
    setUpdatedAt(null)
    Promise.allSettled(
      requests.map(async ({ key, path, params }) => {
        try {
          const { data } = await api.get(path, { params, signal: controller.signal })
          const count = params ? data?.meta?.total : data?.length
          if (!Number.isInteger(count) || count < 0 || !Array.isArray(params ? data?.data : data))
            throw new Error('Invalid dashboard response')
          if (!controller.signal.aborted)
            setResults((previous) => ({
              ...previous,
              [key]: { count, rows: params ? data.data : data },
            }))
        } catch (error) {
          if (!controller.signal.aborted)
            setResults((previous) => ({ ...previous, [key]: { error: apiErrorMessage(error) } }))
        }
      }),
    ).then(() => {
      if (!controller.signal.aborted) setUpdatedAt(new Date())
    })
    return () => controller.abort()
  }, [revision])
  const loading = requests.some(({ key }) => !results[key])
  const failed = requests.some(({ key }) => results[key]?.error)
  const value = (key) =>
    !results[key] ? (
      <CSpinner size="sm" aria-label="Loading" />
    ) : results[key].error ? (
      <span aria-label="Unavailable">Unavailable</span>
    ) : (
      results[key].count.toLocaleString()
    )
  const breakdown = (keys, labels) => (
    <div className="hm-dashboard-breakdown">
      {keys.map((key) => {
        const count = results[key]?.count
        const total = results.orders?.count
        return (
          <div key={key}>
            <div className="d-flex justify-content-between gap-3">
              <span>{labels[key]}</span>
              <strong>{value(key)}</strong>
            </div>
            {count !== undefined && total > 0 && (
              <div className="hm-dashboard-bar" aria-hidden="true">
                <span style={{ width: `${Math.min(100, (count / total) * 100)}%` }} />
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">YOUR BUSINESS AT A GLANCE</span>
          <h1>Welcome back, {userData?.firstName || 'Admin'}</h1>
          <p>Current totals across your HomeMade workspace.</p>
        </div>
        <CButton
          color="primary"
          variant="outline"
          disabled={loading}
          onClick={() => setRevision((value) => value + 1)}
        >
          Refresh stats
        </CButton>
      </div>
      {failed && (
        <CAlert color="warning" role="alert">
          Some statistics could not be loaded. Available figures are shown below.{' '}
          <CButton
            color="link"
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            Retry statistics
          </CButton>
        </CAlert>
      )}
      <CRow className="g-4 hm-metrics">
        {metrics.map((metric) => (
          <CCol xs={12} sm={6} xl={4} key={metric.key}>
            <CCard className="hm-metric" aria-label={metric.title}>
              <CCardBody>
                <div className="hm-metric-top">
                  <span>{metric.title}</span>
                  <span className="hm-metric-icon">
                    <CIcon icon={metric.icon} />
                  </span>
                </div>
                <strong className="hm-dashboard-value">{value(metric.key)}</strong>
                <small>{metric.detail}</small>
                <Link className="hm-text-link d-inline-block mt-3" to={metric.to}>
                  Open {metric.to.slice(1)}
                </Link>
              </CCardBody>
            </CCard>
          </CCol>
        ))}
      </CRow>
      <p className="text-body-secondary mt-3">
        {loading
          ? 'Loading live statistics...'
          : `Last refreshed ${updatedAt?.toLocaleTimeString() || ''}`}
        . Counts include all pages. Completed and paid are separate statuses.
      </p>
      <CRow className="g-4">
        <CCol lg={7}>
          <CCard className="hm-panel h-100">
            <div className="hm-panel-heading">
              <div>
                <h2>Order Status</h2>
                <p>Every step of the workflow.</p>
              </div>
            </div>
            <CCardBody>{breakdown(workflow, statusLabels)}</CCardBody>
          </CCard>
        </CCol>
        <CCol lg={5}>
          <CCard className="hm-panel h-100">
            <div className="hm-panel-heading">
              <div>
                <h2>Payment Status</h2>
                <p>Recorded payment statuses for all orders.</p>
              </div>
            </div>
            <CCardBody>{breakdown(Object.keys(paymentLabels), paymentLabels)}</CCardBody>
          </CCard>
        </CCol>
      </CRow>
      <CCard className="hm-panel mt-4">
        <div className="hm-panel-heading">
          <div>
            <h2>Recent Orders</h2>
            <p>The five most recently placed orders.</p>
          </div>
          <Link className="hm-text-link" to="/orders">
            View all orders
          </Link>
        </div>
        {!results.orders ? (
          <div className="hm-empty" role="status">
            <CSpinner />
            <p>Loading recent orders...</p>
          </div>
        ) : results.orders.error ? (
          <CAlert color="danger" className="m-4">
            {results.orders.error}
          </CAlert>
        ) : (
          <CTable responsive className="hm-table mb-0">
            <CTableHead>
              <CTableRow>
                {['Order', 'Customer', 'Date', 'Total', 'Order status', 'Payment status'].map(
                  (label) => (
                    <CTableHeaderCell scope="col" key={label}>
                      {label}
                    </CTableHeaderCell>
                  ),
                )}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {results.orders.rows.length ? (
                results.orders.rows.map((order) => (
                  <CTableRow key={order.id}>
                    <CTableDataCell>{order.orderNumber}</CTableDataCell>
                    <CTableDataCell>{personName(order.user)}</CTableDataCell>
                    <CTableDataCell>{orderDate(order.createdAt)}</CTableDataCell>
                    <CTableDataCell>{formatPrice(order.totalPrice)}</CTableDataCell>
                    <CTableDataCell>
                      <OrderBadge value={order.status} />
                    </CTableDataCell>
                    <CTableDataCell>
                      <OrderBadge value={order.paymentStatus} payment />
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={6}>
                    <EmptyState
                      title="No orders yet"
                      description="Placed orders will appear here."
                    />
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCard>
    </>
  )
}
export default Dashboard
