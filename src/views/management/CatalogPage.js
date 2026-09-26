import { useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
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
import CatalogDialog from './CatalogDialog'
import { catalogConfig } from './catalogFields'

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
  const filtered = useMemo(
    () =>
      records.filter((record) =>
        `${record.name} ${record.description || ''} ${record.category?.name || ''}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [records, query],
  )
  const columns = [
    'Name',
    ...(isSubCategory ? ['Category', 'Price (cents)', 'Stock'] : []),
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
                      <strong>{record.name}</strong>
                    </CTableDataCell>
                    {isSubCategory && (
                      <>
                        <CTableDataCell>
                          {record.category?.name || 'Unavailable category'}
                        </CTableDataCell>
                        <CTableDataCell>{record.price}</CTableDataCell>
                        <CTableDataCell>{record.stock}</CTableDataCell>
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
                      title={query ? 'No matching results' : `No ${title.toLowerCase()} yet`}
                      description={
                        query
                          ? 'Try a different search.'
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
CatalogPage.propTypes = { kind: PropTypes.oneOf(['categories', 'sub-categories']).isRequired }
export default CatalogPage
