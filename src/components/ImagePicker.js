import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CButton, CFormInput, CFormLabel } from '@coreui/react'
import ProductImage from '../views/products/ProductImage'
import { validateImageFile } from '../_helpers/imageUpload'

const ImagePicker = ({ id, file, onChange, imageUrl, name }) => {
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState(null)
  const [inputKey, setInputKey] = useState(0)
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
      <CFormLabel htmlFor={id}>Image (optional)</CFormLabel>
      <CFormInput
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
      <p id={`${id}-help`} className="hm-muted mt-2">
        JPEG, PNG, or WebP. Maximum 5 MB.
      </p>
      {error && (
        <CAlert color="danger" role="alert">
          {error}
        </CAlert>
      )}
      <ProductImage src={preview || imageUrl} name={name} large />
      {file && (
        <div className="mt-2">
          <span>{file.name}</span>{' '}
          <CButton
            type="button"
            color="secondary"
            variant="outline"
            size="sm"
            onClick={() => {
              onChange(null)
              setError(null)
              setInputKey((value) => value + 1)
            }}
          >
            Cancel image selection
          </CButton>
        </div>
      )}
    </>
  )
}
ImagePicker.propTypes = {
  id: PropTypes.string.isRequired,
  file: PropTypes.object,
  onChange: PropTypes.func.isRequired,
  imageUrl: PropTypes.string,
  name: PropTypes.string,
}
export default ImagePicker
