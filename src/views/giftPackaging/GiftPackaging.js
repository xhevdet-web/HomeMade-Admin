import { useEffect, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { apiErrorMessage } from '../../_helpers/api'
import EmptyState from '../../components/EmptyState'
import ProductImage from '../products/ProductImage'
import { formatPrice } from '../products/productHelpers'
import PackagingDialog from './PackagingDialog'
import { listPackaging, updatePackaging } from './giftPackagingApi'
import { availableStock, hasColors, kindLabel } from './packagingHelpers'

const columns = [
  'Image',
  'Name',
  'Type',
  'Price',
  'Stock',
  'Colours',
  'Status',
  'Sort order',
  'Actions',
]

/** The packaging a gift can arrive in: managed apart from the components placed inside it. */
const GiftPackaging = () => {
  const [records, setRecords] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [revision, setRevision] = useState(0)
  const [action, setAction] = useState(null)
  const [toggling, setToggling] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    listPackaging(controller.signal)
      .then((data) => {
        if (!Array.isArray(data)) throw new Error('Invalid list response')
        if (!controller.signal.aborted) setRecords(data)
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setError(apiErrorMessage(failure, 'Unable to load packaging. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [revision])

  const open = (mode, id) => {
    setNotice(null)
    setAction({ mode, id })
  }
  const replace = (saved) =>
    setRecords((previous) =>
      previous.some((record) => record.id === saved.id)
        ? previous.map((record) => (record.id === saved.id ? saved : record))
        : [...previous, saved],
    )
  // Deactivating hides packaging from new gifts; saved designs keep it.
  const toggle = async (record) => {
    setToggling(record.id)
    setNotice(null)
    try {
      replace(await updatePackaging(record.id, { isActive: !record.isActive }))
      setNotice(`${record.name} ${record.isActive ? 'deactivated' : 'activated'}.`)
    } catch (failure) {
      setError(apiErrorMessage(failure))
    } finally {
      setToggling(null)
    }
  }

  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">GIFT</span>
          <h1>Packaging</h1>
          <p>How a gift arrives: transparent to show what is inside, or closed in a colour.</p>
        </div>
        <CButton color="primary" onClick={() => open('create')}>
          Create packaging
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
            <h2>Packaging options</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'Unavailable'
                  : `${records.length} ${records.length === 1 ? 'option' : 'options'}`}
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
            <p>Loading packaging...</p>
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
              {records.length ? (
                records.map((record) => (
                  <CTableRow key={record.id}>
                    <CTableDataCell>
                      <ProductImage src={record.imageUrl} name={record.name} transparent />
                    </CTableDataCell>
                    <CTableDataCell>
                      <strong>{record.name}</strong>
                      {record.description && (
                        <div className="hm-muted small">{record.description}</div>
                      )}
                    </CTableDataCell>
                    <CTableDataCell>{kindLabel(record)}</CTableDataCell>
                    <CTableDataCell>{formatPrice(record.price)}</CTableDataCell>
                    <CTableDataCell>
                      {availableStock(record)}
                      {hasColors(record) && <div className="hm-muted small">across colours</div>}
                    </CTableDataCell>
                    <CTableDataCell>
                      {record.type !== 'OPAQUE' ? (
                        <span className="hm-muted">None</span>
                      ) : record.colors?.length ? (
                        <span className="d-inline-flex flex-wrap gap-1">
                          {record.colors.map((color) => (
                            <span
                              key={color.id}
                              className="hm-swatch m-0"
                              title={`${color.name}${color.isActive ? '' : ' (inactive)'}`}
                              style={{
                                backgroundColor: color.hex,
                                opacity: color.isActive ? 1 : 0.35,
                              }}
                            />
                          ))}
                        </span>
                      ) : (
                        <span className="hm-muted">No colours yet</span>
                      )}
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
                          onClick={() => open('edit', record.id)}
                          aria-label={`Edit ${record.name}`}
                        >
                          Edit
                        </CButton>
                        <CButton
                          color="primary"
                          variant="outline"
                          size="sm"
                          disabled={toggling === record.id}
                          onClick={() => void toggle(record)}
                          aria-label={`${record.isActive ? 'Deactivate' : 'Activate'} ${record.name}`}
                        >
                          {record.isActive ? 'Deactivate' : 'Activate'}
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
                      title="No packaging yet"
                      description="Create a transparent box or a closed box or bag to offer in the Gift Studio."
                    />
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCard>
      {action && (
        <PackagingDialog
          action={action}
          onClose={() => setAction(null)}
          onChanged={replace}
          onSaved={(message, saved) => {
            if (saved) replace(saved)
            setAction(null)
            setNotice(message)
            setRevision((value) => value + 1)
          }}
        />
      )}
    </>
  )
}
export default GiftPackaging
