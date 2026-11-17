import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CButton,
  CButtonGroup,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CRow,
} from '@coreui/react'
import { MockupCanvas } from '../apparel/PrintAreaEditor'
import { clampArea } from '../apparel/apparelHelpers'
import { CORNERS, SIDES, defaultCameraArea, defaultSafeInsets, useImageRatio } from './caseHelpers'
import { MAX_BLEED, MAX_SAFE_INSET, parseCaseTemplate } from './caseGeometry'
import { CaseGuides, CaseLegend, CaseTestArtwork } from './CaseTemplateLayers'

const percent = (value) => Math.round(Number(value ?? 0) * 1000) / 10
const fromPercent = (event, max) => {
  const number = Number(event.target.value)
  return Number.isFinite(number) ? Math.min(Math.max(number / 100, 0), max) : null
}
/** Used until the template image has loaded; most phone templates are about this shape. */
const FALLBACK_RATIO = 0.49

const PercentField = ({ id, label, value, max = 100, step = '0.1', onChange, help }) => (
  <>
    <CFormLabel htmlFor={id}>{label}</CFormLabel>
    <CFormInput
      id={id}
      type="number"
      min="0"
      max={max}
      step={step}
      value={percent(value)}
      onChange={onChange}
      aria-describedby={help ? `${id}-help` : undefined}
    />
    {help && (
      <small id={`${id}-help`} className="hm-muted d-block mt-1">
        {help}
      </small>
    )}
  </>
)
PercentField.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.string.isRequired,
  value: PropTypes.number,
  max: PropTypes.number,
  step: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  help: PropTypes.string,
}

/** X / Y / width / height of an area, as percentages of the template. */
const BoxFields = ({ prefix, value, onChange }) => {
  const set = (key) => (event) => {
    const number = Number(event.target.value)
    if (Number.isFinite(number)) onChange(clampArea({ ...value, [key]: number / 100 }))
  }
  return (
    <>
      <fieldset className="hm-case-fieldset">
        <legend>Position</legend>
        <CRow className="g-2">
          {[
            ['x', 'X (%)'],
            ['y', 'Y (%)'],
          ].map(([key, name]) => (
            <CCol xs={6} key={key}>
              <PercentField
                id={`${prefix}-${key}`}
                label={name}
                value={value[key]}
                onChange={set(key)}
              />
            </CCol>
          ))}
        </CRow>
      </fieldset>
      <fieldset className="hm-case-fieldset">
        <legend>Size</legend>
        <CRow className="g-2">
          {[
            ['width', 'Width (%)'],
            ['height', 'Height (%)'],
          ].map(([key, name]) => (
            <CCol xs={6} key={key}>
              <PercentField
                id={`${prefix}-${key}`}
                label={name}
                value={value[key]}
                onChange={set(key)}
              />
            </CCol>
          ))}
        </CRow>
      </fieldset>
    </>
  )
}
BoxFields.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
}

/** One radius for all corners, or (Advanced corners) one per corner; % of the area's width. */
const CornerFields = ({ prefix, value, onChange, help }) => {
  const advanced = !!value.radii
  return (
    <fieldset className="hm-case-fieldset">
      <legend>Corners</legend>
      <CFormCheck
        id={`${prefix}-same-corners`}
        label="Same radius for all corners"
        checked={!advanced}
        onChange={(event) => {
          if (event.target.checked) {
            const { radii, ...rest } = value
            onChange({ ...rest, radius: radii?.tl ?? value.radius ?? 0 })
          } else {
            const r = Number(value.radius) || 0
            onChange({ ...value, radii: { tl: r, tr: r, br: r, bl: r } })
          }
        }}
      />
      {advanced ? (
        <CRow className="g-2 mt-1">
          {CORNERS.map(([key, name]) => (
            <CCol xs={6} key={key}>
              <PercentField
                id={`${prefix}-radius-${key}`}
                label={`${name} (%)`}
                max={50}
                step="0.5"
                value={value.radii[key]}
                onChange={(event) => {
                  const number = fromPercent(event, 0.5)
                  if (number !== null)
                    onChange({ ...value, radii: { ...value.radii, [key]: number } })
                }}
              />
            </CCol>
          ))}
        </CRow>
      ) : (
        <div className="mt-1">
          <PercentField
            id={`${prefix}-radius`}
            label="Corner radius (% of width)"
            max={50}
            step="0.5"
            value={value.radius}
            onChange={(event) => {
              const number = fromPercent(event, 0.5)
              if (number !== null) onChange({ ...value, radius: number })
            }}
          />
        </div>
      )}
      <small className="hm-muted d-block mt-1">{help}</small>
    </fieldset>
  )
}
CornerFields.propTypes = {
  prefix: PropTypes.string.isRequired,
  value: PropTypes.object.isRequired,
  onChange: PropTypes.func.isRequired,
  help: PropTypes.string.isRequired,
}

const TABS = [
  ['area', 'Printable area'],
  ['camera', 'Camera opening'],
  ['safe', 'Safe area'],
]

/**
 * The template of a phone case model, drawn on its own template image (with its overlay):
 * the printable area (with corners and bleed), the camera opening and the safe area. Drag or
 * resize the outline on the preview, or type the numbers; both stay in sync. Everything is
 * stored as fractions of the template, so the studio reproduces it on any screen, using the
 * same geometry (caseGeometry.js). "Test artwork" previews a pattern clipped like customer
 * artwork; it is never saved.
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
  const [testArtwork, setTestArtwork] = useState(false)
  const ratio = useImageRatio(src) ?? FALLBACK_RATIO
  const template = parseCaseTemplate(
    { front: area, ...(cameraEnabled && camera ? { camera } : {}) },
    area,
  )
  const editable =
    editing === 'camera' ? (cameraEnabled ? camera : null) : editing === 'area' ? area : null
  const change = editing === 'camera' ? onCameraChange : onAreaChange
  // Per-side safe insets once chosen, or when the saved ones differ.
  const [safeSides, setSafeSides] = useState(
    () => !!area.safe && SIDES.some(([key]) => area.safe[key] !== area.safe.top),
  )

  return (
    <section className="hm-print-editor" aria-labelledby="case-template-title">
      <div className="hm-print-editor-heading">
        <h4 id="case-template-title">Case template</h4>
        <CButtonGroup size="sm" role="group" aria-label="Part of the template to edit">
          {TABS.map(([key, label]) => (
            <CButton
              key={key}
              color="primary"
              variant={editing === key ? undefined : 'outline'}
              aria-pressed={editing === key}
              onClick={() => setEditing(key)}
            >
              {label}
            </CButton>
          ))}
        </CButtonGroup>
      </div>
      <div className="hm-print-editor-body hm-case-mockup">
        <div className="hm-case-preview">
          {src ? (
            <>
              <MockupCanvas
                src={src}
                overlaySrc={overlaySrc}
                side={editing === 'camera' ? 'camera' : 'printable'}
                area={editable ?? area}
                areaClassName="is-ghost"
                onChange={editable ? change : undefined}
                underlay={
                  testArtwork ? <CaseTestArtwork template={template} ratio={ratio} /> : null
                }
                overlay={<CaseGuides template={template} ratio={ratio} editing={editing} />}
              />
              <CButtonGroup size="sm" role="group" aria-label="Preview" className="mt-2">
                {[
                  [false, 'Template'],
                  [true, 'Test artwork'],
                ].map(([on, label]) => (
                  <CButton
                    key={label}
                    color="secondary"
                    variant={testArtwork === on ? undefined : 'outline'}
                    aria-pressed={testArtwork === on}
                    onClick={() => setTestArtwork(on)}
                  >
                    {label}
                  </CButton>
                ))}
              </CButtonGroup>
              <CaseLegend template={template} />
            </>
          ) : (
            <p className="hm-muted small">Choose the template image to draw the areas on it.</p>
          )}
        </div>
        <div>
          {editing === 'area' && (
            <>
              <BoxFields prefix="case-area" value={area} onChange={onAreaChange} />
              <CornerFields
                prefix="case-area"
                value={area}
                onChange={onAreaChange}
                help="Controls the curvature of the printable case boundary. Use advanced corners when the top and bottom curve differently."
              />
              <fieldset className="hm-case-fieldset">
                <legend>Print settings</legend>
                <PercentField
                  id="case-area-bleed"
                  label="Bleed (% of width)"
                  max={MAX_BLEED * 100}
                  step="0.5"
                  value={area.bleed}
                  onChange={(event) => {
                    const number = fromPercent(event, MAX_BLEED)
                    if (number !== null) onAreaChange({ ...area, bleed: number })
                  }}
                  help="Extends artwork beyond the visible print boundary to help prevent unprinted edges. 0 turns it off."
                />
              </fieldset>
            </>
          )}
          {editing === 'camera' && (
            <>
              <CFormCheck
                id="case-camera-enabled"
                label="This model has a camera opening"
                checked={cameraEnabled}
                onChange={(event) => {
                  onCameraEnabled(event.target.checked)
                  if (event.target.checked && !camera) onCameraChange(defaultCameraArea())
                }}
              />
              <small className="hm-muted d-block mt-1 mb-2">
                Defines the area where customer artwork must not cover the device camera. Place it
                exactly over the camera of this template: there the template&apos;s own camera stays
                visible above the customer&apos;s image.
              </small>
              {cameraEnabled && camera && (
                <>
                  <BoxFields prefix="case-camera" value={camera} onChange={onCameraChange} />
                  <CornerFields
                    prefix="case-camera"
                    value={camera}
                    onChange={onCameraChange}
                    help="Rounds the camera opening to match the camera island."
                  />
                </>
              )}
            </>
          )}
          {editing === 'safe' && (
            <>
              <CFormCheck
                id="case-safe-enabled"
                label="Show a safe area to customers"
                checked={!!area.safe}
                onChange={(event) => {
                  if (event.target.checked) onAreaChange({ ...area, safe: defaultSafeInsets() })
                  else {
                    const { safe: _safe, ...rest } = area
                    onAreaChange(rest)
                  }
                }}
              />
              <small className="hm-muted d-block mt-1 mb-2">
                Keep important content such as faces, text, and logos inside this area. Customers
                see it as a dotted guide while editing; it never crops their artwork and is not
                printed.
              </small>
              {area.safe && (
                <fieldset className="hm-case-fieldset">
                  <legend>Inset from the printable edge (% of width)</legend>
                  <CFormCheck
                    id="case-safe-uniform"
                    label="Same inset on all sides"
                    checked={!safeSides}
                    onChange={(event) => {
                      setSafeSides(!event.target.checked)
                      if (event.target.checked) {
                        const v = area.safe.top
                        onAreaChange({ ...area, safe: { top: v, right: v, bottom: v, left: v } })
                      }
                    }}
                  />
                  {!safeSides ? (
                    <div className="mt-1">
                      <PercentField
                        id="case-safe-all"
                        label="Inset (%)"
                        max={MAX_SAFE_INSET * 100}
                        step="0.5"
                        value={area.safe.top}
                        onChange={(event) => {
                          const v = fromPercent(event, MAX_SAFE_INSET)
                          if (v !== null)
                            onAreaChange({
                              ...area,
                              safe: { top: v, right: v, bottom: v, left: v },
                            })
                        }}
                      />
                    </div>
                  ) : (
                    <CRow className="g-2 mt-1">
                      {SIDES.map(([key, name]) => (
                        <CCol xs={6} key={key}>
                          <PercentField
                            id={`case-safe-${key}`}
                            label={`${name} (%)`}
                            max={MAX_SAFE_INSET * 100}
                            step="0.5"
                            value={area.safe[key]}
                            onChange={(event) => {
                              const v = fromPercent(event, MAX_SAFE_INSET)
                              if (v !== null)
                                onAreaChange({ ...area, safe: { ...area.safe, [key]: v } })
                            }}
                          />
                        </CCol>
                      ))}
                    </CRow>
                  )}
                </fieldset>
              )}
            </>
          )}
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
