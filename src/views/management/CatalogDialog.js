import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CFormTextarea,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CSpinner,
} from '@coreui/react'
import { Link } from 'react-router-dom'
import api, { apiErrorMessage } from '../../_helpers/api'
import ProductImage from '../products/ProductImage'
import ImagePicker from '../../components/ImagePicker'
import { imageFormData } from '../../_helpers/imageUpload'
import { catalogConfig, catalogPayload, emptyCatalogForm } from './catalogFields'

const CatalogDialog = ({ kind, action, onClose, onSaved }) => {
  const { singular, endpoint } = catalogConfig[kind]
  const isSubCategory = kind === 'sub-categories'
  const editing = action.mode === 'create' || action.mode === 'edit'
  const [form, setForm] = useState(emptyCatalogForm)
  const [record, setRecord] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState(null)
  const [selectedFile, setSelectedFile] = useState(null)
  const submitting = useRef(false)
  const [saving, setSaving] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    const detail =
      action.mode === 'create'
        ? Promise.resolve(null)
        : api.get(`${endpoint}/${encodeURIComponent(action.id)}`, {
            signal: controller.signal,
          })
    const options =
      isSubCategory && editing
        ? api.get('/categories', { signal: controller.signal })
        : Promise.resolve(null)
    Promise.all([detail, options])
      .then(([detailResponse, optionsResponse]) => {
        if (controller.signal.aborted) return
        if (optionsResponse && !Array.isArray(optionsResponse.data))
          throw new Error('Invalid categories response')
        const data = detailResponse?.data
        if (detailResponse && (!data || typeof data.id !== 'string'))
          throw new Error('Invalid detail response')
        setRecord(data)
        setCategories(optionsResponse?.data || [])
        setForm(
          Object.fromEntries(
            Object.entries(emptyCatalogForm).map(([key, fallback]) => [
              key,
              data?.[key] ?? fallback,
            ]),
          ),
        )
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(error, 'Unable to load this record. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [action.id, action.mode, endpoint, isSubCategory, editing, attempt])

  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }
  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current) return
    setError(null)
    if (editing && !form.name.trim()) {
      setError('Name is required.')
      return
    }
    if (
      editing &&
      isSubCategory &&
      !categories.some((category) => category.id === form.categoryId)
    ) {
      setError('Select an available category.')
      return
    }
    submitting.current = true
    setSaving(true)
    try {
      if (action.mode === 'delete') await api.delete(`${endpoint}/${encodeURIComponent(action.id)}`)
      else {
        const payload = imageFormData(catalogPayload(form, isSubCategory), selectedFile)
        if (action.mode === 'create') await api.post(endpoint, payload)
        else await api.patch(`${endpoint}/${encodeURIComponent(action.id)}`, payload)
      }
      onSaved(
        `${singular} ${action.mode === 'delete' ? 'deleted' : action.mode === 'create' ? 'created' : 'updated'} successfully.`,
      )
    } catch (error) {
      setError(apiErrorMessage(error))
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }
  const input = (name, label, props = {}) => (
    <CCol md={6} key={name}>
      <CFormLabel htmlFor={`catalog-${name}`}>{label}</CFormLabel>
      <CFormInput
        id={`catalog-${name}`}
        name={name}
        value={form[name]}
        onChange={change}
        {...props}
      />
    </CCol>
  )
  const integer = {
    type: 'number',
    min: 0,
    max: 2147483647,
    step: 1,
    required: true,
  }
  const title = `${action.mode === 'view' ? '' : action.mode === 'create' ? 'Create ' : action.mode === 'edit' ? 'Edit ' : 'Delete '}${singular}${action.mode === 'view' ? ' details' : ''}`
  const fields = [
    ['Name', record?.name],
    ...(isSubCategory
      ? [
          ['Category', record?.category?.name || 'Unavailable category'],
          ['Color', record?.color],
          ['Type', record?.type],
          ['Price (cents)', record?.price],
          ['Stock', record?.stock],
        ]
      : []),
    ['Description', record?.description],
    ['Image URL', record?.imageUrl],
    ['Status', record?.isActive ? 'Active' : 'Inactive'],
    ['Sort order', record?.sortOrder],
  ]

  return (
    <CModal
      visible
      alignment="center"
      size="lg"
      backdrop="static"
      keyboard={!saving}
      onClose={() => {
        if (!saving) onClose()
      }}
      aria-labelledby="catalog-dialog-title"
      className="hm-catalog-modal"
    >
      <CModalHeader closeButton={!saving}>
        <CModalTitle id="catalog-dialog-title">{title}</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={submit}>
        <CModalBody>
          {loading ? (
            <div className="hm-empty" role="status">
              <CSpinner aria-hidden="true" />
              <p>Loading {singular.toLowerCase()}...</p>
            </div>
          ) : loadError ? (
            <CAlert color="danger" role="alert">
              {loadError}{' '}
              <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </CButton>
            </CAlert>
          ) : (
            <>
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              {action.mode === 'view' ? (
                <>
                  <ProductImage src={record?.imageUrl} name={record?.name} large />
                  <dl className="hm-catalog-details">
                    {fields.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>
                          {value === null || value === undefined || value === ''
                            ? 'Not provided'
                            : String(value)}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </>
              ) : action.mode === 'delete' ? (
                <>
                  <p>
                    Delete <strong>{record?.name}</strong>?
                  </p>
                  <p>This action cannot be undone.</p>
                  {!isSubCategory && (
                    <CAlert color="warning">
                      Deleting this category also permanently deletes all of its subcategories
                      {Array.isArray(record?.subCategories)
                        ? ` (${record.subCategories.length})`
                        : ''}
                      .
                    </CAlert>
                  )}
                </>
              ) : (
                <fieldset disabled={saving}>
                  <CRow className="g-3">
                    {isSubCategory && (
                      <CCol xs={12}>
                        <CFormLabel htmlFor="catalog-categoryId">Category</CFormLabel>
                        <CFormSelect
                          id="catalog-categoryId"
                          name="categoryId"
                          required
                          value={form.categoryId}
                          onChange={change}
                          disabled={!categories.length}
                        >
                          <option value="">Select a category</option>
                          {form.categoryId &&
                            !categories.some((category) => category.id === form.categoryId) && (
                              <option value={form.categoryId} disabled>
                                Previously selected category is unavailable
                              </option>
                            )}
                          {categories.map((category) => (
                            <option key={category.id} value={category.id}>
                              {category.name}
                            </option>
                          ))}
                        </CFormSelect>
                        {!categories.length && (
                          <p className="mt-2 mb-0">
                            Create a category before adding a subcategory.{' '}
                            <Link to="/categories" onClick={onClose}>
                              Go to Categories
                            </Link>
                          </p>
                        )}
                      </CCol>
                    )}
                    {input('name', 'Name', { required: true, maxLength: 200 })}
                    {input('sortOrder', 'Sort order', integer)}
                    <CCol xs={12}>
                      <CFormLabel htmlFor="catalog-description">Description</CFormLabel>
                      <CFormTextarea
                        id="catalog-description"
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={change}
                      />
                    </CCol>
                    <CCol xs={12}>
                      <ImagePicker
                        id="entity-image"
                        file={selectedFile}
                        onChange={setSelectedFile}
                        imageUrl={record?.imageUrl}
                        name={form.name}
                      />
                    </CCol>
                    {isSubCategory && (
                      <>
                        {input('color', 'Color')}
                        {input('type', 'Type')}
                        {input('price', 'Price (cents)', integer)}
                        {input('stock', 'Stock', integer)}
                        <CCol xs={12}>
                          <small className="hm-muted">
                            Price is entered in cents: 1500 represents 15.00.
                          </small>
                        </CCol>
                      </>
                    )}
                    <CCol xs={12}>
                      <CFormCheck
                        id="catalog-isActive"
                        name="isActive"
                        label="Active"
                        checked={form.isActive}
                        onChange={change}
                      />
                    </CCol>
                  </CRow>
                </fieldset>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            color="secondary"
            variant="outline"
            type="button"
            disabled={saving}
            onClick={onClose}
          >
            {action.mode === 'view' ? 'Close' : 'Cancel'}
          </CButton>
          {action.mode !== 'view' && (
            <CButton
              color={action.mode === 'delete' ? 'danger' : 'primary'}
              type="submit"
              disabled={
                loading || !!loadError || saving || (editing && isSubCategory && !categories.length)
              }
            >
              {saving ? (
                <>
                  <CSpinner size="sm" aria-hidden="true" className="me-2" />
                  Saving...
                </>
              ) : action.mode === 'delete' ? (
                `Delete ${singular}`
              ) : (
                `Save ${singular}`
              )}
            </CButton>
          )}
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
CatalogDialog.propTypes = {
  kind: PropTypes.oneOf(['categories', 'sub-categories']).isRequired,
  action: PropTypes.shape({
    mode: PropTypes.string.isRequired,
    id: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
export default CatalogDialog
