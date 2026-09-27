import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CForm,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CSpinner,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../_helpers/api'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import ProductImage from '../products/ProductImage'
import DesignPreview from '../products/DesignPreview'
import ComponentTable from '../products/ComponentTable'
import { formatPrice } from '../products/productHelpers'
import OrderBadge from './OrderBadge'
import {
  nextStatus,
  orderDate,
  paymentLabels,
  paymentTypes,
  personName,
  statusLabels,
  workflow,
} from './orderHelpers'

const Facts = ({ entries }) => (
  <dl className="hm-order-facts">
    {entries.map(([label, value]) => (
      <div key={label}>
        <dt>{label}</dt>
        <dd>{value === null || value === undefined || value === '' ? 'Not provided' : value}</dd>
      </div>
    ))}
  </dl>
)
Facts.propTypes = { entries: PropTypes.array.isRequired }

const OrderDetails = ({ id, initialDelete = false, onClose, onChanged, onDeleted }) => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [busy, setBusy] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [notes, setNotes] = useState('')
  const [image, setImage] = useState('')
  const [payment, setPayment] = useState('')
  const [stale, setStale] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState(initialDelete)
  const [closeWarning, setCloseWarning] = useState(false)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    api
      .get(`/orders/${encodeURIComponent(id)}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!data?.id) throw new Error('Invalid order response')
        if (controller.signal.aborted) return
        setOrder(data)
        setNotes(data.adminNotes ?? '')
        setImage(data.finalImageUrl ?? '')
        setPayment(data.paymentStatus)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(error, 'Unable to load this order.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [id, attempt])
  const dirty =
    order &&
    (notes !== (order.adminNotes ?? '') ||
      image !== (order.finalImageUrl ?? '') ||
      payment !== order.paymentStatus)
  const requestClose = () => {
    if (!busy) {
      if (dirty) setCloseWarning(true)
      else onClose()
    }
  }
  const reloadConflict = async () => {
    // Keep unsaved notes/image while replacing the workflow with the server's current state.
    try {
      const { data } = await api.get(`/orders/${encodeURIComponent(id)}`)
      if (!data?.id) throw new Error('Invalid order response')
      setOrder(data)
      setPayment(data.paymentStatus)
      setStale(false)
      setError(null)
      setNotice(
        'The order changed. The latest version is loaded; review its status before trying again.',
      )
      onChanged()
    } catch (error) {
      setStale(true)
      setError(apiErrorMessage(error, 'Unable to reload the order. Reload it before advancing.'))
    }
  }
  const mutate = async (kind, payload) => {
    if (busy || !isAdmin || (kind === 'status' && stale)) return
    setBusy(kind)
    setError(null)
    setNotice(null)
    try {
      if (kind === 'delete') {
        await api.delete(`/orders/${encodeURIComponent(id)}`)
        onDeleted(`Order ${order.orderNumber} deleted.`)
      } else {
        const suffix = kind === 'notes' ? '' : kind === 'status' ? '/status' : '/payment-status'
        const { data } = await api.patch(`/orders/${encodeURIComponent(id)}${suffix}`, payload)
        setOrder(data)
        if (kind === 'notes') {
          setNotes(data.adminNotes ?? '')
          setImage(data.finalImageUrl ?? '')
        }
        if (kind === 'payment') setPayment(data.paymentStatus)
        setNotice(
          kind === 'notes'
            ? 'Notes and image saved.'
            : kind === 'status'
              ? `Order moved to ${statusLabels[data.status]}.`
              : 'Payment status updated.',
        )
        onChanged()
      }
    } catch (error) {
      if (kind === 'status' && error.response?.status === 409) {
        setStale(true)
        await reloadConflict()
      } else setError(apiErrorMessage(error))
    } finally {
      setBusy(null)
    }
  }
  const next = nextStatus(order?.status)
  const product = order?.product
  return (
    <CModal
      visible
      className="hm-order-panel hm-catalog-modal"
      backdrop="static"
      keyboard={!busy}
      onClose={requestClose}
      aria-labelledby="order-details-title"
      scrollable
    >
      <CModalHeader closeButton={!busy}>
        <div>
          <span className="hm-eyebrow">ORDER WORKSPACE</span>
          <CModalTitle id="order-details-title">
            {order?.orderNumber || 'Order details'}
          </CModalTitle>
        </div>
      </CModalHeader>
      <CModalBody>
        {loading ? (
          <div className="hm-empty" role="status">
            <CSpinner aria-hidden="true" />
            <p>Loading order...</p>
          </div>
        ) : loadError ? (
          <CAlert color="danger" role="alert">
            {loadError}{' '}
            <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
        ) : (
          order && (
            <>
              {closeWarning && (
                <CAlert color="warning" role="alert">
                  You have unsaved changes.
                  <div className="d-flex gap-2 mt-2">
                    <CButton color="secondary" onClick={() => setCloseWarning(false)}>
                      Keep editing
                    </CButton>
                    <CButton color="danger" onClick={onClose}>
                      Discard changes
                    </CButton>
                  </div>
                </CAlert>
              )}
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              {notice && (
                <CAlert color="success" role="status">
                  {notice}
                </CAlert>
              )}
              {deleteConfirm && (
                <div className="hm-order-delete" role="alert">
                  <strong>Delete {order.orderNumber}?</strong>
                  <p>This permanently deletes the order. This action cannot be undone.</p>
                  <div className="d-flex gap-2">
                    <CButton
                      color="danger"
                      disabled={!!busy || !isAdmin}
                      onClick={() => mutate('delete')}
                    >
                      {busy === 'delete' ? 'Deleting...' : 'Confirm deletion'}
                    </CButton>
                    <CButton
                      color="secondary"
                      variant="outline"
                      disabled={!!busy}
                      onClick={() => setDeleteConfirm(false)}
                    >
                      Cancel deletion
                    </CButton>
                  </div>
                </div>
              )}
              <div className="hm-order-summary">
                <div>
                  <OrderBadge value={order.status} />
                  <p>{orderDate(order.createdAt, true)}</p>
                  <p>{personName(order.user)}</p>
                </div>
                <div>
                  <span>Order total</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                  <small>Price at the time of ordering</small>
                </div>
              </div>
              <section className="hm-order-section hm-customer-design">
                <span className="hm-eyebrow">CUSTOMER DESIGN</span>
                <h3>{product?.name || 'Jewelry design'}</h3>
                <DesignPreview src={product?.designPreviewUrl} name={product?.name} large />
                <h4>Components / materials</h4>
                <ComponentTable items={product?.items} />
                <div className="hm-design-total">
                  <span>Order total</span>
                  <strong>{formatPrice(order.totalPrice)}</strong>
                </div>
              </section>
              <section className="hm-order-section">
                <h3>Product</h3>
                <div className="hm-order-product-summary">
                  <ProductImage src={product?.imageUrl} name={product?.name} large />
                  <div>
                    <h4>{product?.name || 'Unavailable product'}</h4>
                    <p className="hm-order-text">
                      {product?.description || 'No description provided.'}
                    </p>
                    <span>{product?.itemCount ?? 0} items</span>
                  </div>
                </div>
                <div className="hm-order-two-columns">
                  <div>
                    <h4>Category</h4>
                    <div className="hm-order-product-summary">
                      <ProductImage
                        src={product?.category?.imageUrl}
                        name={product?.category?.name}
                      />
                      <div>
                        <strong>{product?.category?.name || 'Unavailable'}</strong>
                        <p>{product?.category?.description || 'No description provided.'}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </section>
              <section className="hm-order-section">
                <h3>Customer notes</h3>
                <p className="hm-order-text">{order.customerNotes || 'No customer notes.'}</p>
              </section>
              <section className="hm-order-section">
                <div className="hm-order-section-heading">
                  <h3>Payment</h3>
                  <OrderBadge value={order.paymentStatus} payment />
                </div>
                <p>{paymentTypes[order.paymentType]}</p>
                <CForm
                  onSubmit={(event) => {
                    event.preventDefault()
                    mutate('payment', { paymentStatus: payment })
                  }}
                >
                  <div className="hm-order-payment-controls">
                    <div>
                      <CFormLabel htmlFor="order-payment-status">Payment status</CFormLabel>
                      <CFormSelect
                        id="order-payment-status"
                        value={payment}
                        onChange={(event) => setPayment(event.target.value)}
                        disabled={!!busy || !isAdmin}
                      >
                        {Object.entries(paymentLabels).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </CFormSelect>
                    </div>
                    <CButton
                      type="submit"
                      color="primary"
                      variant="outline"
                      disabled={!!busy || !isAdmin || payment === order.paymentStatus}
                    >
                      {busy === 'payment' ? 'Saving...' : 'Update payment status'}
                    </CButton>
                  </div>
                </CForm>
                <p className="hm-order-section-caption mt-2">
                  This records payment status only; it does not charge a card or issue a refund.
                </p>
              </section>
              <div className="hm-order-two-columns">
                <section className="hm-order-section">
                  <h3>Delivery snapshot</h3>
                  <p className="hm-order-section-caption">
                    Saved when the order was placed. Read-only.
                  </p>
                  <Facts
                    entries={[
                      ['Name', personName(order)],
                      ['Phone', order.phone],
                      ['Country', order.country],
                      ['Address', order.address],
                      ['Postal code', order.postalCode],
                    ]}
                  />
                </section>
                <section className="hm-order-section">
                  <h3>Customer now</h3>
                  <p className="hm-order-section-caption">Current contact information.</p>
                  <Facts
                    entries={[
                      ['Name', personName(order.user)],
                      ['Email', order.user?.email],
                      ['Phone', order.user?.phone],
                    ]}
                  />
                </section>
              </div>
              <section className="hm-order-section">
                <div className="hm-order-section-heading">
                  <h3>Order journey</h3>
                  <span>
                    {order.status === 'COMPLETED'
                      ? 'Complete'
                      : `Step ${workflow.indexOf(order.status) + 1} of ${workflow.length}`}
                  </span>
                </div>
                <ol className="hm-order-workflow">
                  {workflow.map((status, index) => (
                    <li
                      key={status}
                      className={index <= workflow.indexOf(order.status) ? 'is-reached' : ''}
                      aria-current={order.status === status ? 'step' : undefined}
                    >
                      <span>{index + 1}</span>
                      {statusLabels[status]}
                    </li>
                  ))}
                </ol>
                <div className="hm-order-advance">
                  <div>
                    <strong>
                      {next ? `Next: ${statusLabels[next]}` : 'This order is complete'}
                    </strong>
                    <p>Orders move forward one step at a time.</p>
                  </div>
                  <CButton
                    color="primary"
                    disabled={!!busy || !next || stale || !isAdmin}
                    onClick={() => mutate('status', { status: next })}
                  >
                    {busy === 'status'
                      ? 'Updating...'
                      : next
                        ? 'Move to next status'
                        : 'Order completed'}
                  </CButton>
                </div>
                {stale && (
                  <CButton
                    className="mt-2"
                    color="primary"
                    variant="outline"
                    disabled={!!busy}
                    onClick={async () => {
                      setBusy('reload')
                      await reloadConflict()
                      setBusy(null)
                    }}
                  >
                    Reload latest order
                  </CButton>
                )}
              </section>
              <section className="hm-order-section">
                <h3>Studio notes &amp; finished piece</h3>
                <CForm
                  onSubmit={(event) => {
                    event.preventDefault()
                    mutate('notes', {
                      adminNotes: notes.trim() || null,
                      finalImageUrl: image.trim() || null,
                    })
                  }}
                >
                  <fieldset disabled={!!busy || !isAdmin}>
                    <CFormLabel htmlFor="order-admin-notes">Admin notes</CFormLabel>
                    <CFormTextarea
                      id="order-admin-notes"
                      rows={4}
                      maxLength={5000}
                      value={notes}
                      onChange={(event) => setNotes(event.target.value)}
                    />
                    <CFormLabel className="mt-3" htmlFor="order-final-image">
                      Final image URL (optional)
                    </CFormLabel>
                    <CFormInput
                      id="order-final-image"
                      type="url"
                      pattern="https?://.+"
                      maxLength={2048}
                      value={image}
                      onChange={(event) => setImage(event.target.value)}
                      placeholder="https://example.com/finished-piece.jpg"
                    />
                    {image && (
                      <div className="mt-3">
                        <ProductImage src={image} name="Finished piece" large />
                      </div>
                    )}
                    <CButton
                      type="submit"
                      color="primary"
                      className="mt-3"
                      disabled={
                        notes === (order.adminNotes ?? '') && image === (order.finalImageUrl ?? '')
                      }
                    >
                      {busy === 'notes' ? 'Saving...' : 'Save notes and image'}
                    </CButton>
                  </fieldset>
                </CForm>
              </section>
              <div className="hm-order-panel-footer">
                <CButton
                  color="secondary"
                  variant="outline"
                  disabled={!!busy}
                  onClick={requestClose}
                >
                  Close details
                </CButton>
                {isAdmin && !deleteConfirm && (
                  <CButton
                    color="danger"
                    variant="outline"
                    disabled={!!busy}
                    onClick={() => {
                      setDeleteConfirm(true)
                      document
                        .querySelector('.hm-order-panel .modal-body')
                        ?.scrollTo({ top: 0, behavior: 'smooth' })
                    }}
                  >
                    Delete order
                  </CButton>
                )}
              </div>
            </>
          )
        )}
      </CModalBody>
    </CModal>
  )
}
OrderDetails.propTypes = {
  id: PropTypes.string.isRequired,
  initialDelete: PropTypes.bool,
  onClose: PropTypes.func.isRequired,
  onChanged: PropTypes.func.isRequired,
  onDeleted: PropTypes.func.isRequired,
}
export default OrderDetails
