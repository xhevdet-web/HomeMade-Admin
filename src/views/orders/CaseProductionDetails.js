import PropTypes from 'prop-types'
import { MockupCanvas } from '../apparel/PrintAreaEditor'
import { brandLabel, isCase, radiusStyle } from '../cases/caseHelpers'

const fraction = (value) => `${Math.round(Number(value ?? 0.5) * 1000) / 10}%`

/**
 * How a phone case design is printed: the model it was made for (template frozen at order
 * time), its one design or photo, and where the customer placed it inside the printable
 * area. Scale 1 fills the area edge to edge (cover); x/y are the image centre.
 */
const CaseProductionDetails = ({ product }) => {
  const base = product?.baseProduct
  const item = product?.items?.[0]
  if (!isCase(product?.category) || !base || !item) return null
  const area = base.printAreas?.front
  const ownPhoto = !!item.customImageUrl
  const rows = [
    ['Phone model', [brandLabel(base.deviceBrand), base.name].filter(Boolean).join(' ')],
    ['Design', ownPhoto ? 'Customer photo (see uploaded artwork)' : item.subCategory?.name || '—'],
    ['Centre (x, y)', `${fraction(item.x)}, ${fraction(item.y)} of the printable area`],
    ['Scale', `${Math.round((item.scale ?? 1) * 100)}% of edge-to-edge fill`],
    ['Rotation', `${Math.round((item.rotation ?? 0) * 10) / 10}°`],
  ]
  return (
    <section className="hm-order-section" aria-labelledby="case-production-title">
      <div className="hm-order-section-heading">
        <h3 id="case-production-title">Phone case production</h3>
      </div>
      <div className="hm-production-layout">
        {base.imageUrl && (
          <div className="hm-production-mockup hm-case-mockup">
            <MockupCanvas
              src={base.imageUrl}
              overlaySrc={base.overlayImageUrl}
              side="printable"
              area={area}
              areaStyle={radiusStyle(area)}
              guides={
                base.printAreas?.camera
                  ? [
                      {
                        key: 'camera',
                        area: base.printAreas.camera,
                        label: 'Camera',
                        style: radiusStyle(base.printAreas.camera),
                      },
                    ]
                  : []
              }
            />
          </div>
        )}
        <dl className="hm-catalog-details">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
      </div>
      <p className="hm-muted small mb-0">
        The customer design preview above shows the finished look. Print from the original file
        {ownPhoto ? ' the customer uploaded' : ' of the design'}; artwork is clipped to the
        printable area and never covers the camera opening.
      </p>
    </section>
  )
}
CaseProductionDetails.propTypes = {
  product: PropTypes.object,
}
export default CaseProductionDetails
