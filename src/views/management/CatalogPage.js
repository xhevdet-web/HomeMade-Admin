import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CCard,
  CFormInput,
  CFormSelect,
  CSpinner,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { apiErrorMessage } from '../../_helpers/api'
import EmptyState from '../../components/EmptyState'
import CatalogDialog from './CatalogDialog'
import ProductImage from '../products/ProductImage'
import { builderLabels, catalogConfig, isJewelryCategory } from './catalogFields'
import { silhouettes } from '../apparel/apparelHelpers'

const configurationSummary = (record) => {
  if (record.builderType === 'JEWELRY') {
    const count = record.sizes?.length || 0
    if (!count) return 'Not configured'
    const sizes = `${count} ${count === 1 ? 'size' : 'sizes'}`
    // Sizes still in the old component-count format need lengths set.
    return record.sizes.some((size) => !Number.isFinite(size.minMeasurementMm))
      ? `${sizes} · set lengths`
      : `${sizes} · by length`
  }
  if (record.builderType === 'APPAREL')
    return `${silhouettes[record.builderConfig?.silhouette] || 'No'} silhouette`
  // Phone models (template, print area, price, stock) are managed as its products.
  if (record.builderType === 'CASE') return 'Phone models on Products'
  return record.builderType ? 'Studio ready' : 'Not configured'
}

const CatalogPage = ({ kind }) => {
  const { title, singular, endpoint, description } = catalogConfig[kind]
  const isSubCategory = kind === 'sub-categories'
  const [records, setRecords] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [action, setAction] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get(endpoint, { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid list response')
        if (!controller.signal.aborted) setRecords(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setError(apiErrorMessage(error, 'Unable to load this list. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [endpoint, revision])
  // SubCategories can be narrowed to one category; kept in the URL so it survives a refresh.
  const [params, setParams] = useSearchParams()
  const categoryFilter = isSubCategory ? params.get('categoryId') || '' : ''
  const setCategoryFilter = (value) =>
    setParams(
      (previous) => {
        const next = new URLSearchParams(previous)
        if (value) next.set('categoryId', value)
        else next.delete('categoryId')
        return next
      },
      { replace: true },
    )
  const categoryOptions = useMemo(
    () =>
      [
        ...new Map(
          records
            .filter((record) => record.category)
            .map((record) => [record.category.id, record.category]),
        ).values(),
      ].sort((a, b) => a.name.localeCompare(b.name)),
    [records],
  )
  const filtered = useMemo(
    () =>
      records.filter(
        (record) =>
          (!categoryFilter || record.categoryId === categoryFilter) &&
          `${record.name} ${record.description || ''} ${record.category?.name || ''}`
            .toLowerCase()
            .includes(query.trim().toLowerCase()),
      ),
    [records, query, categoryFilter],
  )
  const columns = [
    'Image',
    'Name',
    ...(isSubCategory
      ? ['Category', 'Color', 'Size', 'Price (cents)', 'Stock']
      : ['Type', 'Configuration']),
    'Status',
    'Sort order',
    'Actions',
  ]
  const open = (mode, id) => {
    setNotice(null)
    setAction({ mode, id })
  }
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">MANAGEMENT</span>
          <h1>{title}</h1>
          <p>{description}</p>
        </div>
        <CButton color="primary" onClick={() => open('create')}>
          Create {singular}
        </CButton>
      </div>
      {notice && (
        <CAlert color="success" role="status" dismissible onClose={() => setNotice(null)}>
          {notice}
        </CAlert>
      )}
      <CCard className="hm-panel">
        <div className="hm-panel-heading">
          <div>
            <h2>{title} directory</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'Directory unavailable'
                  : `${filtered.length} ${filtered.length === 1 ? singular : title}`}
            </p>
          </div>
          <div className="hm-catalog-tools">
            {isSubCategory && (
              <CFormSelect
                aria-label="Filter by category"
                className="hm-search"
                value={categoryFilter}
                onChange={(event) => setCategoryFilter(event.target.value)}
              >
                <option value="">All categories</option>
                {categoryOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
                {categoryFilter &&
                  !categoryOptions.some((category) => category.id === categoryFilter) && (
                    <option value={categoryFilter}>Selected category (no components)</option>
                  )}
              </CFormSelect>
            )}
            <CFormInput
              type="search"
              className="hm-search"
              aria-label={`Search ${title}`}
              placeholder="Search by name..."
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
            <p>Loading {title.toLowerCase()}...</p>
          </div>
        ) : error ? (
          <CAlert color="danger" className="m-4" role="alert">
            {error}{' '}
            <CButton color="link" onClick={() => setRevision((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
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
              {filtered.length ? (
                filtered.map((record) => (
                  <CTableRow key={record.id}>
                    <CTableDataCell>
                      <ProductImage
                        src={record.imageUrl}
                        name={record.name}
                        transparent
                      />
                    </CTableDataCell>
                    <CTableDataCell>
                      <strong>{record.name}</strong>
                    </CTableDataCell>
                    {isSubCategory && (
                      <>
                        <CTableDataCell>
                          {record.category?.name || 'Unavailable category'}
                        </CTableDataCell>
                        <CTableDataCell>
                          <span className="d-inline-flex align-items-center gap-2">
                            {record.color && CSS.supports('color', record.color) && (
                              <span
                                aria-hidden="true"
                                style={{
                                  backgroundColor: record.color,
                                  width: 18,
                                  height: 18,
                                  borderRadius: '50%',
                                  border: '1px solid var(--hm-line)',
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            {record.color || 'Not specified'}
                          </span>
                        </CTableDataCell>
                        <CTableDataCell>
                          {/* Only jewelry components are measured; a missing size blocks them in the app. */}
                          {!isJewelryCategory(record.category) ? (
                            <span className="hm-muted">—</span>
                          ) : record.effectiveLengthMm ? (
                            `${record.effectiveLengthMm} mm`
                          ) : (
                            <span className="hm-badge">Physical size required</span>
                          )}
                        </CTableDataCell>
                        <CTableDataCell>{record.price}</CTableDataCell>
                        <CTableDataCell>
                          {record.trackStock === false ? 'Unlimited' : record.stock}
                        </CTableDataCell>
                      </>
                    )}
                    {!isSubCategory && (
                      <>
                        <CTableDataCell>{builderLabels[record.builderType] || 'Not configured'}</CTableDataCell>
                        <CTableDataCell>{configurationSummary(record)}</CTableDataCell>
                      </>
                    )}
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
                        {!isSubCategory && (
                          <CButton
                            as={Link}
                            to={`/products?categoryId=${encodeURIComponent(record.id)}`}
                            color="primary"
                            size="sm"
                            aria-label={`Products of ${record.name}`}
                          >
                            Products
                          </CButton>
                        )}
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
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={columns.length}>
                    <EmptyState
                      title={
                        query || categoryFilter
                          ? 'No matching results'
                          : `No ${title.toLowerCase()} yet`
                      }
                      description={
                        query || categoryFilter
                          ? 'Try a different search or category.'
                          : `Create your first ${singular.toLowerCase()} to get started.`
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
        <CatalogDialog
          kind={kind}
          action={action}
          onClose={() => setAction(null)}
          onSaved={(message, saved) => {
            if (saved)
              setRecords((previous) =>
                previous.some((record) => record.id === saved.id)
                  ? previous.map((record) => (record.id === saved.id ? saved : record))
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
CatalogPage.propTypes = {
  kind: PropTypes.oneOf(['categories', 'sub-categories']).isRequired,
}
export default CatalogPage
