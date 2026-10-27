import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CCol,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import { sizeId } from './catalogFields'

const lengths = [
  ['minCm', 'Minimum'],
  ['maxCm', 'Maximum'],
  ['defaultCm', 'Default length'],
]

/**
 * Jewelry sizes as length ranges, typed in centimetres (stored in millimetres). Customers
 * pick a size, then an exact length within it; components fill it by their physical size.
 * `piece` words it for the jewelry type, e.g. "bracelet" or "necklace".
 */
const JewelrySizesEditor = ({ sizes, onChange, piece }) => {
  const Piece = piece.charAt(0).toUpperCase() + piece.slice(1)
  const change = (index, key, value) =>
    onChange(
      sizes.map((size, row) =>
        row === index
          ? { ...size, [key]: value, ...(key === 'name' ? { id: sizeId(value) } : {}) }
          : size,
      ),
    )
  return (
    <section className="mt-4" aria-label={`${Piece} sizes`}>
      <h3>{Piece} sizes</h3>
      <p className="hm-muted">
        Each size is a length range. Customers choose a size, then the exact length of their {piece}
        ; components fill it by their physical size.
      </p>
      {sizes.some((size) => size.converted) && (
        <CAlert color="warning">
          Some sizes still use the old format (component count). Their range was filled in from the
          old values: check it, set the default length, then save to convert them.
        </CAlert>
      )}
      {sizes.map((size, index) => {
        const min = Number(String(size.minCm).replace(',', '.'))
        const max = Number(String(size.maxCm).replace(',', '.'))
        return (
          <div className="border rounded p-3 mb-3" key={index}>
            <CRow className="g-3">
              <CCol xs={12}>
                <CFormLabel htmlFor={`jewelry-size-${index}-name`}>Size name</CFormLabel>
                <CFormInput
                  id={`jewelry-size-${index}-name`}
                  required
                  placeholder="e.g. Medium"
                  value={size.name}
                  onChange={(event) => change(index, 'name', event.target.value)}
                />
              </CCol>
              {lengths.map(([key, label]) => (
                <CCol xs={12} md={4} key={key}>
                  <CFormLabel htmlFor={`jewelry-size-${index}-${key}`}>{label}</CFormLabel>
                  <CInputGroup>
                    <CFormInput
                      id={`jewelry-size-${index}-${key}`}
                      aria-label={`Size ${index + 1} ${label} in centimetres`}
                      type="number"
                      inputMode="decimal"
                      min="0.1"
                      max="100"
                      step="0.5"
                      required
                      value={size[key]}
                      onChange={(event) => change(index, key, event.target.value)}
                    />
                    <CInputGroupText>cm</CInputGroupText>
                  </CInputGroup>
                </CCol>
              ))}
            </CRow>
            <small className="hm-muted d-block mt-2">
              {min > 0 && max > min
                ? `Customers can choose a ${piece} length between ${min} cm and ${max} cm.`
                : `Enter the shortest and longest ${piece} length for this size.`}
            </small>
            <CButton
              type="button"
              color="danger"
              variant="outline"
              size="sm"
              className="mt-3"
              aria-label={`Remove size ${index + 1}`}
              onClick={() => onChange(sizes.filter((_, row) => row !== index))}
            >
              Delete size
            </CButton>
          </div>
        )
      })}
      <CButton
        type="button"
        color="primary"
        variant="outline"
        onClick={() =>
          onChange([
            ...sizes,
            { id: '', name: '', minCm: '', maxCm: '', defaultCm: '', converted: false },
          ])
        }
      >
        + Add size
      </CButton>
    </section>
  )
}
JewelrySizesEditor.propTypes = {
  sizes: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  piece: PropTypes.string.isRequired,
}
export default JewelrySizesEditor
