import { useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
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
import ProductDialog from './ProductDialog'
import ProductImage from './ProductImage'
import { sizeSummary } from '../apparel/apparelHelpers'
import {
  creatorName,
  formatPrice,
  isCompany,
  originLabels,
  productDate,
  productImage,
} from './productHelpers'
import { packagingLabel } from '../giftPackaging/packagingHelpers'
import { sizeLabel } from '../orders/orderHelpers'

/** One line under the name: colour and sizes, or what a customer design was made on. */
const productDetail = (product) =>
  isCompany(product)
    ? [product.color, product.sizes?.length ? `${product.sizes.length} sizes` : null]
        .filter(Boolean)
        .join(' · ')
    : [
        product.baseProduct ? `On ${product.baseProduct.name}` : null,
        product.selectedSize?.name ? `Size ${sizeLabel(product.selectedSize)}` : null,
        packagingLabel(product),
        `${product.itemCount ?? 0} components`,
      ]
        .filter(Boolean)
        .join(' · ')

const Products = () => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const [params, setParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [categoriesState, setCategoriesState] = useState({ loading: true, error: null })
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [action, setAction] = useState(null)
  // The category is part of the URL, so the Categories page can link straight to it.
  const categoryId =
    params.get('categoryId') && categories.some((category) => category.id === params.get('categoryId'))
      ? params.get('categoryId')
      : categories[0]?.id || ''
  const origin = params.get('origin') || ''
  const category = categories.find((entry) => entry.id === categoryId)
  const setFilter = (key, value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set(key, value)
        else next.delete(key)
        return next
      },
      { replace: true },
    )

  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/categories', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid categories response')
        if (!controller.signal.aborted) {
          setCategories(data)
          setCategoriesState({ loading: false, error: null })
        }
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setCategoriesState({
            loading: false,
            error: apiErrorMessage(error, 'Unable to load categories. Please try again.'),
          })
      })
    return () => controller.abort()
  }, [revision])
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])
  // Only the chosen category's products are loaded; the API filters them.
  useEffect(() => {
    if (!categoryId) {
      setProducts([])
      setLoading(categoriesState.loading)
      return
    }
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get('/products', {
        params: {
          categoryId,
          ...(origin ? { origin } : {}),
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
        },
        signal: controller.signal,
      })
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
  }, [categoryId, origin, debouncedSearch, revision, categoriesState.loading])
  const open = (mode, id) => {
    setNotice(null)
    setAction({ mode, id })
  }
  const filtered = !!origin || !!debouncedSearch
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">MANAGEMENT</span>
          <h1>Products</h1>
          <p>Your catalog and your customers&apos; creations, one category at a time.</p>
        </div>
        {isAdmin && (
          <CButton color="primary" disabled={!categories.length} onClick={() => open('create')}>
            Add Product
          </CButton>
        )}
      </div>
      {notice && (
        <CAlert role="status" color="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </CAlert>
      )}
      <CCard className="hm-panel hm-order-filters">
        <div className="hm-order-filter-grid">
          <div>
            <CFormLabel htmlFor="product-filter-category">Category</CFormLabel>
            <CFormSelect
              id="product-filter-category"
              value={categoryId}
              disabled={!categories.length}
              onChange={(event) => setFilter('categoryId', event.target.value)}
            >
              {!categories.length && (
                <option value="">
                  {categoriesState.loading ? 'Loading categories...' : 'No categories yet'}
                </option>
              )}
              {categories.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div>
            <CFormLabel htmlFor="product-filter-origin">Origin</CFormLabel>
            <CFormSelect
              id="product-filter-origin"
              value={origin}
              onChange={(event) => setFilter('origin', event.target.value)}
            >
              <option value="">Company and customer</option>
              {Object.entries(originLabels).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </CFormSelect>
          </div>
          <div>
            <CFormLabel htmlFor="product-filter-search">Search</CFormLabel>
            <CFormInput
              id="product-filter-search"
              type="search"
              placeholder="Name, description or colour"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
        </div>
        {categoriesState.error && (
          <CAlert color="danger" role="alert" className="mt-3 mb-0">
            {categoriesState.error}{' '}
            <CButton color="link" onClick={() => setRevision((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
        )}
      </CCard>
      <CCard className="hm-panel mt-4">
        <div className="hm-panel-heading">
          <div>
            <h2>{category ? category.name : 'Catalog'}</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'Products unavailable'
                  : `${products.length} ${products.length === 1 ? 'product' : 'products'}${filtered ? ' match your filters' : ''}`}
            </p>
          </div>
          <CButton
            color="primary"
            variant="outline"
            disabled={loading}
            onClick={() => setRevision((value) => value + 1)}
          >
            Refresh
          </CButton>
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
                  'Product',
                  'Origin',
                  'Price',
                  'Stock',
                  'Created by',
                  'Created',
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
              {products.length ? (
                products.map((product) => (
                  <CTableRow key={product.id}>
                    <CTableDataCell>
                      <ProductImage src={productImage(product)} name={product.name} transparent />
                    </CTableDataCell>
                    <CTableDataCell>
                      <strong>{product.name}</strong>
                      {productDetail(product) && (
                        <small className="d-block hm-muted">{productDetail(product)}</small>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={`hm-badge ${isCompany(product) ? 'hm-badge-active' : ''}`}>
                        {originLabels[product.origin] || product.origin}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {formatPrice(product.price)}
                    </CTableDataCell>
                    <CTableDataCell>
                      {isCompany(product) ? (sizeSummary(product.sizes) ?? product.stock) : '—'}
                    </CTableDataCell>
                    <CTableDataCell>{creatorName(product.createdBy)}</CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {productDate(product.createdAt)}
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
                  <CTableDataCell colSpan={9}>
                    <EmptyState
                      title={filtered ? 'No matching products' : 'No products in this category yet'}
                      description={
                        filtered
                          ? 'Try another origin or search.'
                          : 'Add a company product, or wait for customers to save their designs.'
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
          categories={categories}
          categoryId={categoryId}
          onClose={() => setAction(null)}
          onSaved={(message, saved) => {
            setAction(null)
            setNotice(message)
            // A product saved into another category takes the list with it.
            if (saved?.categoryId && saved.categoryId !== categoryId)
              setFilter('categoryId', saved.categoryId)
            setRevision((value) => value + 1)
          }}
        />
      )}
    </>
  )
}
export default Products
