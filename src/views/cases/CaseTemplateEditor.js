import { useState } from 'react'
import PropTypes from 'prop-types'
import { CButton, CButtonGroup, CCol, CFormCheck, CFormInput, CFormLabel, CRow } from '@coreui/react'
import { MockupCanvas } from '../apparel/PrintAreaEditor'
import { clampArea } from '../apparel/apparelHelpers'
import { defaultCameraArea, radiusStyle } from './caseHelpers'

const percent = (value) => Math.round(Number(value) * 1000) / 10

/**
 * The printable area of a phone case model and its camera opening, drawn on the model's
 * own template (with its overlay on top). Both are stored as fractions of the template,
 * so the app reproduces them on any screen.
 */
const CaseTemplateEditor = ({
  src,
  overlaySrc,
  area,
  camera,
  cameraEnabled,
  onAreaChange,
  onCameraChange,
  onCameraEnabled,
}) => {
  const [editing, setEditing] = useState('area')
  const current = editing === 'camera' && cameraEnabled ? 'camera' : 'area'
  const value = current === 'camera' ? camera : area
  const change = current === 'camera' ? onCameraChange : onAreaChange
  const setPercent = (key) => (event) => {
    const number = Number(event.target.value)
    if (Number.isFinite(number)) change(clampArea({ ...value, [key]: number / 100 }))
  }
  const guides =
    current === 'area'
      ? cameraEnabled
        ? [{ key: 'camera', area: camera, label: 'Camera', style: radiusStyle(camera) }]
        : []
      : [{ key: 'area', area, style: radiusStyle(area) }]

  return (
    <section className="hm-print-editor" aria-labelledby="case-template-title">
      <div className="hm-print-editor-heading">
        <h4 id="case-template-title">Case template</h4>
        <CButtonGroup size="sm" role="group" aria-label="Area to edit">
          <CButton
            color="primary"
            variant={current === 'area' ? undefined : 'outline'}
            aria-pressed={current === 'area'}
            onClick={() => setEditing('area')}
          >
            Printable area
          </CButton>
          <CButton
            color="primary"
            variant={current === 'camera' ? undefined : 'outline'}
            aria-pressed={current === 'camera'}
            disabled={!cameraEnabled}
            onClick={() => setEditing('camera')}
          >
            Camera opening
          </CButton>
        </CButtonGroup>
      </div>
      <div className="hm-print-editor-body hm-case-mockup">
        {src ? (
          <MockupCanvas
            src={src}
            overlaySrc={overlaySrc}
            side={current === 'camera' ? 'camera' : 'printable'}
            area={value}
            areaStyle={radiusStyle(value)}
            guides={guides}
            onChange={change}
          />
        ) : (
          <p className="hm-muted small">Choose the template image to draw the areas on it.</p>
        )}
        <div>
          <CRow className="g-2">
            {[
              ['x', 'X'],
              ['y', 'Y'],
              ['width', 'Width'],
              ['height', 'Height'],
            ].map(([key, name]) => (
              <CCol xs={6} key={key}>
                <CFormLabel htmlFor={`case-${current}-${key}`}>{name} (%)</CFormLabel>
                <CFormInput
                  id={`case-${current}-${key}`}
                  type="number"
                  min="0"
                  max="100"
                  step="0.1"
                  value={percent(value[key])}
                  onChange={setPercent(key)}
                />
              </CCol>
            ))}
            <CCol xs={6}>
              <CFormLabel htmlFor={`case-${current}-radius`}>Corner radius (% of width)</CFormLabel>
              <CFormInput
                id={`case-${current}-radius`}
                type="number"
                min="0"
                max="50"
                step="0.5"
                value={percent(value.radius ?? 0)}
                onChange={(event) => {
                  const number = Number(event.target.value)
                  if (Number.isFinite(number))
                    change({ ...value, radius: Math.min(Math.max(number / 100, 0), 0.5) })
                }}
              />
            </CCol>
          </CRow>
          <CFormCheck
            className="mt-3"
            id="case-camera-enabled"
            label="This model has a camera opening"
            checked={cameraEnabled}
            onChange={(event) => {
              onCameraEnabled(event.target.checked)
              if (event.target.checked && !camera) onCameraChange(defaultCameraArea())
              if (!event.target.checked) setEditing('area')
            }}
          />
          <small className="hm-muted d-block mt-2">
            Artwork fills the printable area and is clipped to its rounded corners. Place the
            camera opening exactly over the camera of this template: there the template&apos;s own
            camera stays visible above the customer&apos;s image.
          </small>
        </div>
      </div>
    </section>
  )
}
CaseTemplateEditor.propTypes = {
  src: PropTypes.string,
  overlaySrc: PropTypes.string,
  area: PropTypes.object.isRequired,
  camera: PropTypes.object,
  cameraEnabled: PropTypes.bool.isRequired,
  onAreaChange: PropTypes.func.isRequired,
  onCameraChange: PropTypes.func.isRequired,
  onCameraEnabled: PropTypes.func.isRequired,
}
export default CaseTemplateEditor
