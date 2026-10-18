import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CButton, CFormInput, CFormLabel } from '@coreui/react'
import ProductImage from '../views/products/ProductImage'
import { validateImageFile } from '../_helpers/imageUpload'

const ImagePicker = ({
  id,
  file,
  onChange,
  imageUrl,
  name,
  required = false,
  processBackground = false,
  label,
  hint,
}) => {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [inputKey, setInputKey] = useState(0)
  const inputRef = useRef(null)
  useEffect(() => {
    if (!file) {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file])
  return (
    <>
      <CFormLabel htmlFor={id}>
        {label || (required ? 'Image (required)' : 'Image (optional)')}
      </CFormLabel>
      <CFormInput
        ref={inputRef}
        className="hm-image-input"
        key={inputKey}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        aria-describedby={`${id}-help`}
        onChange={(event) => {
          const selected = event.target.files?.[0]
          if (!selected) return
          const message = validateImageFile(selected)
          setError(message)
          if (message) event.target.value = ''
          else onChange(selected)
        }}
      />
      {error && (
        <CAlert color="danger" role="alert">
          {error}
        </CAlert>
      )}
      <div className="hm-image-upload-card">
        <ProductImage src={preview || imageUrl} name={name} transparent={processBackground} large />
        <div className="hm-image-upload-content">
          <span className="hm-image-upload-eyebrow">
            {file ? 'Selected image' : imageUrl ? 'Current image' : 'Product photo'}
          </span>
          <strong className="hm-image-upload-filename" title={file?.name}>
            {file?.name || (imageUrl ? 'Your saved image' : 'Choose a photo')}
          </strong>
          <p id={`${id}-help`}>JPEG, PNG, or WebP · Maximum 5 MB{hint ? ` · ${hint}` : ''}</p>
          {processBackground && file && (
            <div className="hm-image-processing-note">
              <span aria-hidden="true">✦</span>
              <span>Background will be removed automatically.</span>
            </div>
          )}
          <div className="hm-image-upload-actions">
            <CButton
              type="button"
              color="primary"
              variant="outline"
              size="sm"
              onClick={() => inputRef.current?.click()}
            >
              {file || imageUrl ? 'Change image' : 'Choose image'}
            </CButton>
            {file && (
              <CButton
                type="button"
                color="danger"
                variant="outline"
                size="sm"
                onClick={() => {
                  onChange(null)
                  setError(null)
                  setInputKey((value) => value + 1)
                }}
              >
                Remove selected image
              </CButton>
            )}
          </div>
          {file && (
            <small className="hm-image-upload-footnote">
              {imageUrl
                ? 'Your current image stays until you save.'
                : 'Your image will be uploaded when you save.'}
            </small>
          )}
        </div>
      </div>
    </>
  )
}
ImagePicker.propTypes = {
  id: PropTypes.string.isRequired,
  file: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  name: PropTypes.string,
  required: PropTypes.bool,
  processBackground: PropTypes.bool,
  label: PropTypes.string,
  hint: PropTypes.string,
}
export default ImagePicker
