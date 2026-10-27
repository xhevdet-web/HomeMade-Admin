import { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CSpinner,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../_helpers/api'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import EmptyState from '../../components/EmptyState'
import DesignPreview from '../products/DesignPreview'
import { formatPrice } from '../products/productHelpers'
import OrderBadge from './OrderBadge'
import OrderDetails from './OrderDetails'
import CreateOrderDialog from './CreateOrderDialog'
import {
  orderDate,
  paymentLabels,
  paymentTypes,
  personName,
  statusLabels,
  orderedProduct,
  orderDesignImage,
  orderProductLabel,
  isCompanyProduct,
  originLabels,
  sizeLabel,
} from './orderHelpers'

const emptyFilters = {
  orderNumber: '',
  categoryId: '',
  productId: '',
  origin: '',
  status: '',
  paymentStatus: '',
  paymentType: '',
  userId: '',
}
const Orders = () => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const [filters, setFilters] = useState(emptyFilters)
  const [query, setQuery] = useState({ ...emptyFilters, page: 1, limit: 20 })
  const [orders, setOrders] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0, totalPages: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [customers, setCustomers] = useState([])
  const [customerLoading, setCustomerLoading] = useState(true)
  const [customerError, setCustomerError] = useState(null)
  const [customerAttempt, setCustomerAttempt] = useState(0)
  const [selected, setSelected] = useState(null)
  const [creating, setCreating] = useState(false)
  const [categories, setCategories] = useState([])
  const [categoryProducts, setCategoryProducts] = useState({ categoryId: '', items: [] })
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    const params = Object.fromEntries(Object.entries(query).filter(([, value]) => value !== ''))
    api
      .get('/orders', { params, signal: controller.signal })
      .then(({ data }) => {
        if (
          !Array.isArray(data?.data) ||
          !Number.isInteger(data?.meta?.totalPages) ||
          !Number.isInteger(data?.meta?.total)
        )
          throw new Error('Invalid orders response')
        if (controller.signal.aborted) return
        const maxPage = Math.max(1, data.meta.totalPages)
        if (query.page > maxPage) {
          setQuery((previous) => ({ ...previous, page: maxPage }))
          return
        }
        setOrders(data.data)
        setMeta(data.meta)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(apiErrorMessage(error, 'Unable to load orders. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [query, revision])
  useEffect(() => {
    const controller = new AbortController()
    setCustomerLoading(true)
    setCustomerError(null)
    api
      .get('/users', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid customers response')
        if (!controller.signal.aborted) setCustomers(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setCustomerError(apiErrorMessage(error, 'Unable to load customer filters.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setCustomerLoading(false)
      })
    return () => controller.abort()
  }, [customerAttempt])
  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/categories', { signal: controller.signal })
      .then(({ data }) => Array.isArray(data) && setCategories(data))
      .catch(() => {})
    return () => controller.abort()
  }, [])
  // The product filter lists the catalog of the chosen category, filtered by the API.
  useEffect(() => {
    if (!filters.categoryId) return
    const controller = new AbortController()
    const categoryId = filters.categoryId
    api
      .get('/products', { params: { categoryId, origin: 'COMPANY' }, signal: controller.signal })
      .then(({ data }) => Array.isArray(data) && setCategoryProducts({ categoryId, items: data }))
      .catch(() => {})
    return () => controller.abort()
  }, [filters.categoryId])
  const productOptions =
    filters.categoryId && categoryProducts.categoryId === filters.categoryId
      ? categoryProducts.items
      : []
  const refresh = () => setRevision((value) => value + 1)
  const changeFilter = (event) => {
    const { name, value } = event.target
    // A product belongs to one category, so changing the category resets the product.
    setFilters((previous) => ({
      ...previous,
      [name]: value,
      ...(name === 'categoryId' ? { productId: '' } : {}),
    }))
  }
  const selectFilter = (name, label, options) => (
    <div>
      <CFormLabel htmlFor={`filter-${name}`}>{label}</CFormLabel>
      <CFormSelect id={`filter-${name}`} name={name} value={filters[name]} onChange={changeFilter}>
        <option value="">
          All {label.toLowerCase()}
          {label.endsWith('status') ? 'es' : 's'}
        </option>
        {Object.entries(options).map(([value, text]) => (
          <option key={value} value={value}>
            {text}
          </option>
        ))}
      </CFormSelect>
    </div>
  )
  const activeFilters = Object.keys(emptyFilters).filter((key) => query[key]).length
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">SALES &amp; FULFILMENT</span>
          <h1>Orders</h1>
          <p>From a thoughtful creation to a happy delivery.</p>
        </div>
        {isAdmin && (
          <CButton color="primary" onClick={() => setCreating(true)}>
            Create order
          </CButton>
        )}
      </div>
      {notice && (
        <CAlert color="success" role="status" dismissible onClose={() => setNotice(null)}>
          {notice}
        </CAlert>
      )}
      <CCard className="hm-panel hm-order-filters">
        <div className="hm-order-filter-heading">
          <h2>Find an order</h2>
          <span>
            {activeFilters
              ? `${activeFilters} active ${activeFilters === 1 ? 'filter' : 'filters'}`
              : 'Your whole order book, in one place'}
          </span>
        </div>
        <CForm
          onSubmit={(event) => {
            event.preventDefault()
            setQuery({
              ...filters,
              orderNumber: filters.orderNumber.trim(),
              page: 1,
              limit: query.limit,
            })
          }}
        >
          <div className="hm-order-filter-grid">
            <div>
              <CFormLabel htmlFor="filter-orderNumber">Order number</CFormLabel>
              <CFormInput
                id="filter-orderNumber"
                type="search"
                name="orderNumber"
                maxLength={100}
                placeholder="e.g. HM-2026"
                value={filters.orderNumber}
                onChange={changeFilter}
              />
            </div>
            <div>
              <CFormLabel htmlFor="filter-categoryId">Category</CFormLabel>
              <CFormSelect
                id="filter-categoryId"
                name="categoryId"
                value={filters.categoryId}
                onChange={changeFilter}
              >
                <option value="">All categories</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </CFormSelect>
            </div>
            <div>
              <CFormLabel htmlFor="filter-productId">Product</CFormLabel>
              <CFormSelect
                id="filter-productId"
                name="productId"
                value={filters.productId}
                onChange={changeFilter}
                disabled={!filters.categoryId}
                aria-describedby="filter-productId-help"
              >
                <option value="">
                  {filters.categoryId ? 'All products' : 'Choose a category first'}
                </option>
                {productOptions.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name}
                  </option>
                ))}
              </CFormSelect>
              <small id="filter-productId-help" className="hm-muted">
                Includes customer designs made on it.
              </small>
            </div>
            {selectFilter('origin', 'Origin', originLabels)}
            {selectFilter('status', 'Order status', statusLabels)}
            {selectFilter('paymentStatus', 'Payment status', paymentLabels)}
            {selectFilter('paymentType', 'Payment type', paymentTypes)}
            <div>
              <CFormLabel htmlFor="filter-userId">Customer</CFormLabel>
              <CFormSelect
                id="filter-userId"
                name="userId"
                value={filters.userId}
                onChange={changeFilter}
                disabled={customerLoading || !!customerError}
              >
                <option value="">
                  {customerLoading ? 'Loading customers...' : 'All customers'}
                </option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {personName(customer)}
                    {customer.email ? ` (${customer.email})` : ''}
                  </option>
                ))}
              </CFormSelect>
            </div>
          </div>
          <div className="hm-order-filter-actions">
            <CButton type="submit" color="primary">
              Apply filters
            </CButton>
            <CButton
              type="button"
              color="secondary"
              variant="outline"
              onClick={() => {
                setFilters(emptyFilters)
                setQuery({ ...emptyFilters, page: 1, limit: query.limit })
              }}
            >
              Clear filters
            </CButton>
          </div>
        </CForm>
        {customerError && (
          <CAlert color="warning" role="alert" className="mt-3 mb-0">
            Customer filter unavailable. {customerError}{' '}
            <CButton color="link" onClick={() => setCustomerAttempt((value) => value + 1)}>
              Retry customers
            </CButton>
          </CAlert>
        )}
      </CCard>
      <CCard className="hm-panel mt-4">
        <div className="hm-panel-heading">
          <div>
            <h2>Order book</h2>
            <p>
              {loading
                ? 'Loading orders...'
                : error
                  ? 'Orders are temporarily unavailable'
                  : `${meta.total} ${meta.total === 1 ? 'order' : 'orders'}${activeFilters ? ' match your filters' : ' in total'}`}
            </p>
          </div>
          <CButton color="primary" variant="outline" disabled={loading} onClick={refresh}>
            Refresh orders
          </CButton>
        </div>
        {loading ? (
          <div className="hm-empty" role="status">
            <CSpinner aria-hidden="true" />
            <p>Loading orders...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" role="alert" className="m-4">
            {error}{' '}
            <CButton color="link" onClick={refresh}>
              Try again
            </CButton>
          </CAlert>
        ) : (
          <CTable responsive className="hm-table hm-orders-table mb-0">
            <CTableHead>
              <CTableRow>
                {[
                  'Order number',
                  'Customer',
                  'Product',
                  'Design',
                  'Total',
                  'Payment type',
                  'Payment status',
                  'Order status',
                  'Created',
                  'Actions',
                ].map((column) => (
                  <CTableHeaderCell scope="col" key={column}>
                    {column}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {orders.length ? (
                orders.map((order) => (
                  <CTableRow key={order.id}>
                    <CTableDataCell>
                      <button
                        className="hm-order-reference"
                        onClick={() => setSelected({ id: order.id })}
                      >
                        {order.orderNumber}
                      </button>
                    </CTableDataCell>
                    <CTableDataCell>{personName(order.user)}</CTableDataCell>
                    <CTableDataCell>
                      <div className="hm-order-product-info">
                        <strong>{orderedProduct(order)?.name || 'Unavailable product'}</strong>
                        <span className="hm-badge">{orderProductLabel(order)}</span>
                        <small>
                          {orderedProduct(order)?.category?.name || 'Category unavailable'}
                          {!isCompanyProduct(orderedProduct(order)) &&
                            ` · ${orderedProduct(order)?.itemCount ?? 0} components`}
                          {orderedProduct(order)?.selectedSize?.name &&
                            ` · Size ${sizeLabel(orderedProduct(order).selectedSize)}`}
                        </small>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>
                      <DesignPreview
                        src={orderDesignImage(order)}
                        name={orderedProduct(order)?.name}
                        readyMade={isCompanyProduct(orderedProduct(order))}
                      />
                    </CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {formatPrice(order.totalPrice)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {paymentTypes[order.paymentType] || order.paymentType}
                    </CTableDataCell>
                    <CTableDataCell>
                      <OrderBadge value={order.paymentStatus} payment />
                    </CTableDataCell>
                    <CTableDataCell>
                      <OrderBadge value={order.status} />
                    </CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {orderDate(order.createdAt)}
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="hm-catalog-actions">
                        <CButton
                          size="sm"
                          color="primary"
                          variant="outline"
                          aria-label={`View details ${order.orderNumber}`}
                          onClick={() => setSelected({ id: order.id })}
                        >
                          View details
                        </CButton>
                        {isAdmin && (
                          <CButton
                            size="sm"
                            color="danger"
                            variant="outline"
                            aria-label={`Delete ${order.orderNumber}`}
                            onClick={() => setSelected({ id: order.id, delete: true })}
                          >
                            Delete
                          </CButton>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={10}>
                    <EmptyState
                      title={
                        activeFilters ? 'No orders match your filters' : 'Your order book is ready'
                      }
                      description={
                        activeFilters
                          ? 'Adjust the filters or clear them to see more orders.'
                          : 'Orders will appear here as your customers place them.'
                      }
                    />
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
        <div className="hm-order-pagination">
          <div>
            <CFormLabel htmlFor="order-page-size">Orders per page</CFormLabel>
            <CFormSelect
              id="order-page-size"
              value={query.limit}
              onChange={(event) =>
                setQuery((previous) => ({
                  ...previous,
                  page: 1,
                  limit: Number(event.target.value),
                }))
              }
            >
              {[20, 50, 100].map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </CFormSelect>
          </div>
          <span>
            {!loading &&
              !error &&
              (meta.total
                ? `${(meta.page - 1) * meta.limit + 1}-${Math.min(meta.page * meta.limit, meta.total)} of ${meta.total}`
                : '0 orders')}
          </span>
          <nav aria-label="Order pagination">
            <CButton
              color="primary"
              variant="outline"
              disabled={loading || !!error || query.page <= 1}
              onClick={() => setQuery((previous) => ({ ...previous, page: previous.page - 1 }))}
            >
              Previous
            </CButton>
            <span>
              {loading
                ? 'Loading...'
                : error
                  ? 'Unavailable'
                  : `Page ${meta.totalPages ? meta.page : 0} of ${meta.totalPages}`}
            </span>
            <CButton
              color="primary"
              variant="outline"
              disabled={loading || !!error || query.page >= meta.totalPages}
              onClick={() => setQuery((previous) => ({ ...previous, page: previous.page + 1 }))}
            >
              Next
            </CButton>
          </nav>
        </div>
      </CCard>
      {selected && (
        <OrderDetails
          key={selected.id}
          id={selected.id}
          initialDelete={!!selected.delete}
          onClose={() => setSelected(null)}
          onChanged={refresh}
          onDeleted={(message) => {
            setSelected(null)
            setNotice(message)
            refresh()
          }}
        />
      )}
      {creating && (
        <CreateOrderDialog
          onClose={() => setCreating(false)}
          onCreated={(order, stockMessage) => {
            setCreating(false)
            setNotice(`Order ${order.orderNumber} created for your account. ${stockMessage}`)
            refresh()
            setSelected({ id: order.id })
          }}
        />
      )}
    </>
  )
}
export default Orders
