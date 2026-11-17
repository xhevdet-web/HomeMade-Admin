import { useId } from 'react'
import PropTypes from 'prop-types'
import {
  bleedShape,
  cameraCutPath,
  cameraShape,
  printableShape,
  safeShape,
  shapePath,
  templateFrame,
} from './caseGeometry'

/**
 * SVG layers drawn over a case template, from the same geometry as the customer's studio.
 * Both use template units: 100 wide and 100 / ratio high, so corners stay round.
 */
const svgProps = (ratio, className) => ({
  className,
  viewBox: `0 0 100 ${100 / ratio}`,
  preserveAspectRatio: 'none',
  'aria-hidden': true,
})

/**
 * Outlines of the template: bleed (outer, faint), printable area, safe area (inner, dotted)
 * and camera opening. `editing` names the part being edited, which is drawn stronger.
 */
export const CaseGuides = ({ template, ratio, editing, show = {} }) => {
  const view = templateFrame(ratio)
  const { bleed = true, safe = true, camera = true } = show
  const safeArea = safe && safeShape(template, ratio)
  const cameraArea = camera && cameraShape(template, ratio)
  const strong = (part) => (editing === part ? ' is-active' : '')
  return (
    <svg {...svgProps(ratio, 'hm-case-layer hm-case-guides')} data-testid="case-guides">
      {bleed && template.bleed > 0 && (
        <path
          className="hm-case-guide-bleed"
          data-guide="bleed"
          d={shapePath(bleedShape(template, ratio), view)}
        />
      )}
      <path
        className={`hm-case-guide-printable${strong('area')}`}
        data-guide="printable"
        d={shapePath(printableShape(template, ratio), view)}
      />
      {safeArea && (
        <path
          className={`hm-case-guide-safe${strong('safe')}`}
          data-guide="safe"
          d={shapePath(safeArea, view)}
        />
      )}
      {cameraArea && (
        <path
          className={`hm-case-guide-camera${strong('camera')}`}
          data-guide="camera"
          d={shapePath(cameraArea, view)}
        />
      )}
    </svg>
  )
}
CaseGuides.propTypes = {
  template: PropTypes.object.isRequired,
  ratio: PropTypes.number.isRequired,
  editing: PropTypes.string,
  show: PropTypes.object,
}

const CELL_COLORS = ['#2f6fdf', '#f2b134']

/**
 * A temporary 3 × 3 numbered test pattern, clipped exactly like customer artwork: to the
 * printable shape, minus the camera. A faint copy fills the bleed so its reach is visible.
 * Edge bars on the printable box show at once when a side or corner is cut wrongly. It only
 * exists in the admin preview: it is never uploaded or saved.
 */
export const CaseTestArtwork = ({ template, ratio }) => {
  const id = useId().replace(/:/g, '')
  const view = templateFrame(ratio)
  const box = bleedShape(template, ratio)
  const [x, y, w, h] = [box.x * 100, (box.y * 100) / ratio, box.w * 100, (box.h * 100) / ratio]
  const area = template.area
  const [ax, ay, aw, ah] = [
    area.x * 100,
    (area.y * 100) / ratio,
    area.width * 100,
    (area.height * 100) / ratio,
  ]
  const cut = cameraCutPath(template, ratio, view)
  const font = Math.min(w, h) / 6
  const bar = Math.max(aw * 0.025, 0.8)
  const pattern = (
    <g>
      {Array.from({ length: 9 }, (_, i) => {
        const [col, row] = [i % 3, Math.floor(i / 3)]
        return (
          <g key={i}>
            <rect
              x={x + (col * w) / 3}
              y={y + (row * h) / 3}
              width={w / 3 + 0.05}
              height={h / 3 + 0.05}
              fill={CELL_COLORS[i % 2]}
            />
            <text
              x={x + ((col + 0.5) * w) / 3}
              y={y + ((row + 0.5) * h) / 3}
              fontSize={font}
              textAnchor="middle"
              dominantBaseline="central"
              className="hm-case-test-number"
            >
              {i + 1}
            </text>
          </g>
        )
      })}
      <path
        d={`M${x} ${y}L${x + w} ${y + h}M${x + w} ${y}L${x} ${y + h}`}
        className="hm-case-test-diagonal"
      />
      {/* Edge markers on the printable box: each side its own colour. */}
      <rect x={ax} y={ay} width={aw} height={bar} fill="#e5484d" />
      <rect x={ax + aw - bar} y={ay} width={bar} height={ah} fill="#30a46c" />
      <rect x={ax} y={ay + ah - bar} width={aw} height={bar} fill="#8e4ec6" />
      <rect x={ax} y={ay} width={bar} height={ah} fill="#f76b15" />
      <text
        x={ax + aw / 2}
        y={ay + bar * 2.6}
        fontSize={font / 3}
        textAnchor="middle"
        className="hm-case-test-label"
      >
        TOP
      </text>
      <text
        x={ax + aw / 2}
        y={ay + ah - bar * 1.8}
        fontSize={font / 3}
        textAnchor="middle"
        className="hm-case-test-label"
      >
        BOTTOM
      </text>
    </g>
  )
  return (
    <svg {...svgProps(ratio, 'hm-case-layer hm-case-test')} data-testid="case-test-artwork">
      <defs>
        <clipPath id={`${id}-bleed`}>
          <path d={shapePath(box, view)} />
        </clipPath>
        <clipPath id={`${id}-print`}>
          <path d={shapePath(printableShape(template, ratio), view)} />
        </clipPath>
        {cut && (
          <clipPath id={`${id}-cut`}>
            <path d={cut} clipRule="evenodd" />
          </clipPath>
        )}
      </defs>
      <g clipPath={`url(#${id}-bleed)`} opacity="0.28">
        {pattern}
      </g>
      <g clipPath={`url(#${id}-print)`}>
        <g clipPath={cut ? `url(#${id}-cut)` : undefined}>{pattern}</g>
      </g>
    </svg>
  )
}
CaseTestArtwork.propTypes = {
  template: PropTypes.object.isRequired,
  ratio: PropTypes.number.isRequired,
}

const LEGEND = [
  ['printable', 'Printable area'],
  ['bleed', 'Bleed'],
  ['safe', 'Safe area'],
  ['camera', 'Camera opening'],
]

/** What each outline means; parts the template doesn't use are left out. */
export const CaseLegend = ({ template }) => (
  <ul className="hm-case-legend" aria-label="Preview legend">
    {LEGEND.filter(
      ([key]) =>
        (key !== 'bleed' || template.bleed > 0) &&
        (key !== 'safe' || template.safe) &&
        (key !== 'camera' || template.camera),
    ).map(([key, label]) => (
      <li key={key}>
        <span className={`hm-case-swatch is-${key}`} aria-hidden="true" />
        {label}
      </li>
    ))}
  </ul>
)
CaseLegend.propTypes = {
  template: PropTypes.object.isRequired,
}
