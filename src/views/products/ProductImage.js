import { useState } from 'react'
import PropTypes from 'prop-types'
import placeholder from '../../assets/images/catalog-placeholder.svg'

const ProductImage = ({ src, name, large = false }) => {
  const [failedSource, setFailedSource] = useState(null)
  const usable =
    typeof src === 'string' && /^(https?:\/\/|blob:)/i.test(src) && failedSource !== src
  return (
    <div className={`hm-product-image${large ? ' hm-product-image-large' : ''}`}>
      <img
        src={usable ? src : placeholder}
        alt={`${name || 'Product'} preview`}
        loading="lazy"
        referrerPolicy="no-referrer"
        onError={usable ? () => setFailedSource(src) : undefined}
      />
    </div>
  )
}
ProductImage.propTypes = {
  src: PropTypes.string,
  name: PropTypes.string,
  large: PropTypes.bool,
}
export default ProductImage
