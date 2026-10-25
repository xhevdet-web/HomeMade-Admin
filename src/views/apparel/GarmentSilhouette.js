import PropTypes from 'prop-types'

// Square drawings used until a mockup is uploaded, matching the app's fallback canvas.
const paths = {
  HOODIE:
    'M70 40 Q100 20 130 40 L165 58 L190 120 L168 130 L155 100 L155 182 L45 182 L45 100 L32 130 L10 120 L35 58 Z M82 40 Q100 72 118 40',
  TSHIRT:
    'M72 30 Q100 48 128 30 L175 52 L192 92 L162 104 L155 88 L155 182 L45 182 L45 88 L38 104 L8 92 L25 52 Z',
}

const GarmentSilhouette = ({ silhouette, color = '#d9dde0', side = 'front' }) => (
  <svg
    viewBox="0 0 200 200"
    className="hm-garment-silhouette"
    role="img"
    aria-label={`${silhouette === 'TSHIRT' ? 'T-shirt' : 'Hoodie'} ${side} outline`}
  >
    <path
      d={paths[silhouette] || paths.HOODIE}
      fill={color}
      stroke="currentColor"
      strokeOpacity="0.35"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
)
GarmentSilhouette.propTypes = {
  silhouette: PropTypes.string,
  color: PropTypes.string,
  side: PropTypes.oneOf(['front', 'back']),
}
export default GarmentSilhouette
