import PropTypes from 'prop-types'

const sideLabels = { FRONT: 'Front', BACK: 'Back' }
// Apparel artwork is PNG; phone case photos may also be JPEG or WebP.
const extension = (url) => /\.(png|jpe?g|webp)$/i.exec(url.split('?')[0])?.[0] || '.png'

/**
 * The customer's own uploaded images, exactly as uploaded, so they can be checked and
 * downloaded for printing. Each upload is listed once, with every side it is placed on.
 */
const UploadedArtwork = ({ product }) => {
  const uploads = []
  for (const item of product?.items || []) {
    if (!item.customImageUrl) continue
    const known = uploads.find((upload) => upload.url === item.customImageUrl)
    if (known) {
      if (item.side && !known.sides.includes(item.side)) known.sides.push(item.side)
    } else uploads.push({ url: item.customImageUrl, sides: item.side ? [item.side] : [] })
  }
  if (!uploads.length) return null

  return (
    <section className="hm-order-section hm-uploaded-artwork" aria-labelledby="uploaded-artwork-title">
      <div className="hm-order-section-heading">
        <h3 id="uploaded-artwork-title">Customer uploaded artwork</h3>
        <span className="hm-muted small">
          {uploads.length} {uploads.length === 1 ? 'image' : 'images'}
        </span>
      </div>
      <p className="hm-muted small">
        The original files the customer uploaded, untouched. Print these; the production
        sheet below shows where each one goes.
      </p>
      <div className="hm-artwork-grid">
        {uploads.map((upload, index) => {
          const sides = upload.sides.map((side) => sideLabels[side] || side).join(' and ')
          const name = `Uploaded artwork ${index + 1}`
          return (
            <figure key={upload.url} className="hm-artwork">
              <a href={upload.url} target="_blank" rel="noopener noreferrer" className="hm-artwork-image">
                <img src={upload.url} alt={sides ? `${name}, ${sides}` : name} referrerPolicy="no-referrer" />
              </a>
              <figcaption>
                <strong>{name}</strong>
                {sides && <span className="d-block small hm-muted">Printed on the {sides.toLowerCase()}</span>}
                <span className="d-flex gap-3 small hm-no-print">
                  <a href={upload.url} target="_blank" rel="noopener noreferrer">
                    Open full size
                  </a>
                  <a href={upload.url} download={`artwork-${index + 1}${extension(upload.url)}`}>
                    Download
                  </a>
                </span>
              </figcaption>
            </figure>
          )
        })}
      </div>
    </section>
  )
}
UploadedArtwork.propTypes = {
  product: PropTypes.object,
}
export default UploadedArtwork
