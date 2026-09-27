import { useState } from 'react'
import PropTypes from 'prop-types'

const ProductImage = ({ src, name, large = false }) => {
  const [failedSource, setFailedSource] = useState(null)
  const usable = typeof src === 'string' && /^https?:\/\//i.test(src) && failedSource !== src
  return (
    <div className={`hm-product-image${large ? ' hm-product-image-large' : ''}`}>
      {usable ? (
        <img
          src={src}
          alt={`${name || 'Product'} preview`}
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={() => setFailedSource(src)}
        />
      ) : (
        <span>{src ? 'Image unavailable' : 'No image'}</span>
      )}
    </div>
  )
}
ProductImage.propTypes = { src: PropTypes.string, name: PropTypes.string, large: PropTypes.bool }
export default ProductImage
