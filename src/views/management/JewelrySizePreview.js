import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'

/**
 * Shows the image the way the studio draws a measured piece: the whole file fitted into a
 * slot the size of the piece. A piece that looks small here will look small on the cord.
 */
const JewelrySizePreview = ({ file, imageUrl, sizeMm }) => {
  const [preview, setPreview] = useState(null)
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return undefined
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  const src = preview || imageUrl
  if (!src) return null
  const label = sizeMm ? `${sizeMm} mm` : 'Size not set'
  return (
    <figure className="hm-jewelry-size-preview" aria-label={`Size preview: ${label}`}>
      <div className="hm-jewelry-size-slot">
        <img src={src} alt="" />
      </div>
      <figcaption>
        <strong>{label}</strong>
        <span>The piece should fill the circle, as it will on the cord.</span>
      </figcaption>
    </figure>
  )
}

JewelrySizePreview.propTypes = {
  file: PropTypes.object,
  imageUrl: PropTypes.string,
  sizeMm: PropTypes.number,
}

export default JewelrySizePreview
