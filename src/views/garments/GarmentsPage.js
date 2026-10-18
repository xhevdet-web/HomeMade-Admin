import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  CAlert,
  CButton,
  CCard,
  CFormSwitch,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CNav,
  CNavItem,
  CNavLink,
  CSpinner,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../_helpers/api'
import { useToast } from '../../_helpers/ToastProvider'
import EmptyState from '../../components/EmptyState'
import ProductImage from '../products/ProductImage'
import { formatPrice } from '../products/productHelpers'
import GarmentDrawer from './GarmentDrawer'
import { garmentEndpoints, garmentStock } from './garmentHelpers'

const columns = ['Photo', 'Name', 'Price', 'Variants', 'Total stock', 'Active', 'Sort order', 'Actions']
const sortGarments = (list) =>
  [...list].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))

const GarmentsPage = () => {
  const { categoryId } = useParams()
  const { showToast } = useToast()
  const [category, setCategory] = useState(null)
  const [garments, setGarments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [revision, setRevision] = useState(0)
  const [drawer, setDrawer] = useState(null)
  const [toggling, setToggling] = useState({})
  const [deleting, setDeleting] = useState(null)
  const [deleteState, setDeleteState] = useState({ busy: false, error: null, conflict: false })

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    Promise.all([
      api.get(`/categories/${encodeURIComponent(categoryId)}`, { signal: controller.signal }),
      api.get(garmentEndpoints.list(categoryId), { signal: controller.signal }),
    ])
      .then(([categoryResponse, garmentsResponse]) => {
        if (!categoryResponse.data?.id || !Array.isArray(garmentsResponse.data))
          throw new Error('Invalid garments response')
        setCategory(categoryResponse.data)
        setGarments(sortGarments(garmentsResponse.data))
      })
      .catch((requestError) => {
        if (!controller.signal.aborted)
          setError(apiErrorMessage(requestError, 'Unable to load garments. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [categoryId, revision])

  const upsert = (saved) =>
    setGarments((previous) =>
      sortGarments(
        previous.some((garment) => garment.id === saved.id)
          ? previous.map((garment) => (garment.id === saved.id ? saved : garment))
          : [...previous, saved],
      ),
    )

  // Optimistic: the switch flips immediately and rolls back if the API refuses.
  const toggleActive = async (garment) => {
    const isActive = !garment.isActive
    setToggling((previous) => ({ ...previous, [garment.id]: true }))
    upsert({ ...garment, isActive })
    try {
      const { data } = await api.patch(garmentEndpoints.detail(garment.id), { isActive })
      upsert(data)
      showToast('Success', `${garment.name} ${isActive ? 'activated' : 'deactivated'}.`)
    } catch (requestError) {
      upsert(garment)
      showToast('Error', apiErrorMessage(requestError, 'Unable to change the garment status.'))
    } finally {
      setToggling((previous) => ({ ...previous, [garment.id]: false }))
    }
  }

  const closeDelete = () => {
    setDeleting(null)
    setDeleteState({ busy: false, error: null, conflict: false })
  }
  const confirmDelete = async () => {
    setDeleteState({ busy: true, error: null, conflict: false })
    try {
      await api.delete(garmentEndpoints.detail(deleting.id))
      setGarments((previous) => previous.filter((garment) => garment.id !== deleting.id))
      showToast('Success', `${deleting.name} deleted.`)
      closeDelete()
    } catch (requestError) {
      const conflict = requestError.response?.status === 409
      setDeleteState({
        busy: false,
        conflict,
        error: conflict
          ? 'Customers have already designed on this garment, so it cannot be deleted without breaking their designs and order history. Deactivate it instead to hide it from the studio.'
          : apiErrorMessage(requestError, 'Unable to delete the garment.'),
      })
    }
  }
  const deactivateInstead = async () => {
    setDeleteState((previous) => ({ ...previous, busy: true }))
    try {
      const { data } = await api.patch(garmentEndpoints.detail(deleting.id), { isActive: false })
      upsert(data)
      showToast('Success', `${deleting.name} deactivated.`)
      closeDelete()
    } catch (requestError) {
      setDeleteState({ busy: false, conflict: true, error: apiErrorMessage(requestError) })
    }
  }

  const notApparel = category && category.builderType !== 'APPAREL'
  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">MANAGEMENT · {category?.name?.toUpperCase() || 'CATEGORY'}</span>
          <h1>Garments</h1>
          <p>The blank pieces customers design on, with their sizes, colours and stock.</p>
        </div>
        <CButton color="primary" disabled={loading || !!error || notApparel} onClick={() => setDrawer({ id: null })}>
          New garment
        </CButton>
      </div>
      <CNav variant="underline" className="mb-3" aria-label="Category sections">
        <CNavItem>
          <CNavLink as={Link} to="/categories">
            Categories
          </CNavLink>
        </CNavItem>
        <CNavItem>
          <CNavLink active aria-current="page">
            Garments
          </CNavLink>
        </CNavItem>
      </CNav>
      {notApparel && (
        <CAlert color="warning" role="alert">
          {category.name} is not an Apparel category. Garments can only be added to Apparel
          categories.
        </CAlert>
      )}
      <CCard className="hm-panel">
        <div className="hm-panel-heading">
          <div>
            <h2>{category?.name || 'Category'} garments</h2>
            <p>
              {loading
                ? 'Loading...'
                : error
                  ? 'Garments unavailable'
                  : `${garments.length} ${garments.length === 1 ? 'garment' : 'garments'}`}
            </p>
          </div>
          <CButton color="primary" variant="outline" disabled={loading} onClick={() => setRevision((value) => value + 1)}>
            Refresh
          </CButton>
        </div>
        {loading ? (
          <div className="hm-empty" role="status">
            <CSpinner aria-hidden="true" />
            <p>Loading garments...</p>
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
              {garments.length ? (
                garments.map((garment) => {
                  const variants = garment.variants || []
                  const active = variants.filter((variant) => variant.isActive).length
                  return (
                    <CTableRow key={garment.id}>
                      <CTableDataCell>
                        <ProductImage src={garment.imageUrl} name={garment.name} />
                      </CTableDataCell>
                      <CTableDataCell>
                        <strong>{garment.name}</strong>
                      </CTableDataCell>
                      <CTableDataCell>{formatPrice(garment.basePrice)}</CTableDataCell>
                      <CTableDataCell>
                        {active === variants.length ? variants.length : `${active} of ${variants.length} active`}
                      </CTableDataCell>
                      <CTableDataCell>{garmentStock(garment)}</CTableDataCell>
                      <CTableDataCell>
                        <CFormSwitch
                          id={`garment-active-${garment.id}`}
                          aria-label={`${garment.name} active`}
                          checked={garment.isActive}
                          disabled={!!toggling[garment.id]}
                          onChange={() => toggleActive(garment)}
                        />
                      </CTableDataCell>
                      <CTableDataCell>{garment.sortOrder}</CTableDataCell>
                      <CTableDataCell>
                        <div className="hm-catalog-actions">
                          <CButton color="primary" variant="outline" size="sm" aria-label={`Edit ${garment.name}`} onClick={() => setDrawer({ id: garment.id })}>
                            Edit
                          </CButton>
                          <CButton color="danger" variant="outline" size="sm" aria-label={`Delete ${garment.name}`} onClick={() => setDeleting(garment)}>
                            Delete
                          </CButton>
                        </div>
                      </CTableDataCell>
                    </CTableRow>
                  )
                })
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={columns.length}>
                    <EmptyState
                      title="No garments yet"
                      description="Add a garment, such as a Classic Hoodie, with its mockups, print areas and size × colour stock."
                    />
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCard>
      {drawer && (
        <GarmentDrawer
          key={drawer.id || 'new'}
          categoryId={categoryId}
          garmentId={drawer.id}
          onClose={() => setDrawer(null)}
          onChanged={upsert}
          onSaved={(saved, message) => {
            upsert(saved)
            setDrawer(null)
            showToast('Success', message)
          }}
        />
      )}
      {deleting && (
        <CModal visible alignment="center" backdrop="static" keyboard={!deleteState.busy} onClose={() => !deleteState.busy && closeDelete()} aria-labelledby="garment-delete-title">
          <CModalHeader closeButton={!deleteState.busy}>
            <CModalTitle id="garment-delete-title">Delete garment</CModalTitle>
          </CModalHeader>
          <CModalBody>
            {deleteState.error ? (
              <CAlert color={deleteState.conflict ? 'warning' : 'danger'} role="alert">
                {deleteState.error}
              </CAlert>
            ) : (
              <>
                <p>
                  Delete <strong>{deleting.name}</strong> and all of its variants?
                </p>
                <p className="mb-0">This action cannot be undone.</p>
              </>
            )}
          </CModalBody>
          <CModalFooter>
            <CButton color="secondary" variant="outline" disabled={deleteState.busy} onClick={closeDelete}>
              Cancel
            </CButton>
            {deleteState.conflict ? (
              <CButton color="primary" disabled={deleteState.busy || !deleting.isActive} onClick={deactivateInstead}>
                {deleteState.busy ? 'Deactivating...' : deleting.isActive ? 'Deactivate' : 'Already inactive'}
              </CButton>
            ) : (
              <CButton color="danger" disabled={deleteState.busy} onClick={confirmDelete}>
                {deleteState.busy ? 'Deleting...' : 'Delete garment'}
              </CButton>
            )}
          </CModalFooter>
        </CModal>
      )}
    </>
  )
}
export default GarmentsPage
