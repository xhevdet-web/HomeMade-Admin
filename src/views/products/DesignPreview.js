import { useState } from 'react'
import PropTypes from 'prop-types'
import placeholder from '../../assets/images/catalog-placeholder.svg'

const DesignPreview = ({ src, name, large = false }) => {
  const [failedSource, setFailedSource] = useState(null)
  const usable = typeof src === 'string' && /^https?:\/\//i.test(src) && src !== failedSource
  const preview = (
    <img
      src={usable ? src : placeholder}
      alt={`${name || 'Jewelry'} customer design${usable ? '' : ' placeholder'}`}
      loading={large ? 'eager' : 'lazy'}
      referrerPolicy="no-referrer"
      onError={usable ? () => setFailedSource(src) : undefined}
    />
  )
  return (
    <div className={`hm-design-preview${large ? ' hm-design-preview-large' : ''}`}>
      {large && usable ? (
        <a
          href={src}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Open full-size customer design"
        >
          {preview}
        </a>
      ) : (
        preview
      )}
      {large && (
        <p>
          {usable
            ? 'Select the preview to open the full-size design.'
            : 'Design preview unavailable. Showing a placeholder.'}
        </p>
      )}
    </div>
  )
}
DesignPreview.propTypes = { src: PropTypes.string, name: PropTypes.string, large: PropTypes.bool }
export default DesignPreview
