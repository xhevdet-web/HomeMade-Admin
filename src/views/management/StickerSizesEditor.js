import PropTypes from 'prop-types'
import {
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import { equalSides, MAX_STICKER_CM, stickerShapes } from './stickerSizes'

/**
 * The sticker sizes customers can order, each in one shape with its price per printed
 * sticker. Typed in centimetres (stored in millimetres); nothing larger than 7 × 7 cm.
 */
const StickerSizesEditor = ({ sizes, onChange }) => {
  const change = (index, key, value) =>
    onChange(sizes.map((size, row) => (row === index ? { ...size, [key]: value } : size)))
  const centimetres = (index, key, label, value) => (
    <CCol xs={6} md={3} key={key}>
      <CFormLabel htmlFor={`sticker-size-${index}-${key}`}>{label}</CFormLabel>
      <CInputGroup>
        <CFormInput
          id={`sticker-size-${index}-${key}`}
          aria-label={`Sticker size ${index + 1} ${label} in centimetres`}
          type="number"
          inputMode="decimal"
          min="0.1"
          max={MAX_STICKER_CM}
          step="0.5"
          required
          value={value}
          onChange={(event) => change(index, key, event.target.value)}
        />
        <CInputGroupText>cm</CInputGroupText>
      </CInputGroup>
    </CCol>
  )
  return (
    <section className="mt-4" aria-label="Sticker sizes">
      <h3>Sticker sizes</h3>
      <p className="hm-muted">
        The shapes and sizes customers can order, up to {MAX_STICKER_CM} × {MAX_STICKER_CM} cm, with
        the price of one printed sticker. Shapes without a size are not offered.
      </p>
      {sizes.map((size, index) => (
        <div className="border rounded p-3 mb-3" key={index}>
          <CRow className="g-3">
            <CCol xs={12} md={3}>
              <CFormLabel htmlFor={`sticker-size-${index}-shape`}>Shape</CFormLabel>
              <CFormSelect
                id={`sticker-size-${index}-shape`}
                value={size.shape}
                onChange={(event) => change(index, 'shape', event.target.value)}
              >
                {Object.entries(stickerShapes).map(([value, label]) => (
                  <option value={value} key={value}>
                    {label}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
            {centimetres(
              index,
              'widthCm',
              size.shape === 'CIRCLE' ? 'Diameter' : 'Width',
              size.widthCm,
            )}
            {!equalSides(size.shape) && centimetres(index, 'heightCm', 'Height', size.heightCm)}
            <CCol xs={12} md={3}>
              <CFormLabel htmlFor={`sticker-size-${index}-price`}>Price per sticker</CFormLabel>
              <CInputGroup>
                <CInputGroupText>€</CInputGroupText>
                <CFormInput
                  id={`sticker-size-${index}-price`}
                  inputMode="decimal"
                  required
                  placeholder="e.g. 1.20"
                  value={size.price}
                  onChange={(event) => change(index, 'price', event.target.value)}
                />
              </CInputGroup>
            </CCol>
            <CCol xs={12}>
              <CFormLabel htmlFor={`sticker-size-${index}-name`}>Name (optional)</CFormLabel>
              <CFormInput
                id={`sticker-size-${index}-name`}
                placeholder="Shown as the size when empty, e.g. 5 × 5 cm"
                value={size.name}
                onChange={(event) => change(index, 'name', event.target.value)}
              />
            </CCol>
          </CRow>
          <CButton
            type="button"
            color="danger"
            variant="outline"
            size="sm"
            className="mt-3"
            aria-label={`Remove sticker size ${index + 1}`}
            onClick={() => onChange(sizes.filter((_, row) => row !== index))}
          >
            Delete size
          </CButton>
        </div>
      ))}
      <CButton
        type="button"
        color="primary"
        variant="outline"
        onClick={() =>
          onChange([
            ...sizes,
            {
              id: '',
              name: '',
              shape: 'SQUARE',
              widthCm: '',
              heightCm: '',
              price: '',
            },
          ])
        }
      >
        + Add size
      </CButton>
    </section>
  )
}
StickerSizesEditor.propTypes = {
  sizes: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
}
export default StickerSizesEditor
