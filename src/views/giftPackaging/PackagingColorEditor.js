import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CRow,
  CSpinner,
} from '@coreui/react'
import { apiErrorMessage } from '../../_helpers/api'
import ImagePicker from '../../components/ImagePicker'
import ProductImage from '../products/ProductImage'
import { formatPrice } from '../products/productHelpers'
import { addPackagingColor, deletePackagingColor, updatePackagingColor } from './giftPackagingApi'
import { colorForm, colorPayload } from './packagingHelpers'

/**
 * Colours of closed packaging, each with its own stock. Every change is saved right away,
 * so the list always shows what customers see.
 */
const PackagingColorEditor = ({ packagingId, colors, onChanged, disabled = false }) => {
  // null: no form open; 'new': adding; otherwise the id of the colour being edited.
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(colorForm())
  const [file, setFile] = useState(null)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  const open = (color) => {
    setEditing(color ? color.id : 'new')
    setForm(colorForm(color))
    setFile(null)
    setError(null)
  }
  const setField = (name) => (event) => {
    const { value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  const run = async (operation) => {
    setBusy(true)
    setError(null)
    try {
      await operation()
      await onChanged()
      return true
    } catch (failure) {
      setError(
        failure instanceof Error && !failure.response ? failure.message : apiErrorMessage(failure),
      )
      return false
    } finally {
      setBusy(false)
    }
  }
  const save = async () => {
    const saved = await run(async () => {
      const fields = colorPayload(form)
      if (editing === 'new') await addPackagingColor(packagingId, fields, file)
      else await updatePackagingColor(packagingId, editing, fields, file)
    })
    if (saved) setEditing(null)
  }
  const remove = (color) => {
    if (
      !window.confirm(`Remove ${color.name}? Colours used by saved gifts can only be deactivated.`)
    )
      return
    void run(() => deletePackagingColor(packagingId, color.id))
  }
  const current = colors.find((color) => color.id === editing)

  return (
    <section className="mt-4" aria-labelledby="packaging-colors-title">
      <div className="d-flex align-items-center justify-content-between mb-2">
        <h3 id="packaging-colors-title" className="h6 mb-0">
          Colours
        </h3>
        {editing === null && (
          <CButton
            type="button"
            color="primary"
            variant="outline"
            size="sm"
            disabled={disabled || busy}
            onClick={() => open(null)}
          >
            + Add colour
          </CButton>
        )}
      </div>
      <p className="hm-muted small">
        Customers choose one of these. Each colour keeps its own stock; inactive colours are hidden
        from new gifts.
      </p>
      {error && (
        <CAlert color="danger" role="alert">
          {error}
        </CAlert>
      )}
      {colors.length === 0 && editing === null && (
        <p className="hm-muted mb-0">No colours yet. Add the colours this packaging comes in.</p>
      )}
      <ul className="list-unstyled mb-0">
        {colors.map((color) => (
          <li
            key={color.id}
            className="d-flex align-items-center gap-3 py-2 border-bottom"
            style={{ opacity: color.isActive ? 1 : 0.6 }}
          >
            <span
              className="hm-swatch m-0"
              style={{ backgroundColor: color.hex, width: 28, height: 28 }}
              aria-hidden="true"
            />
            <div className="flex-grow-1">
              <strong>{color.name}</strong>{' '}
              <span className="hm-muted small">
                {color.hex} · Stock: {color.stock}
                {color.priceAdjustment ? ` · +${formatPrice(color.priceAdjustment)}` : ''}
                {color.isActive ? '' : ' · Inactive'}
              </span>
            </div>
            {color.imageUrl && <ProductImage src={color.imageUrl} name={color.name} transparent />}
            <CButton
              type="button"
              color="primary"
              variant="outline"
              size="sm"
              disabled={disabled || busy || editing !== null}
              onClick={() => open(color)}
              aria-label={`Edit ${color.name}`}
            >
              Edit
            </CButton>
            <CButton
              type="button"
              color="danger"
              variant="outline"
              size="sm"
              disabled={disabled || busy || editing !== null}
              onClick={() => remove(color)}
              aria-label={`Remove ${color.name}`}
            >
              Remove
            </CButton>
          </li>
        ))}
      </ul>
      {editing !== null && (
        <fieldset
          className="hm-panel p-3 mt-3"
          disabled={busy}
          // Enter saves this colour instead of submitting the packaging form around it.
          onKeyDown={(event) => {
            if (event.key === 'Enter' && event.target.tagName === 'INPUT') {
              event.preventDefault()
              void save()
            }
          }}
        >
          <legend className="h6">
            {editing === 'new' ? 'New colour' : `Edit ${current?.name}`}
          </legend>
          <CRow className="g-3">
            <CCol md={6}>
              <CFormLabel htmlFor="color-name">Name</CFormLabel>
              <CFormInput
                id="color-name"
                maxLength={60}
                placeholder="e.g. Pink"
                value={form.name}
                onChange={setField('name')}
              />
            </CCol>
            <CCol md={6}>
              <CFormLabel htmlFor="color-hex">Hex colour</CFormLabel>
              <div className="d-flex gap-2">
                <CFormInput
                  type="color"
                  aria-label="Pick colour"
                  className="form-control-color"
                  value={/^#[0-9a-f]{6}$/i.test(form.hex) ? form.hex : '#000000'}
                  onChange={setField('hex')}
                />
                <CFormInput
                  id="color-hex"
                  maxLength={7}
                  placeholder="#E8B4BC"
                  value={form.hex}
                  onChange={setField('hex')}
                />
              </div>
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="color-price">Price adjustment (€)</CFormLabel>
              <CFormInput
                id="color-price"
                type="number"
                min="0"
                step="0.01"
                value={form.priceAdjustment}
                onChange={setField('priceAdjustment')}
              />
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="color-stock">Stock</CFormLabel>
              <CFormInput
                id="color-stock"
                type="number"
                min="0"
                step="1"
                value={form.stock}
                onChange={setField('stock')}
              />
            </CCol>
            <CCol md={4}>
              <CFormLabel htmlFor="color-sort">Sort order</CFormLabel>
              <CFormInput
                id="color-sort"
                type="number"
                min="0"
                step="1"
                value={form.sortOrder}
                onChange={setField('sortOrder')}
              />
            </CCol>
            <CCol xs={12}>
              <ImagePicker
                id="color-image"
                file={file}
                onChange={setFile}
                imageUrl={current?.imageUrl}
                name={form.name}
                hint="Optional photo of the packaging in this colour"
              />
            </CCol>
            <CCol xs={12}>
              <CFormCheck
                id="color-active"
                label="Active"
                checked={form.isActive}
                onChange={setField('isActive')}
              />
            </CCol>
            <CCol xs={12} className="d-flex gap-2 justify-content-end">
              <CButton
                type="button"
                color="secondary"
                variant="outline"
                onClick={() => {
                  setEditing(null)
                  setError(null)
                }}
              >
                Cancel
              </CButton>
              <CButton type="button" color="primary" onClick={() => void save()}>
                {busy && <CSpinner size="sm" aria-hidden="true" className="me-2" />}
                Save colour
              </CButton>
            </CCol>
          </CRow>
        </fieldset>
      )}
    </section>
  )
}
PackagingColorEditor.propTypes = {
  packagingId: PropTypes.string.isRequired,
  colors: PropTypes.array.isRequired,
  onChanged: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
}
export default PackagingColorEditor
