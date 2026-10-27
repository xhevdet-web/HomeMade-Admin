import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import { apiErrorMessage } from '../../_helpers/api'
import ImagePicker from '../../components/ImagePicker'
import { formatPrice } from '../products/productHelpers'
import PackagingColorEditor from './PackagingColorEditor'
import { createPackaging, deletePackaging, getPackaging, updatePackaging } from './giftPackagingApi'
import {
  availableStock,
  hasColors,
  packagingForm,
  packagingPayload,
  packagingShapes,
  packagingTypes,
} from './packagingHelpers'

/**
 * Create, edit or delete one packaging option. A new closed packaging stays open after it
 * is created, so its colours can be added straight away.
 */
const PackagingDialog = ({ action: initialAction, onClose, onSaved, onChanged }) => {
  const [action, setAction] = useState(initialAction)
  const [record, setRecord] = useState(null)
  const [form, setForm] = useState(packagingForm())
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(action.mode !== 'create')
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState(null)
  const [notice, setNotice] = useState(null)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)
  const submitting = useRef(false)

  useEffect(() => {
    if (initialAction.mode === 'create') return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    getPackaging(initialAction.id, controller.signal)
      .then((data) => {
        if (!data || typeof data.id !== 'string') throw new Error('Invalid detail response')
        if (controller.signal.aborted) return
        setRecord(data)
        setForm(packagingForm(data))
      })
      .catch((failure) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(failure, 'Unable to load this packaging. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [initialAction, attempt])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  const colored = hasColors(record)
  const opaque = form.type === 'OPAQUE'

  // Colour changes are saved by the editor; reload so stock and swatches stay current.
  const reload = async () => {
    const fresh = await getPackaging(record.id)
    setRecord(fresh)
    onChanged(fresh)
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current) return
    setError(null)
    setNotice(null)
    submitting.current = true
    setSaving(true)
    try {
      if (action.mode === 'delete') {
        await deletePackaging(action.id)
        onSaved(`${record?.name || 'Packaging'} deleted.`)
        return
      }
      let fields
      try {
        fields = packagingPayload(form, colored && opaque)
      } catch (validationError) {
        setError(validationError.message)
        return
      }
      if (action.mode === 'create') {
        const saved = await createPackaging(fields, file)
        setFile(null)
        if (saved.type === 'OPAQUE') {
          // Stay open on the new packaging so its colours can be added now.
          setRecord(saved)
          setForm(packagingForm(saved))
          setAction({ mode: 'edit', id: saved.id })
          onChanged(saved)
          setNotice(`${saved.name} created. Now add the colours it comes in.`)
          return
        }
        onSaved(`${saved.name} created.`, saved)
        return
      }
      const saved = await updatePackaging(action.id, fields, file)
      onSaved(`${saved.name} updated.`, saved)
    } catch (failure) {
      setError(apiErrorMessage(failure))
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  const title =
    action.mode === 'create'
      ? 'Create packaging'
      : action.mode === 'delete'
        ? 'Delete packaging'
        : `Edit ${record?.name || 'packaging'}`

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
      aria-labelledby="packaging-dialog-title"
      className="hm-catalog-modal"
    >
      <CModalHeader closeButton={!saving}>
        <CModalTitle id="packaging-dialog-title">{title}</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={submit}>
        <CModalBody>
          {loading ? (
            <div className="hm-empty" role="status">
              <CSpinner aria-hidden="true" />
              <p>Loading packaging...</p>
            </div>
          ) : loadError ? (
            <CAlert color="danger" role="alert">
              {loadError}{' '}
              <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </CButton>
            </CAlert>
          ) : action.mode === 'delete' ? (
            <>
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              <p>
                Delete <strong>{record?.name}</strong> and its colours?
              </p>
              <CAlert color="warning">
                Packaging used by saved gifts cannot be deleted. Deactivate it instead: it
                disappears from the Gift Studio and existing designs stay intact.
              </CAlert>
            </>
          ) : (
            <>
              {notice && (
                <CAlert color="success" role="status">
                  {notice}
                </CAlert>
              )}
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              <fieldset disabled={saving}>
                <CRow className="g-3">
                  <CCol md={6}>
                    <CFormLabel htmlFor="packaging-name">Name</CFormLabel>
                    <CFormInput
                      id="packaging-name"
                      name="name"
                      required
                      maxLength={120}
                      placeholder="e.g. Classic Closed Box"
                      value={form.name}
                      onChange={change}
                    />
                  </CCol>
                  <CCol md={6}>
                    <span className="form-label d-block">Packaging type</span>
                    <div role="radiogroup" aria-label="Packaging type">
                      {Object.entries(packagingTypes).map(([value, { label, hint }]) => (
                        <CFormCheck
                          key={value}
                          type="radio"
                          name="type"
                          id={`packaging-type-${value}`}
                          value={value}
                          label={
                            <>
                              <strong>{label}</strong>
                              <span className="hm-muted small d-block">{hint}</span>
                            </>
                          }
                          checked={form.type === value}
                          // Transparency is not a colour: remove colours before switching.
                          disabled={value === 'TRANSPARENT' && colored}
                          onChange={change}
                        />
                      ))}
                    </div>
                    {colored && (
                      <small className="hm-muted">
                        Remove its colours to make this packaging transparent.
                      </small>
                    )}
                  </CCol>
                  {opaque && (
                    <CCol md={6}>
                      <CFormLabel htmlFor="packaging-shape">Box shape</CFormLabel>
                      <CFormSelect
                        id="packaging-shape"
                        name="shape"
                        value={form.shape}
                        onChange={change}
                        aria-describedby="packaging-shape-help"
                      >
                        {Object.entries(packagingShapes).map(([value, label]) => (
                          <option key={value} value={value}>
                            {label}
                          </option>
                        ))}
                      </CFormSelect>
                      <small id="packaging-shape-help" className="hm-muted">
                        Drawn in the Gift Studio and sets the space customers arrange in. Use the
                        description to say what it fits best.
                      </small>
                    </CCol>
                  )}
                  <CCol xs={12}>
                    <CFormLabel htmlFor="packaging-description">Short description</CFormLabel>
                    <CFormTextarea
                      id="packaging-description"
                      name="description"
                      rows={2}
                      maxLength={300}
                      placeholder="e.g. Best for jewelry, chocolates and cards"
                      value={form.description}
                      onChange={change}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="packaging-price">Price (€)</CFormLabel>
                    <CFormInput
                      id="packaging-price"
                      name="price"
                      required
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={change}
                    />
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="packaging-stock">Stock</CFormLabel>
                    {colored && opaque ? (
                      <p className="form-control-plaintext mb-0">
                        {availableStock(record)} <span className="hm-muted">· kept per colour</span>
                      </p>
                    ) : (
                      <CFormInput
                        id="packaging-stock"
                        name="stock"
                        type="number"
                        min="0"
                        step="1"
                        required
                        value={form.stock}
                        onChange={change}
                      />
                    )}
                  </CCol>
                  <CCol md={4}>
                    <CFormLabel htmlFor="packaging-sortOrder">Sort order</CFormLabel>
                    <CFormInput
                      id="packaging-sortOrder"
                      name="sortOrder"
                      type="number"
                      min="0"
                      step="1"
                      required
                      value={form.sortOrder}
                      onChange={change}
                    />
                  </CCol>
                  <CCol xs={12}>
                    <ImagePicker
                      id="packaging-image"
                      file={file}
                      onChange={setFile}
                      imageUrl={record?.imageUrl}
                      name={form.name}
                      hint="Shown on the packaging card in the Gift Studio"
                    />
                  </CCol>
                  <CCol xs={12}>
                    <CFormCheck
                      id="packaging-isActive"
                      name="isActive"
                      label="Active (offered in the Gift Studio)"
                      checked={form.isActive}
                      onChange={change}
                    />
                  </CCol>
                </CRow>
              </fieldset>
              {opaque &&
                (record ? (
                  <PackagingColorEditor
                    packagingId={record.id}
                    colors={record.colors || []}
                    onChanged={reload}
                    disabled={saving || record.type !== 'OPAQUE'}
                  />
                ) : (
                  <p className="hm-muted mt-4 mb-0">
                    Create the packaging first; you can add its colours right after.
                  </p>
                ))}
              {opaque && record && record.type !== 'OPAQUE' && (
                <p className="hm-muted small mt-2 mb-0">Save as Closed to add colours.</p>
              )}
              {record && (
                <p className="hm-muted small mt-3 mb-0">
                  Customers pay {formatPrice(record.price)}
                  {colored ? ' plus the chosen colour’s adjustment' : ''}.
                </p>
              )}
            </>
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
            {notice ? 'Done' : 'Cancel'}
          </CButton>
          <CButton
            color={action.mode === 'delete' ? 'danger' : 'primary'}
            type="submit"
            disabled={loading || !!loadError || saving}
          >
            {saving ? (
              <>
                <CSpinner size="sm" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : action.mode === 'delete' ? (
              'Delete packaging'
            ) : action.mode === 'create' ? (
              'Create packaging'
            ) : (
              'Save packaging'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
PackagingDialog.propTypes = {
  action: PropTypes.shape({
    mode: PropTypes.string.isRequired,
    id: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
  onChanged: PropTypes.func.isRequired,
}
export default PackagingDialog
