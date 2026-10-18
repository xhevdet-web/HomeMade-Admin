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
import api, { apiErrorMessage } from '../../_helpers/api'
import ImagePicker from '../../components/ImagePicker'
import PrintAreaEditor from './PrintAreaEditor'
import VariantMatrix from './VariantMatrix'
import {
  emptyGarmentForm,
  garmentEndpoints,
  garmentForm,
  garmentFormData,
  garmentPayload,
  matrixFromVariants,
  silhouettes,
  variantsPayload,
} from './garmentHelpers'

const useObjectUrl = (file) => {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

const noFiles = { image: null, frontImage: null, backImage: null }

const GarmentDrawer = ({ categoryId, garmentId, onClose, onChanged, onSaved }) => {
  const [id, setId] = useState(garmentId)
  const [record, setRecord] = useState(null)
  const [form, setForm] = useState(emptyGarmentForm)
  const [matrix, setMatrix] = useState(() => matrixFromVariants([]))
  const [files, setFiles] = useState(noFiles)
  const [formDirty, setFormDirty] = useState(!garmentId)
  const [matrixDirty, setMatrixDirty] = useState(false)
  const [loading, setLoading] = useState(!!garmentId)
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [error, setError] = useState(null)
  const [variantError, setVariantError] = useState(null)
  const [saving, setSaving] = useState(false)
  const submitting = useRef(false)
  const frontPreview = useObjectUrl(files.frontImage)
  const backPreview = useObjectUrl(files.backImage)
  // Most garments share one mockup; a separate back image is optional.
  const [separateBack, setSeparateBack] = useState(false)
  const savedBack = !!record?.backImageUrl
  const frontSrc = frontPreview || record?.frontImageUrl
  const backSrc = backPreview || record?.backImageUrl || frontSrc

  useEffect(() => {
    if (!garmentId) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    api
      .get(garmentEndpoints.detail(garmentId), { signal: controller.signal })
      .then(({ data }) => {
        if (!data?.id) throw new Error('Invalid garment response')
        setRecord(data)
        setSeparateBack(!!data.backImageUrl)
        setForm(garmentForm(data))
        setMatrix(matrixFromVariants(data.variants))
      })
      .catch((requestError) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(requestError, 'Unable to load this garment. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [garmentId, attempt])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
    setFormDirty(true)
  }
  const setField = (name) => (value) => {
    setForm((previous) => ({ ...previous, [name]: value }))
    setFormDirty(true)
  }
  const setFile = (name) => (file) => {
    setFiles((previous) => ({ ...previous, [name]: file }))
    setFormDirty(true)
  }
  const dirty = formDirty || matrixDirty || Object.values(files).some(Boolean)
  const requestClose = () => {
    if (saving) return
    if (dirty && !window.confirm('Discard unsaved garment changes?')) return
    onClose()
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current) return
    setError(null)
    setVariantError(null)
    let fields
    let rows
    try {
      fields = garmentPayload(form)
    } catch (validationError) {
      setError(validationError.message)
      return
    }
    try {
      rows = matrixDirty ? variantsPayload(matrix) : null
    } catch (validationError) {
      setVariantError(validationError.message)
      return
    }
    submitting.current = true
    setSaving(true)
    const creating = !id
    let saved = record
    try {
      const hasFiles = Object.values(files).some(Boolean)
      const options = { timeout: hasFiles ? 120000 : 15000 }
      if (creating) {
        saved = (await api.post(garmentEndpoints.create, garmentFormData(fields, files, categoryId), options)).data
      } else if (formDirty || hasFiles) {
        if (hasFiles) {
          saved = (await api.patch(garmentEndpoints.detail(id), garmentFormData(fields, files), options)).data
          // Multipart cannot send null, so a cleared description is cleared separately.
          if (fields.description === null && saved.description)
            saved = (await api.patch(garmentEndpoints.detail(id), { description: null })).data
        } else saved = (await api.patch(garmentEndpoints.detail(id), fields)).data
      }
      setId(saved.id)
      setRecord(saved)
      setFiles(noFiles)
      setFormDirty(false)
      onChanged(saved)
    } catch (requestError) {
      setError(apiErrorMessage(requestError, 'Unable to save the garment. Please try again.'))
      submitting.current = false
      setSaving(false)
      return
    }
    try {
      if (rows) {
        saved = (await api.put(garmentEndpoints.variants(saved.id), { variants: rows })).data
        setRecord(saved)
        setMatrix(matrixFromVariants(saved.variants))
        setMatrixDirty(false)
        onChanged(saved)
      }
      onSaved(saved, `${saved.name} ${creating ? 'created' : 'updated'}.`)
    } catch (requestError) {
      // The garment itself is saved; keep the drawer open on the matrix error.
      setVariantError(
        `${creating ? 'Garment created, but the' : 'Details saved, but the'} variants were not saved: ${apiErrorMessage(requestError)}`,
      )
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  const title = id ? `Edit ${record?.name || 'garment'}` : 'New garment'
  return (
    <CModal
      visible
      className="hm-order-panel hm-catalog-modal hm-garment-drawer"
      backdrop="static"
      keyboard={!saving}
      onClose={requestClose}
      aria-labelledby="garment-drawer-title"
      scrollable
    >
      <CModalHeader closeButton={!saving}>
        <div>
          <span className="hm-eyebrow">GARMENT</span>
          <CModalTitle id="garment-drawer-title">{title}</CModalTitle>
        </div>
      </CModalHeader>
      <CForm onSubmit={submit} className="d-contents">
        <CModalBody>
          {loading ? (
            <div className="hm-empty" role="status">
              <CSpinner aria-hidden="true" />
              <p>Loading garment...</p>
            </div>
          ) : loadError ? (
            <CAlert color="danger" role="alert">
              {loadError}{' '}
              <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </CButton>
            </CAlert>
          ) : (
            <fieldset disabled={saving}>
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              <section className="hm-order-section">
                <h3>Details</h3>
                <CRow className="g-3">
                  <CCol xs={12} md={6}>
                    <CFormLabel htmlFor="garment-name">Name</CFormLabel>
                    <CFormInput id="garment-name" name="name" required maxLength={200} value={form.name} onChange={change} />
                  </CCol>
                  <CCol xs={6} md={3}>
                    <CFormLabel htmlFor="garment-basePrice">Base price (€)</CFormLabel>
                    <CFormInput
                      id="garment-basePrice"
                      name="basePrice"
                      inputMode="decimal"
                      required
                      placeholder="35.00"
                      value={form.basePrice}
                      onChange={change}
                    />
                  </CCol>
                  <CCol xs={6} md={3}>
                    <CFormLabel htmlFor="garment-sortOrder">Sort order</CFormLabel>
                    <CFormInput id="garment-sortOrder" name="sortOrder" type="number" min="0" step="1" required value={form.sortOrder} onChange={change} />
                  </CCol>
                  <CCol xs={12}>
                    <CFormLabel htmlFor="garment-description">Description</CFormLabel>
                    <CFormTextarea id="garment-description" name="description" rows={2} maxLength={5000} value={form.description} onChange={change} />
                  </CCol>
                  <CCol xs={12} md={6}>
                    <CFormLabel htmlFor="garment-silhouette">Silhouette</CFormLabel>
                    <CFormSelect id="garment-silhouette" name="silhouette" value={form.silhouette} onChange={change} aria-describedby="garment-silhouette-help">
                      <option value="">None</option>
                      {Object.entries(silhouettes).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </CFormSelect>
                    <small id="garment-silhouette-help" className="hm-muted">
                      Drawn in the app until mockups are uploaded.
                    </small>
                  </CCol>
                  <CCol xs={12} md={6} className="d-flex align-items-center">
                    <CFormCheck id="garment-isActive" name="isActive" label="Active (customers can choose it)" checked={form.isActive} onChange={change} />
                  </CCol>
                </CRow>
              </section>
              <section className="hm-order-section">
                <h3>Images</h3>
                <p className="hm-muted">
                  Use a transparent PNG mockup. The back reuses the front mockup unless you add
                  a separate one.
                </p>
                <CRow className="g-3">
                  <CCol xs={12} lg={separateBack ? 4 : 6}>
                    <ImagePicker id="garment-image" label="Product photo" file={files.image} onChange={setFile('image')} imageUrl={record?.imageUrl} name={`${form.name || 'Garment'} photo`} />
                  </CCol>
                  <CCol xs={12} lg={separateBack ? 4 : 6}>
                    <ImagePicker id="garment-frontImage" label="Front mockup" hint="Transparent PNG" file={files.frontImage} onChange={setFile('frontImage')} imageUrl={record?.frontImageUrl} name={`${form.name || 'Garment'} front mockup`} />
                  </CCol>
                  {separateBack && (
                    <CCol xs={12} lg={4}>
                      <ImagePicker id="garment-backImage" label="Back mockup" hint="Same size and framing as the front" file={files.backImage} onChange={setFile('backImage')} imageUrl={record?.backImageUrl} name={`${form.name || 'Garment'} back mockup`} />
                    </CCol>
                  )}
                </CRow>
                <CFormCheck
                  className="mt-3"
                  id="garment-separateBack"
                  label="Use a different back mockup"
                  checked={separateBack}
                  // A saved back mockup cannot be removed through the API, so it stays shown.
                  disabled={savedBack}
                  onChange={(event) => {
                    setSeparateBack(event.target.checked)
                    if (!event.target.checked) setFile('backImage')(null)
                  }}
                />
                {savedBack && (
                  <small className="hm-muted">This garment already has its own back mockup.</small>
                )}
              </section>
              <section className="hm-order-section">
                <h3>Print areas</h3>
                <p className="hm-muted">
                  Drag the rectangle to move it and its corners to resize it. It is stored as a
                  fraction of the mockup and cannot leave the image.
                </p>
                <PrintAreaEditor
                  side="front"
                  label="Front"
                  src={frontSrc}
                  silhouette={form.silhouette}
                  enabled={form.frontEnabled}
                  area={form.frontPrintArea}
                  onEnabled={setField('frontEnabled')}
                  onChange={setField('frontPrintArea')}
                />
                <PrintAreaEditor
                  side="back"
                  label="Back"
                  src={backSrc}
                  silhouette={form.silhouette}
                  enabled={form.backEnabled}
                  area={form.backPrintArea}
                  onEnabled={setField('backEnabled')}
                  onChange={setField('backPrintArea')}
                />
              </section>
              <VariantMatrix
                matrix={matrix}
                garmentName={form.name}
                error={variantError}
                onChange={(next) => {
                  setMatrix(next)
                  setMatrixDirty(true)
                }}
              />
            </fieldset>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton color="secondary" variant="outline" type="button" disabled={saving} onClick={requestClose}>
            Cancel
          </CButton>
          <CButton color="primary" type="submit" disabled={loading || !!loadError || saving}>
            {saving ? (
              <>
                <CSpinner size="sm" aria-hidden="true" className="me-2" />
                Saving...
              </>
            ) : (
              'Save garment'
            )}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
GarmentDrawer.propTypes = {
  categoryId: PropTypes.string.isRequired,
  garmentId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onChanged: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
export default GarmentDrawer
