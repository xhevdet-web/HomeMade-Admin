import { useEffect, useMemo, useState } from 'react'
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
import EmptyState from '../../components/EmptyState'
import CatalogDialog from '../management/CatalogDialog'
import { isJewelryCategory, typesFor } from '../management/catalogFields'
import ProductImage from '../products/ProductImage'
import { formatPrice } from '../products/productHelpers'
import { catalogPaths, useCatalogCategories } from '../catalog/CatalogCategories'
import CatalogPageHeader from '../catalog/CatalogPageHeader'

const colourCell = (color) => (
  <span className="d-inline-flex align-items-center gap-2">
    {color && CSS.supports('color', color) && (
      <span aria-hidden="true" className="hm-swatch" style={{ backgroundColor: color }} />
    )}
    {color || <span className="hm-muted">—</span>}
  </span>
)

/**
 * The subcategories (components, designs, artwork) of one category, with their own add,
 * edit and delete. The category comes from the URL, so the form never asks for it.
 */
const CategorySubCategories = ({ categoryId }) => {
  const { categories, loading: categoriesLoading } = useCatalogCategories()
  const category = categories.find((entry) => entry.id === categoryId)
  const name = category?.name || 'Category'
  const library = category?.designCategoryId
    ? categories.find((entry) => entry.id === category.designCategoryId)
    : null
  const jewelry = isJewelryCategory(category)
  const types = typesFor(category?.builderType)
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [query, setQuery] = useState('')
  const [action, setAction] = useState(null)

  // Only this category's subcategories are loaded; the API filters them.
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get('/sub-categories', {
        params: { categoryId },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid subcategories response')
        if (!controller.signal.aborted) setRecords(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(apiErrorMessage(error, 'Unable to load the subcategories. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [categoryId, revision])

  const search = query.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      records.filter((record) =>
        `${record.name} ${record.description || ''} ${record.type || ''} ${record.color || ''}`
          .toLowerCase()
          .includes(search),
      ),
    [records, search],
  )
  const open = (mode, id) => {
    setNotice(null)
    setAction({ mode, id })
  }
  const addButton = category && (
    <CButton color="primary" onClick={() => open('create')}>
      + Add {name} subcategory
    </CButton>
  )
  const columns = [
    'Image',
    'Name',
    'Type',
    'Colour',
    ...(jewelry ? ['Size'] : []),
    'Price',
    'Stock',
    'Status',
    'Order',
    'Actions',
  ]

  if (!categoriesLoading && categories.length && !category)
    return (
      <CAlert color="warning" role="alert">
        This category no longer exists.{' '}
        <Link to={catalogPaths.subCategoriesOverview}>Choose another category</Link>
      </CAlert>
    )

  return (
    <>
      <CatalogPageHeader
        trail={[
          { label: 'Management' },
          { label: 'SubCategories', to: catalogPaths.subCategoriesOverview },
          { label: name },
        ]}
        title={`${name} subcategories`}
        description={`Manage the components and designs customers use in ${name} designs.`}
        actions={addButton}
      />
      {category && !category.isActive && (
        <CAlert color="info">
          {name} is inactive, so customers do not see it. Its subcategories stay manageable here.
        </CAlert>
      )}
      {/* A shared design library (e.g. Beads for Bracelet) may be inactive and so not in the sidebar. */}
      {library && (
        <CAlert color="info">
          {name} also offers the subcategories of <strong>{library.name}</strong>, its shared
          library.{' '}
          <Link to={catalogPaths.subCategories(library.id)}>
            Manage {library.name} subcategories
          </Link>
        </CAlert>
      )}
      {notice && (
        <CAlert color="success" role="status" dismissible onClose={() => setNotice(null)}>
          {notice}
        </CAlert>
      )}
      <CCard className="hm-panel">
        <div className="hm-panel-heading">
          <div>
            <h2>SubCategories</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'SubCategories unavailable'
                  : search
                    ? `${filtered.length} of ${records.length} match your search`
                    : `${records.length} ${records.length === 1 ? 'subcategory' : 'subcategories'}`}
            </p>
          </div>
          <div className="hm-catalog-tools">
            <CFormInput
              type="search"
              className="hm-search"
              aria-label={`Search ${name} subcategories`}
              placeholder={`Search ${name} subcategories...`}
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
            <p>Loading subcategories...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" className="m-4" role="alert">
            {error}{' '}
            <CButton color="link" onClick={() => setRevision((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
        ) : !filtered.length ? (
          <EmptyState
            title={search ? 'No matching subcategories' : 'No subcategories yet'}
            description={
              search
                ? `Nothing in ${name} matches "${query.trim()}".`
                : `Add the components or designs customers can use for ${name}.`
            }
            action={search ? null : addButton}
          />
        ) : (
          <CTable responsive className="hm-table mb-0">
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
              {filtered.map((record) => (
                <CTableRow key={record.id}>
                  <CTableDataCell>
                    <ProductImage src={record.imageUrl} name={record.name} transparent />
                  </CTableDataCell>
                  <CTableDataCell>
                    <strong>{record.name}</strong>
                  </CTableDataCell>
                  <CTableDataCell>
                    {record.type ? (
                      types[record.type] || record.type
                    ) : (
                      <span className="hm-muted">—</span>
                    )}
                  </CTableDataCell>
                  <CTableDataCell>{colourCell(record.color)}</CTableDataCell>
                  {jewelry && (
                    <CTableDataCell>
                      {/* A jewelry component without a size cannot be used in the app. */}
                      {record.effectiveLengthMm ? (
                        `${record.effectiveLengthMm} mm`
                      ) : (
                        <span className="hm-badge">Size required</span>
                      )}
                    </CTableDataCell>
                  )}
                  <CTableDataCell className="text-nowrap">
                    {formatPrice(record.price ?? 0)}
                  </CTableDataCell>
                  <CTableDataCell>
                    {record.trackStock === false ? 'Unlimited' : record.stock}
                  </CTableDataCell>
                  <CTableDataCell>
                    <span className={`hm-badge ${record.isActive ? 'hm-badge-active' : ''}`}>
                      {record.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </CTableDataCell>
                  <CTableDataCell>{record.sortOrder}</CTableDataCell>
                  <CTableDataCell>
                    <div className="hm-catalog-actions">
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={() => open('view', record.id)}
                        aria-label={`View ${record.name}`}
                      >
                        View
                      </CButton>
                      <CButton
                        color="primary"
                        variant="outline"
                        size="sm"
                        onClick={() => open('edit', record.id)}
                        aria-label={`Edit ${record.name}`}
                      >
                        Edit
                      </CButton>
                      <CButton
                        color="danger"
                        variant="outline"
                        size="sm"
                        onClick={() => open('delete', record.id)}
                        aria-label={`Delete ${record.name}`}
                      >
                        Delete
                      </CButton>
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        )}
      </CCard>
      {action && (
        <CatalogDialog
          kind="sub-categories"
          action={action}
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
CategorySubCategories.propTypes = { categoryId: PropTypes.string.isRequired }

/** Route element: a fresh page (search, dialogs) for every category. */
const SubCategories = () => {
  const { categoryId } = useParams()
  return <CategorySubCategories key={categoryId} categoryId={categoryId} />
}
export default SubCategories
