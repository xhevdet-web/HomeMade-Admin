import PropTypes from 'prop-types'
import { CButton } from '@coreui/react'
import { MockupCanvas } from '../apparel/PrintAreaEditor'
import {
  defaultPrintArea,
  placementMeasurements,
  TEXT_WIDTH_SHARE,
  textCss,
  textMeasurements,
  textStyleLabel,
} from '../apparel/apparelHelpers'

const sides = [
  ['FRONT', 'front', 'Front'],
  ['BACK', 'back', 'Back'],
]
// The customer's own upload when there is one, else the catalog design's original.
const designImage = (item) =>
  item.customImageUrl || item.subCategory?.originalImageUrl || item.subCategory?.imageUrl
const productionFile = (item) => item.customImageUrl || item.subCategory?.originalImageUrl

const printSheet = () => {
  document.body.classList.add('hm-printing-production')
  const done = () => {
    document.body.classList.remove('hm-printing-production')
    window.removeEventListener('afterprint', done)
  }
  window.addEventListener('afterprint', done)
  window.print()
}

/**
 * Exact placements of each design, converted to centimetres of the print area of the
 * base product as it was when the order was placed.
 */
const ProductionSheet = ({ product, orderNumber }) => {
  const base = product?.baseProduct
  const placed = (product?.items || []).filter((item) => item.side && item.x !== null && item.x !== undefined)
  // Printed text: every layer names the side it goes on.
  const texts = (Array.isArray(product?.textLayers) ? product.textLayers : []).filter(
    (layer) => layer?.side && typeof layer.text === 'string',
  )
  if (!base || (!placed.length && !texts.length)) return null
  const silhouette = product?.category?.builderConfig?.silhouette

  return (
    <section className="hm-order-section hm-production-sheet" aria-labelledby="production-sheet-title">
      <div className="hm-order-section-heading">
        <h3 id="production-sheet-title">Production sheet</h3>
        <CButton color="primary" variant="outline" size="sm" className="hm-no-print" onClick={printSheet}>
          Print production sheet
        </CButton>
      </div>
      <p className="hm-production-meta">
        {orderNumber} · {base.name}
        {base.color ? ` · ${base.color}` : ''}
        {product?.selectedSize?.name ? ` · Size ${product.selectedSize.name}` : ''}
      </p>
      {sides.map(([side, key, label]) => {
        const items = placed.filter((item) => item.side === side)
        const sideTexts = texts.filter((layer) => layer.side === side)
        if (!items.length && !sideTexts.length) return null
        const savedArea = base.printAreas?.[key]
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
                Set it on the product.
              </p>
            )}
            <div className="hm-production-layout">
              <div className="hm-production-mockup">
                <MockupCanvas
                  // The back reuses the front image when no separate one was uploaded.
                  src={(key === 'back' && base.backImageUrl) || base.imageUrl}
                  silhouette={silhouette}
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
                  {sideTexts.map((layer) => (
                    <span
                      key={layer.id}
                      className="hm-placed-text"
                      style={{
                        left: `${layer.x * 100}%`,
                        top: `${layer.y * 100}%`,
                        width: `${(layer.scale ?? 1) * TEXT_WIDTH_SHARE * 100}%`,
                        ...textCss(layer),
                        transform: `translate(-50%, -50%) rotate(${layer.rotation ?? 0}deg)`,
                      }}
                    >
                      {layer.text}
                    </span>
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
                      const file = productionFile(item)
                      return (
                        <tr key={item.id || index}>
                          <td>
                            <div className="hm-production-design">
                              {image && <img src={image} alt="" referrerPolicy="no-referrer" />}
                              <div>
                                <strong>{item.subCategory?.name || 'Unavailable design'}</strong>
                                {item.customImageUrl && (
                                  <span className="d-block small hm-muted">Customer upload</span>
                                )}
                                {file && (
                                  <a
                                    className="d-block small hm-no-print"
                                    href={file}
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
                    {sideTexts.map((layer) => {
                      const size = textMeasurements(layer, area)
                      return (
                        <tr key={layer.id}>
                          <td>
                            <strong>Text “{layer.text}”</strong>
                            <span className="d-block small hm-muted">
                              {textStyleLabel(layer)}
                              {' · '}
                              <span
                                className="hm-swatch"
                                style={{ backgroundColor: layer.color || '#2D3250' }}
                                aria-hidden="true"
                              />{' '}
                              {layer.color || '#2D3250'}
                            </span>
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
