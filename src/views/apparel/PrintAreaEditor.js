import { useRef } from 'react'
import PropTypes from 'prop-types'
import { CCol, CFormCheck, CFormInput, CFormLabel, CRow } from '@coreui/react'
import GarmentSilhouette from './GarmentSilhouette'
import { clampArea, defaultPrintArea } from './apparelHelpers'

const handles = ['nw', 'ne', 'sw', 'se']
const percent = (value) => Math.round(Number(value) * 1000) / 10

/** Mockup with a draggable, resizable print rectangle stored as fractions of the image. */
export const MockupCanvas = ({ src, silhouette, side, area, onChange, children }) => {
  const frame = useRef(null)
  const drag = useRef(null)
  const start = (mode) => (event) => {
    if (!onChange) return
    event.preventDefault()
    event.stopPropagation()
    event.currentTarget.setPointerCapture?.(event.pointerId)
    drag.current = { mode, x: event.clientX, y: event.clientY, area }
  }
  const move = (event) => {
    if (!drag.current || !frame.current) return
    const box = frame.current.getBoundingClientRect()
    const dx = (event.clientX - drag.current.x) / box.width
    const dy = (event.clientY - drag.current.y) / box.height
    const { mode, area: from } = drag.current
    if (mode === 'move') {
      onChange(clampArea({ ...from, x: from.x + dx, y: from.y + dy }))
      return
    }
    // Resize from a corner while the opposite corner stays put, never leaving the image.
    let left = from.x
    let top = from.y
    let right = from.x + from.width
    let bottom = from.y + from.height
    if (mode.includes('w')) left = Math.min(Math.max(left + dx, 0), right - 0.02)
    if (mode.includes('e')) right = Math.max(Math.min(right + dx, 1), left + 0.02)
    if (mode.includes('n')) top = Math.min(Math.max(top + dy, 0), bottom - 0.02)
    if (mode.includes('s')) bottom = Math.max(Math.min(bottom + dy, 1), top + 0.02)
    onChange(clampArea({ ...from, x: left, y: top, width: right - left, height: bottom - top }))
  }
  const end = () => {
    drag.current = null
  }
  const key = (event) => {
    const step = event.altKey ? 0.001 : 0.01
    const delta = {
      ArrowLeft: [-step, 0],
      ArrowRight: [step, 0],
      ArrowUp: [0, -step],
      ArrowDown: [0, step],
    }[event.key]
    if (!delta || !onChange) return
    event.preventDefault()
    onChange(
      clampArea(
        event.shiftKey
          ? { ...area, width: area.width + delta[0], height: area.height + delta[1] }
          : { ...area, x: area.x + delta[0], y: area.y + delta[1] },
      ),
    )
  }
  return (
    <div
      className="hm-mockup"
      ref={frame}
      onPointerMove={move}
      onPointerUp={end}
      onPointerCancel={end}
    >
      {src ? (
        <img src={src} alt={`${side} mockup`} referrerPolicy="no-referrer" draggable={false} />
      ) : (
        <GarmentSilhouette silhouette={silhouette} side={side} />
      )}
      {area && (
        <div
          className={`hm-print-area${onChange ? ' is-editable' : ''}`}
          style={{
            left: `${area.x * 100}%`,
            top: `${area.y * 100}%`,
            width: `${area.width * 100}%`,
            height: `${area.height * 100}%`,
          }}
          {...(onChange
            ? {
                role: 'slider',
                tabIndex: 0,
                'aria-label': `${side} print area. Arrow keys move it, Shift with arrow keys resizes it.`,
                'aria-valuetext': `x ${percent(area.x)}%, y ${percent(area.y)}%, width ${percent(area.width)}%, height ${percent(area.height)}%`,
                onPointerDown: start('move'),
                onKeyDown: key,
              }
            : {})}
        >
          {children}
          {onChange &&
            handles.map((handle) => (
              <span
                key={handle}
                className={`hm-print-handle hm-print-handle-${handle}`}
                aria-hidden="true"
                onPointerDown={start(handle)}
              />
            ))}
        </div>
      )}
    </div>
  )
}
MockupCanvas.propTypes = {
  src: PropTypes.string,
  silhouette: PropTypes.string,
  side: PropTypes.string.isRequired,
  area: PropTypes.object,
  onChange: PropTypes.func,
  children: PropTypes.node,
}

const PrintAreaEditor = ({ side, label, src, silhouette, enabled, area, onEnabled, onChange }) => {
  const id = `print-${side}`
  const setPercent = (key) => (event) => {
    const value = Number(event.target.value)
    if (!Number.isFinite(value)) return
    onChange(clampArea({ ...area, [key]: value / 100 }))
  }
  return (
    <section className="hm-print-editor" aria-labelledby={`${id}-title`}>
      <div className="hm-print-editor-heading">
        <h4 id={`${id}-title`}>{label} print area</h4>
        <CFormCheck
          id={`${id}-enabled`}
          label={`Define ${label.toLowerCase()} print area`}
          checked={enabled}
          onChange={(event) => {
            onEnabled(event.target.checked)
            if (event.target.checked && !area) onChange(defaultPrintArea(side))
          }}
        />
      </div>
      {enabled ? (
        <div className="hm-print-editor-body">
          <MockupCanvas
            src={src}
            silhouette={silhouette}
            side={side}
            area={area}
            onChange={onChange}
          />
          <div>
            {!src && (
              <p className="hm-muted small">
                No {side} mockup yet. Showing the drawn silhouette with its default area.
              </p>
            )}
            <CRow className="g-2">
              {[
                ['x', 'X'],
                ['y', 'Y'],
                ['width', 'Width'],
                ['height', 'Height'],
              ].map(([key, name]) => (
                <CCol xs={6} key={key}>
                  <CFormLabel htmlFor={`${id}-${key}`}>{name} (%)</CFormLabel>
                  <CFormInput
                    id={`${id}-${key}`}
                    type="number"
                    min="0"
                    max="100"
                    step="0.1"
                    value={percent(area[key])}
                    onChange={setPercent(key)}
                  />
                </CCol>
              ))}
              {[
                ['widthCm', 'Real width (cm)'],
                ['heightCm', 'Real height (cm)'],
              ].map(([key, name]) => (
                <CCol xs={6} key={key}>
                  <CFormLabel htmlFor={`${id}-${key}`}>{name}</CFormLabel>
                  <CFormInput
                    id={`${id}-${key}`}
                    type="number"
                    min="0.1"
                    max="200"
                    step="0.1"
                    value={area[key] ?? ''}
                    onChange={(event) => onChange({ ...area, [key]: event.target.value })}
                  />
                </CCol>
              ))}
            </CRow>
            <small className="hm-muted d-block mt-2">
              The real size converts customer placements to centimetres on the production sheet.
            </small>
          </div>
        </div>
      ) : (
        <p className="hm-muted small mb-0">
          No {side} print area saved. Saving clears any earlier {side} area.
        </p>
      )}
    </section>
  )
}
PrintAreaEditor.propTypes = {
  side: PropTypes.oneOf(['front', 'back']).isRequired,
  label: PropTypes.string.isRequired,
  src: PropTypes.string,
  silhouette: PropTypes.string,
  enabled: PropTypes.bool.isRequired,
  area: PropTypes.object,
  onEnabled: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
}
export default PrintAreaEditor
