import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CButton } from '@coreui/react'
import api from '../../_helpers/api'
import { MockupCanvas } from '../garments/PrintAreaEditor'
import { defaultPrintArea, garmentEndpoints, placementMeasurements } from '../garments/garmentHelpers'

const sides = [
  ['FRONT', 'front', 'Front'],
  ['BACK', 'back', 'Back'],
]
const designImage = (item) => item.subCategory?.originalImageUrl || item.subCategory?.imageUrl

const printSheet = () => {
  document.body.classList.add('hm-printing-production')
  const done = () => {
    document.body.classList.remove('hm-printing-production')
    window.removeEventListener('afterprint', done)
  }
  window.addEventListener('afterprint', done)
  window.print()
}

/** Exact placements of each design, converted to centimetres of the garment's print area. */
const ProductionSheet = ({ product, orderNumber }) => {
  const variant = product?.garmentVariant
  const snapshotGarment = variant?.garment
  // Orders placed before print areas were snapshotted fall back to the current garment.
  const legacy = !!snapshotGarment && snapshotGarment.frontPrintArea === undefined
  const [current, setCurrent] = useState(null)
  useEffect(() => {
    if (!legacy || !snapshotGarment.id) return
    const controller = new AbortController()
    api
      .get(garmentEndpoints.detail(snapshotGarment.id), { signal: controller.signal })
      .then(({ data }) => setCurrent(data))
      .catch(() => {})
    return () => controller.abort()
  }, [legacy, snapshotGarment?.id])
  const garment = legacy ? { ...snapshotGarment, ...(current || {}) } : snapshotGarment
  const placed = (product?.items || []).filter((item) => item.side && item.x !== null && item.x !== undefined)
  if (!variant || !placed.length) return null

  return (
    <section className="hm-order-section hm-production-sheet" aria-labelledby="production-sheet-title">
      <div className="hm-order-section-heading">
        <h3 id="production-sheet-title">Production sheet</h3>
        <CButton color="primary" variant="outline" size="sm" className="hm-no-print" onClick={printSheet}>
          Print production sheet
        </CButton>
      </div>
      <p className="hm-production-meta">
        {orderNumber} · {garment?.name} · {variant.colorName} / {variant.size}
        {variant.sku ? ` · SKU ${variant.sku}` : ''}
      </p>
      {legacy && (
        <CAlert color="warning" className="hm-no-print">
          This order was placed before print areas were saved with orders.{' '}
          {current
            ? 'Measurements use the garment’s current print areas and mockups.'
            : 'Unable to load the current garment; showing default areas.'}
        </CAlert>
      )}
      {sides.map(([side, key, label]) => {
        const items = placed.filter((item) => item.side === side)
        if (!items.length) return null
        const savedArea = garment?.[`${key}PrintArea`]
        const area = savedArea || defaultPrintArea(key)
        return (
          <div className="hm-production-side" key={side}>
            <h4>{label}</h4>
            {!savedArea && (
              <p className="hm-muted small">No {key} print area was saved; using the default area.</p>
            )}
            {!Number.isFinite(Number(area.widthCm)) && (
              <p className="hm-muted small">
                The real print size is not set for this side, so centimetres cannot be calculated.
                Set it on the garment.
              </p>
            )}
            <div className="hm-production-layout">
              <div className="hm-production-mockup">
                <MockupCanvas
                  // The back reuses the front mockup when no separate one was uploaded.
                  src={garment?.[`${key}ImageUrl`] || garment?.frontImageUrl}
                  silhouette={garment?.silhouette}
                  side={key}
                  area={area}
                >
                  {items.map((item, index) => (
                    <img
                      key={item.id || index}
                      className="hm-placed-design"
                      src={designImage(item)}
                      alt={`${item.subCategory?.name || 'Design'} placement ${index + 1}`}
                      referrerPolicy="no-referrer"
                      style={{
                        left: `${item.x * 100}%`,
                        top: `${item.y * 100}%`,
                        width: `${(item.scale ?? 1) * 50}%`,
                        transform: `translate(-50%, -50%) rotate(${item.rotation ?? 0}deg)`,
                      }}
                    />
                  ))}
                </MockupCanvas>
                <small className="hm-muted">
                  Print area {area.widthCm ?? '?'} × {area.heightCm ?? '?'} cm
                </small>
              </div>
              <div className="table-responsive">
                <table className="table table-sm hm-production-table">
                  <caption className="visually-hidden">{label} design placements</caption>
                  <thead>
                    <tr>
                      <th scope="col">Design</th>
                      <th scope="col">Width</th>
                      <th scope="col">Centre from left</th>
                      <th scope="col">Centre from top</th>
                      <th scope="col">Rotation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => {
                      const size = placementMeasurements(item, area)
                      const image = designImage(item)
                      return (
                        <tr key={item.id || index}>
                          <td>
                            <div className="hm-production-design">
                              {image && <img src={image} alt="" referrerPolicy="no-referrer" />}
                              <div>
                                <strong>{item.subCategory?.name || 'Unavailable design'}</strong>
                                {item.subCategory?.originalImageUrl && (
                                  <a
                                    className="d-block small hm-no-print"
                                    href={item.subCategory.originalImageUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    download
                                  >
                                    Production file
                                  </a>
                                )}
                              </div>
                            </div>
                          </td>
                          <td>{size.width}</td>
                          <td>{size.left}</td>
                          <td>{size.top}</td>
                          <td>{size.rotation}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      })}
      <p className="hm-muted small mb-0">
        Positions are measured to the centre of each design from the top-left corner of the
        print area. Design width = scale × 50% of the print-area width.
      </p>
    </section>
  )
}
ProductionSheet.propTypes = {
  product: PropTypes.object,
  orderNumber: PropTypes.string,
}
export default ProductionSheet
