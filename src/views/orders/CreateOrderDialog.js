import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CForm,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CSpinner,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../_helpers/api'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import ProductImage from '../products/ProductImage'
import { formatPrice } from '../products/productHelpers'
import { paymentTypes, personName } from './orderHelpers'

const CreateOrderDialog = ({ onClose, onCreated }) => {
  const { userData } = useAuthSelector()
  const [products, setProducts] = useState([])
  const [productId, setProductId] = useState('')
  const [size, setSize] = useState('')
  const [paymentType, setPaymentType] = useState('CASH_ON_DELIVERY')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState(null)
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  const [stock, setStock] = useState({ items: [], loading: false, error: null })
  const [stockAttempt, setStockAttempt] = useState(0)
  const profileComplete = ['firstName', 'lastName', 'phone', 'country', 'address'].every((key) =>
    userData?.[key]?.trim(),
  )
  const selected = products.find((product) => product.id === productId)
  // A company product sold in sizes is ordered in one size, with that size's stock.
  const sizes = selected?.origin === 'COMPANY' && Array.isArray(selected.sizes) ? selected.sizes : []
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    api
      .get('/products', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid products response')
        if (!controller.signal.aborted) setProducts(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(error, 'Unable to load products.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])
  const categoryId = selected?.categoryId || selected?.category?.id
  useEffect(() => {
    if (!categoryId) return
    const controller = new AbortController()
    setStock({ items: [], loading: true, error: null })
    api
      .get(`/categories/${encodeURIComponent(categoryId)}/sub-categories`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid stock response')
        if (!controller.signal.aborted) setStock({ items: data, loading: false, error: null })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setStock({
            items: [],
            loading: false,
            error: apiErrorMessage(error, 'Stock unavailable.'),
          })
      })
    return () => controller.abort()
  }, [categoryId, stockAttempt])
  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current || !selected || !profileComplete || userData?.role !== 'ADMIN') return
    submitting.current = true
    setSaving(true)
    setError(null)
    try {
      const { data } = await api.post('/orders', {
        productId,
        ...(sizes.length ? { size } : {}),
        paymentType,
        customerNotes: notes.trim() || null,
      })
      let stockMessage = 'Component stock refreshed.'
      try {
        await Promise.all([
          api.get('/sub-categories'),
          api.get(`/categories/${encodeURIComponent(categoryId)}/sub-categories`),
        ])
      } catch {
        stockMessage =
          'Order saved, but stock could not be refreshed. Reopen Create order to reload stock.'
      }
      onCreated(data, stockMessage)
    } catch (error) {
      const inventory = error.response?.data
      setError(
        error.response?.status === 400 && inventory?.subCategoryName
          ? `Insufficient inventory for ${inventory.subCategoryName}: requested ${inventory.requestedQuantity}, available ${inventory.availableQuantity}.`
          : apiErrorMessage(error),
      )
      if (error.response?.status === 400 && inventory?.subCategoryName)
        setStockAttempt((value) => value + 1)
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }
  return (
    <CModal
      visible
      alignment="center"
      size="lg"
      backdrop="static"
      keyboard={!saving}
      onClose={() => {
        if (!saving) onClose()
      }}
      aria-labelledby="create-order-title"
      className="hm-catalog-modal"
    >
      <CModalHeader closeButton={!saving}>
        <CModalTitle id="create-order-title">Create order</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={submit}>
        <CModalBody>
          <div className="hm-order-info">
            <strong>This order is for {personName(userData)}</strong>
            <p>
              Your signed-in account and delivery profile will be used. You cannot place an order on
              another customer's behalf.
            </p>
            <span>
              {[userData?.address, userData?.postalCode, userData?.country]
                .filter(Boolean)
                .join(', ') || 'Delivery address missing'}
            </span>
          </div>
          {!profileComplete && (
            <CAlert color="warning">
              Your profile needs a first name, last name, phone, country and address before you can
              create an order.
            </CAlert>
          )}
          {error && (
            <CAlert color="danger" role="alert">
              {error}
            </CAlert>
          )}
          {loading ? (
            <div className="hm-empty" role="status">
              <CSpinner aria-hidden="true" />
              <p>Loading products...</p>
            </div>
          ) : loadError ? (
            <CAlert role="alert" color="danger">
              {loadError}{' '}
              <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </CButton>
            </CAlert>
          ) : (
            <fieldset disabled={saving}>
              <CFormLabel htmlFor="order-product">Product</CFormLabel>
              <CFormSelect
                id="order-product"
                value={productId}
                onChange={(event) => {
                  setProductId(event.target.value)
                  setSize('')
                }}
                required
                className="mb-3"
              >
                <option value="">Select a product</option>
                {products.map((product) => (
                  <option key={product.id} value={product.id}>
                    {product.name} - {formatPrice(product.price)}
                  </option>
                ))}
              </CFormSelect>
              {!products.length && <p>No products are available. Add a product first.</p>}
              {sizes.length > 0 && (
                <>
                  <CFormLabel htmlFor="order-size">Size</CFormLabel>
                  <CFormSelect
                    id="order-size"
                    value={size}
                    onChange={(event) => setSize(event.target.value)}
                    required
                    className="mb-3"
                  >
                    <option value="">Select a size</option>
                    {sizes.map((entry) => (
                      <option key={entry.size} value={entry.size} disabled={entry.stock < 1}>
                        {entry.size} - {entry.stock < 1 ? 'sold out' : `${entry.stock} available`}
                      </option>
                    ))}
                  </CFormSelect>
                </>
              )}
              {selected && (
                <div className="hm-order-product-summary">
                  <ProductImage src={selected.imageUrl} name={selected.name} />
                  <div>
                    <strong>{selected.name}</strong>
                    <p>{formatPrice(selected.price)}</p>
                  </div>
                </div>
              )}
              {selected && (
                <div className="hm-order-info">
                  <strong>Component stock</strong>
                  {stock.loading ? (
                    <p>Loading stock...</p>
                  ) : stock.error ? (
                    <p>
                      {stock.error}{' '}
                      <CButton
                        type="button"
                        color="link"
                        onClick={() => setStockAttempt((value) => value + 1)}
                      >
                        Retry stock
                      </CButton>
                    </p>
                  ) : (
                    <ul>
                      {[...new Set((selected.items || []).map((item) => item.subCategoryId))].map(
                        (id) => {
                          const component = stock.items.find((item) => item.id === id)
                          const quantity = selected.items
                            .filter((item) => item.subCategoryId === id)
                            .reduce((sum, item) => sum + item.quantity, 0)
                          return (
                            <li key={id}>
                              {component?.name ||
                                selected.items.find((item) => item.subCategoryId === id)
                                  ?.subCategory?.name ||
                                'Component'}
                              : {quantity} required / {component?.stock ?? 'Unknown'} available
                            </li>
                          )
                        },
                      )}
                    </ul>
                  )}
                  <p>Stock is deducted only when the order is created.</p>
                </div>
              )}
              <CFormLabel htmlFor="order-payment-type">Payment type</CFormLabel>
              <CFormSelect
                id="order-payment-type"
                value={paymentType}
                onChange={(event) => setPaymentType(event.target.value)}
                className="mb-2"
              >
                {Object.entries(paymentTypes).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </CFormSelect>
              {paymentType === 'CARD' && (
                <p className="hm-order-info" role="note">
                  Card records the payment type only. No card payment will be processed.
                </p>
              )}
              <CFormLabel htmlFor="order-customer-notes" className="mt-3">
                Customer notes (optional)
              </CFormLabel>
              <CFormTextarea
                id="order-customer-notes"
                rows={3}
                maxLength={5000}
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </fieldset>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            type="button"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </CButton>
          <CButton
            type="submit"
            color="primary"
            disabled={
              saving ||
              loading ||
              !!loadError ||
              !selected ||
              !profileComplete ||
              (sizes.length > 0 && !size)
            }
          >
            {saving ? 'Placing order...' : 'Place Order'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
CreateOrderDialog.propTypes = {
  onClose: PropTypes.func.isRequired,
  onCreated: PropTypes.func.isRequired,
}
export default CreateOrderDialog
