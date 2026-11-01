import PropTypes from 'prop-types'
import {
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'

const sizes = [
  ['widthMm', 'Print width'],
  ['heightMm', 'Print height'],
]
const margins = [
  ['top', 'Top'],
  ['right', 'Right'],
  ['bottom', 'Bottom'],
  ['left', 'Left'],
]

/** Whole millimetres, read from a form value; throws a readable Error. */
const wholeMm = (value, label, min) => {
  const text = String(value ?? '').trim()
  const mm = Number(text)
  if (!/^\d+$/.test(text) || mm < min || mm > 2000)
    throw new Error(`${label} must be whole millimetres from ${min} to 2000.`)
  return mm
}

export const emptyMugPrint = { widthMm: '', heightMm: '', top: '', right: '', bottom: '', left: '' }

/** The form fields of a mug product's print area, or empty ones. */
export const mugPrintForm = (front) => ({
  widthMm: front?.widthMm ? String(front.widthMm) : '',
  heightMm: front?.heightMm ? String(front.heightMm) : '',
  ...Object.fromEntries(
    margins.map(([key]) => [
      key,
      front?.safeMm?.[key] !== undefined ? String(front.safeMm[key]) : '',
    ]),
  ),
})

/**
 * The blank mug's print area: the whole artwork area in mm, with the safe margins that
 * important artwork stays inside. Validated here; the API checks it again.
 */
export const mugPrintPayload = (print) => {
  const widthMm = wholeMm(print.widthMm, 'Print width', 1)
  const heightMm = wholeMm(print.heightMm, 'Print height', 1)
  const safeMm = Object.fromEntries(
    margins.map(([key, label]) => [key, wholeMm(print[key] || '0', `${label} safe margin`, 0)]),
  )
  if (safeMm.left + safeMm.right >= widthMm || safeMm.top + safeMm.bottom >= heightMm)
    throw new Error('The safe margins must leave room inside the print area.')
  return { x: 0, y: 0, width: 1, height: 1, widthMm, heightMm, safeMm }
}

const MmInput = ({ id, label, value, onChange }) => (
  <>
    <CFormLabel htmlFor={id}>{label}</CFormLabel>
    <CInputGroup>
      <CFormInput
        id={id}
        type="number"
        inputMode="numeric"
        min="0"
        step="1"
        required
        value={value}
        onChange={(event) => onChange(event.target.value)}
      />
      <CInputGroupText>mm</CInputGroupText>
    </CInputGroup>
  </>
)
MmInput.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
}

/**
 * Mugs: one product is the blank white mug customers design in the Mug Studio. Its price
 * is the price of a custom mug and its stock the blank mugs available. Every other mug
 * product is ready-made.
 */
const MugPrintFields = ({ blank, print, onBlank, onChange }) => {
  const set = (key) => (value) => onChange({ ...print, [key]: value })
  return (
    <section className="mt-4" aria-label="Mug Studio">
      <h4>Mug Studio</h4>
      <CFormCheck
        id="mug-blank"
        label="This is the blank mug customers design in the Mug Studio"
        checked={blank}
        onChange={(event) => onBlank(event.target.checked)}
      />
      <p className="hm-muted small mt-2">
        {blank
          ? 'Its price is the price of one custom mug, its stock the blank mugs you have. Enter the real print area of your mug press and how far important artwork stays from its edges.'
          : 'A ready-made mug, sold as it is. Turn this on for the one blank mug customers design on.'}
      </p>
      {blank && (
        <CRow className="g-3">
          {sizes.map(([key, label]) => (
            <CCol xs={6} key={key}>
              <MmInput id={`mug-${key}`} label={label} value={print[key]} onChange={set(key)} />
            </CCol>
          ))}
          {margins.map(([key, label]) => (
            <CCol xs={6} md={3} key={key}>
              <MmInput
                id={`mug-safe-${key}`}
                label={`${label} safe margin`}
                value={print[key]}
                onChange={set(key)}
              />
            </CCol>
          ))}
        </CRow>
      )}
    </section>
  )
}
MugPrintFields.propTypes = {
  blank: PropTypes.bool.isRequired,
  print: PropTypes.object.isRequired,
  onBlank: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
}
export default MugPrintFields
