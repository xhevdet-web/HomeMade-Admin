import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link, useParams } from 'react-router-dom'
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
import { sizeSummary } from '../apparel/apparelHelpers'
import { creatorName, formatPrice, productDate, productImage } from './productHelpers'
import { packagingLabel } from '../giftPackaging/packagingHelpers'
import { sizeLabel } from '../orders/orderHelpers'
import { brandLabel, isCase } from '../cases/caseHelpers'
import { catalogPaths, useCatalogCategories } from '../catalog/CatalogCategories'
import CatalogPageHeader from '../catalog/CatalogPageHeader'

/** One line under a company product's name: model it fits, brand, colour and sizes. */
const companyDetail = (product) =>
  [
    // Ready-made phone cases name the phone model they fit.
    product.baseProduct ? `Fits ${product.baseProduct.name}` : null,
    product.deviceBrand ? brandLabel(product.deviceBrand) : null,
    product.color,
    product.sizes?.length ? `${product.sizes.length} sizes` : null,
  ]
    .filter(Boolean)
    .join(' · ')

/** One line under a customer design's name: what it was made on and what it contains. */
const designDetail = (product) =>
  [
    product.baseProduct ? `On ${product.baseProduct.name}` : null,
    product.selectedSize?.name ? `Size ${sizeLabel(product.selectedSize)}` : null,
    packagingLabel(product),
    `${product.itemCount ?? 0} components`,
  ]
    .filter(Boolean)
    .join(' · ')

const statusBadge = (active) => (
  <span className={`hm-badge ${active ? 'hm-badge-active' : ''}`}>
    {active ? 'Active' : 'Inactive'}
  </span>
)

/**
 * The products of one category: what the company sells (COMPANY: add, edit, delete), or
 * the designs customers saved (CUSTOMER: view only). The category comes from the URL, so
 * forms never ask for it.
 */
const CategoryProducts = ({ origin, categoryId }) => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const company = origin === 'COMPANY'
  const { categories, loading: categoriesLoading } = useCatalogCategories()
  const category = categories.find((entry) => entry.id === categoryId)
  const name = category?.name || 'Category'
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [action, setAction] = useState(null)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search.trim()), 300)
    return () => clearTimeout(timer)
  }, [search])
  // The API filters by category, origin and search.
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get('/products', {
        params: {
          categoryId,
          origin,
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
  }, [categoryId, origin, debouncedSearch, revision])

  const open = (mode, id) => {
    setNotice(null)
    setAction({ mode, id })
  }
  const canAdd = company && isAdmin && !!category
  const addButton = canAdd && (
    <CButton color="primary" onClick={() => open('create')}>
      + Add {name} product
    </CButton>
  )
  const columns = company
    ? ['Image', 'Product', 'Price', 'Stock', 'Status', 'Created', 'Actions']
    : ['Image', 'Design', 'Customer', 'Price', 'Status', 'Created', 'Actions']
  const noun = company ? 'product' : 'design'

  if (!categoriesLoading && categories.length && !category)
    return (
      <CAlert color="warning" role="alert">
        This category no longer exists.{' '}
        <Link to={catalogPaths.productsOverview}>Choose another category</Link>
      </CAlert>
    )

  return (
    <>
      <CatalogPageHeader
        trail={[
          { label: 'Management' },
          { label: 'Products', to: catalogPaths.productsOverview },
          { label: company ? 'Made by Company' : 'Made by Customers' },
          { label: name },
        ]}
        title={company ? `${name} products` : `${name} customer designs`}
        description={
          company
            ? `Manage the ${name} products the company sells.`
            : `Designs customers saved in ${name}. You can view them here; customers own them.`
        }
        actions={
          <>
            <CButton
              as={Link}
              color="primary"
              variant="outline"
              to={
                company
                  ? catalogPaths.customerProducts(categoryId)
                  : catalogPaths.companyProducts(categoryId)
              }
            >
              {company ? 'Customer designs' : 'Company products'}
            </CButton>
            {addButton}
          </>
        }
      />
      {category && !category.isActive && (
        <CAlert color="info">
          {name} is inactive, so customers do not see it. Its products stay manageable here.
        </CAlert>
      )}
      {notice && (
        <CAlert role="status" color="success" dismissible onClose={() => setNotice(null)}>
          {notice}
        </CAlert>
      )}
      <CCard className="hm-panel">
        <div className="hm-panel-heading">
          <div>
            <h2>{company ? 'Products' : 'Customer designs'}</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'Products unavailable'
                  : `${products.length} ${products.length === 1 ? noun : `${noun}s`}${debouncedSearch ? ' match your search' : ''}`}
            </p>
          </div>
          <div className="hm-catalog-tools">
            <CFormInput
              type="search"
              className="hm-search"
              aria-label={`Search ${name} ${noun}s`}
              placeholder={`Search ${name} ${noun}s...`}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
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
            <p>Loading {noun}s...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" role="alert" className="m-4">
            {error}{' '}
            <CButton color="link" onClick={() => setRevision((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
        ) : !products.length ? (
          <EmptyState
            title={
              debouncedSearch
                ? `No matching ${noun}s`
                : company
                  ? 'No products yet'
                  : 'No customer designs yet'
            }
            description={
              debouncedSearch
                ? `Nothing in ${name} matches "${debouncedSearch}".`
                : company
                  ? `Add the first product for the ${name} category.`
                  : `Designs customers save in ${name} appear here.`
            }
            action={!debouncedSearch ? addButton : null}
          />
        ) : (
          <CTable responsive className="hm-table hm-products-table mb-0">
            <CTableHead>
              <CTableRow>
                {columns.map((column) => (
                  <CTableHeaderCell scope="col" key={column}>
                    {column}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {products.map((product) => {
                const detail = company ? companyDetail(product) : designDetail(product)
                return (
                  <CTableRow key={product.id}>
                    <CTableDataCell>
                      <ProductImage src={productImage(product)} name={product.name} transparent />
                    </CTableDataCell>
                    <CTableDataCell>
                      <strong>{product.name}</strong>
                      {company && isCase(category) && (
                        <span className="hm-badge ms-2">
                          {product.baseProductId ? 'Ready-made' : 'Phone model'}
                        </span>
                      )}
                      {detail && <small className="d-block hm-muted">{detail}</small>}
                    </CTableDataCell>
                    {!company && <CTableDataCell>{creatorName(product.createdBy)}</CTableDataCell>}
                    <CTableDataCell className="text-nowrap">
                      {formatPrice(product.price)}
                    </CTableDataCell>
                    {company && (
                      <CTableDataCell>{sizeSummary(product.sizes) ?? product.stock}</CTableDataCell>
                    )}
                    <CTableDataCell>{statusBadge(product.isActive)}</CTableDataCell>
                    <CTableDataCell className="text-nowrap">
                      {productDate(product.createdAt)}
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
                        {company && isAdmin && (
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
                )
              })}
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
          onSaved={(message) => {
            setAction(null)
            setNotice(message)
            setRevision((value) => value + 1)
          }}
        />
      )}
    </>
  )
}
CategoryProducts.propTypes = {
  origin: PropTypes.oneOf(['COMPANY', 'CUSTOMER']).isRequired,
  categoryId: PropTypes.string.isRequired,
}

/** Route element: a fresh page (search, dialogs) for every category and origin. */
const Products = ({ origin }) => {
  const { categoryId } = useParams()
  return (
    <CategoryProducts key={`${origin}-${categoryId}`} origin={origin} categoryId={categoryId} />
  )
}
Products.propTypes = {
  origin: PropTypes.oneOf(['COMPANY', 'CUSTOMER']).isRequired,
}
export default Products
