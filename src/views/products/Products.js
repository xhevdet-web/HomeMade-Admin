import { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CFormInput,
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
import ProductDialog from './ProductDialog'
import ProductImage from './ProductImage'
import DesignPreview from './DesignPreview'
import { creatorName, formatPrice, componentSummary } from './productHelpers'

const Products = () => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [action, setAction] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get('/products', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid products response')
        if (!controller.signal.aborted) setProducts(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(apiErrorMessage(error, 'Unable to load products. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [revision])
  const filtered = useMemo(
    () =>
      products.filter((product) =>
        `${product.name} ${product.category?.name || ''} ${componentSummary(product.items)} ${creatorName(product.createdBy)}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [products, query],
  )
  const open = (mode, id) => {
    setNotice(null)
    setAction({ mode, id })
  }
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">MANAGEMENT</span>
          <h1>Products</h1>
          <p>A considered collection of your handmade creations.</p>
        </div>
        {isAdmin && (
          <CButton color="primary" onClick={() => open('create')}>
            Add Product
          </CButton>
        )}
      </div>
      {notice && (
        <CAlert role="status" color="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </CAlert>
      )}
      <CCard className="hm-panel">
        <div className="hm-panel-heading">
          <div>
            <h2>Product directory</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'Directory unavailable'
                  : `${filtered.length} ${filtered.length === 1 ? 'product' : 'products'}`}
            </p>
          </div>
          <div className="hm-catalog-tools">
            <CFormInput
              type="search"
              className="hm-search"
              aria-label="Search products"
              placeholder="Search your collection..."
              value={query}
              onChange={(event) => setQuery(event.target.value)}
            />
            <CButton
              color="primary"
              variant="outline"
              disabled={loading}
              onClick={() => setRevision((value) => value + 1)}
            >
              Refresh
            </CButton>
          </div>
        </div>
        {loading ? (
          <div className="hm-empty" role="status">
            <CSpinner aria-hidden="true" />
            <p>Loading products...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" role="alert" className="m-4">
            {error}{' '}
            <CButton color="link" onClick={() => setRevision((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
        ) : (
          <CTable responsive className="hm-table hm-products-table mb-0">
            <CTableHead>
              <CTableRow>
                {[
                  'Image',
                  'Design',
                  'Name',
                  'Category',
                  'Product type',
                  'Stock',
                  'Components',
                  'Creator',
                  'Item count',
                  'Price',
                  'Status',
                  'Actions',
                ].map((column) => (
                  <CTableHeaderCell scope="col" key={column}>
                    {column}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.length ? (
                filtered.map((product) => (
                  <CTableRow key={product.id}>
                    <CTableDataCell>
                      <ProductImage src={product.imageUrl} name={product.name} transparent />
                    </CTableDataCell>
                    <CTableDataCell>
                      {product.productType === 'READY_MADE' ? (
                        '—'
                      ) : (
                        <DesignPreview src={product.designPreviewUrl} name={product.name} />
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <strong>{product.name}</strong>
                    </CTableDataCell>
                    <CTableDataCell>
                      {product.category?.name || 'Unavailable category'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {product.productType === 'READY_MADE' ? 'Ready-made' : 'Custom design'}
                    </CTableDataCell>
                    <CTableDataCell>
                      {product.productType === 'READY_MADE' ? product.stock : '—'}
                    </CTableDataCell>
                    <CTableDataCell>{componentSummary(product.items)}</CTableDataCell>
                    <CTableDataCell>{creatorName(product.createdBy)}</CTableDataCell>
                    <CTableDataCell>{product.itemCount}</CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {formatPrice(product.price)}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={`hm-badge ${product.isActive ? 'hm-badge-active' : ''}`}>
                        {product.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      <div className="hm-catalog-actions">
                        <CButton
                          size="sm"
                          color="primary"
                          variant="outline"
                          aria-label={`View ${product.name}`}
                          onClick={() => open('view', product.id)}
                        >
                          View
                        </CButton>
                        {isAdmin && (
                          <>
                            <CButton
                              size="sm"
                              color="primary"
                              variant="outline"
                              aria-label={`Edit ${product.name}`}
                              onClick={() => open('edit', product.id)}
                            >
                              Edit
                            </CButton>
                            <CButton
                              size="sm"
                              color="danger"
                              variant="outline"
                              aria-label={`Delete ${product.name}`}
                              onClick={() => open('delete', product.id)}
                            >
                              Delete
                            </CButton>
                          </>
                        )}
                      </div>
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={12}>
                    <EmptyState
                      title={query ? 'No matching products' : 'No products yet'}
                      description={
                        query
                          ? 'Try a different name, category or creator.'
                          : 'Add your first product to start your collection.'
                      }
                    />
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCard>
      {action && (
        <ProductDialog
          action={action}
          onClose={() => setAction(null)}
          onSaved={(message, saved) => {
            if (saved)
              setProducts((previous) =>
                previous.some((product) => product.id === saved.id)
                  ? previous.map((product) => (product.id === saved.id ? saved : product))
                  : [...previous, saved],
              )
            setAction(null)
            setNotice(message)
            setRevision((value) => value + 1)
          }}
        />
      )}
    </>
  )
}
export default Products
