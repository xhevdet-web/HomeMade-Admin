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
import { catalogConfig, catalogPayload, categoryForm, emptyCatalogForm, typesFor } from './catalogFields'
import CategorySizesEditor from './CategorySizesEditor'
import { builderLabels } from './catalogFields'
import { silhouettes } from '../apparel/apparelHelpers'

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
  const [removeBackground, setRemoveBackground] = useState(true)
  const [customType, setCustomType] = useState(false)
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
    // Sub-categories pick a parent; categories pick an optional design library.
    const options =
      editing || (!isSubCategory && action.mode === 'view')
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
        const nextForm = categoryForm(data)
        const builder = (optionsResponse?.data || []).find(
          (category) => category.id === nextForm.categoryId,
        )?.builderType
        setCustomType(!!nextForm.type && !typesFor(builder)[nextForm.type])
        setForm(nextForm)
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
  const changeBuilderType = (event) => {
    const builderType = event.target.value
    const hasConfiguration = form.sizes?.length > 0
    if (
      builderType !== form.builderType &&
      hasConfiguration &&
      !window.confirm('Changing builder type will discard the current configuration. Continue?')
    )
      return
    setForm((previous) => ({
      ...previous,
      builderType,
      sizes: [],
      silhouette: builderType === 'APPAREL' ? previous.silhouette || 'HOODIE' : '',
      designCategoryId: builderType === 'APPAREL' ? previous.designCategoryId : '',
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
      let saved
      if (action.mode === 'delete') await api.delete(`${endpoint}/${encodeURIComponent(action.id)}`)
      else {
        let fields
        try {
          fields = catalogPayload(form, isSubCategory)
        } catch (validationError) {
          setError(validationError.message)
          return
        }
        // removeBackground only matters for a new upload; false keeps fine logos untouched.
        if (isSubCategory && selectedFile) fields.removeBackground = removeBackground
        const payload = imageFormData(fields, selectedFile)
        const options = { timeout: selectedFile ? 120000 : 15000 }
        if (action.mode === 'create') saved = await api.post(endpoint, payload, options)
        else
          saved = await api.patch(`${endpoint}/${encodeURIComponent(action.id)}`, payload, options)
      }
      if (saved) {
        setRecord(saved.data)
        setSelectedFile(null)
      }
      onSaved(
        `${singular} ${action.mode === 'delete' ? 'deleted' : action.mode === 'create' ? 'created' : 'updated'} successfully.`,
        saved?.data,
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
  const componentTypes = typesFor(
    categories.find((category) => category.id === form.categoryId)?.builderType,
  )
  // A saved type outside the category's choices is shown as free text.
  const showCustomType = customType || (!!form.type && !componentTypes[form.type])
  const title = `${action.mode === 'view' ? '' : action.mode === 'create' ? 'Create ' : action.mode === 'edit' ? 'Edit ' : 'Delete '}${singular}${action.mode === 'view' ? ' details' : ''}`
  const fields = [
    ['Name', record?.name],
    ...(isSubCategory
      ? [
          ['Category', record?.category?.name || 'Unavailable category'],
          ['Color', record?.color],
          ['Type', record?.type],
          ['Price (cents)', record?.price],
          ['Stock', record?.trackStock === false ? 'Unlimited (printed design)' : record?.stock],
        ]
      : [
          ['Builder type', builderLabels[record?.builderType] || 'Not configured'],
          [
            'Configuration',
            record?.builderType === 'JEWELRY'
              ? `${record?.sizes?.length || 0} sizes`
              : record?.builderType === 'APPAREL'
                ? `${silhouettes[record?.builderConfig?.silhouette] || 'No'} silhouette · colours and sizes per product`
                : 'Not configured',
          ],
          ...(record?.builderType === 'APPAREL'
            ? [
                [
                  'Design library',
                  record?.designCategoryId
                    ? categories.find((category) => category.id === record.designCategoryId)
                        ?.name || 'Unavailable category'
                    : 'None',
                ],
              ]
            : []),
        ]),
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
                  <ProductImage
                    src={record?.imageUrl}
                    name={record?.name}
                    transparent
                    large
                  />
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
                  {isSubCategory && record?.originalImageUrl && (
                    <p className="mb-0">
                      <strong>Production file:</strong>{' '}
                      <a href={record.originalImageUrl} target="_blank" rel="noopener noreferrer" download>
                        Download original upload
                      </a>
                    </p>
                  )}
                  {!isSubCategory && record?.builderType === 'JEWELRY' && (
                    <section className="mt-4">
                      <h3>Sizes</h3>
                      {record?.sizes?.length ? (
                        record.sizes.map((size) => (
                          <p key={size.id}>
                            <strong>{size.name}</strong> · {size.measurement} {size.unit} · Max
                            Items: {size.maxItems}
                          </p>
                        ))
                      ) : (
                        <p className="hm-muted">No sizes</p>
                      )}
                    </section>
                  )}
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
                    {!isSubCategory && (
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="catalog-builderType">Builder Type</CFormLabel>
                        <CFormSelect
                          id="catalog-builderType"
                          name="builderType"
                          value={form.builderType}
                          onChange={changeBuilderType}
                        >
                          <option value="">Not configured</option>
                          {Object.entries(builderLabels).map(([value, label]) => (
                            <option value={value} key={value}>{label}</option>
                          ))}
                        </CFormSelect>
                      </CCol>
                    )}
                    {!isSubCategory && form.builderType === 'APPAREL' && (
                      <CCol xs={12} md={6}>
                        <CFormLabel htmlFor="catalog-silhouette">Garment shape</CFormLabel>
                        <CFormSelect
                          id="catalog-silhouette"
                          name="silhouette"
                          value={form.silhouette}
                          onChange={change}
                          aria-describedby="catalog-silhouette-help"
                        >
                          <option value="">None</option>
                          {Object.entries(silhouettes).map(([value, label]) => (
                            <option key={value} value={value}>
                              {label}
                            </option>
                          ))}
                        </CFormSelect>
                        <small id="catalog-silhouette-help" className="hm-muted">
                          Drawn in the studio until a product has its own image. Colours, sizes
                          and stock are set on each product.
                        </small>
                      </CCol>
                    )}
                    {!isSubCategory && form.builderType === 'APPAREL' && (
                      <CCol xs={12}>
                        <CFormLabel htmlFor="catalog-designCategoryId">Design library</CFormLabel>
                        <CFormSelect
                          id="catalog-designCategoryId"
                          name="designCategoryId"
                          value={form.designCategoryId}
                          onChange={change}
                          aria-describedby="catalog-designCategoryId-help"
                        >
                          <option value="">None</option>
                          {categories
                            // A library cannot be this category or itself use a library.
                            .filter(
                              (category) =>
                                category.id !== action.id &&
                                (!category.designCategoryId || category.id === form.designCategoryId),
                            )
                            .map((category) => (
                              <option key={category.id} value={category.id}>
                                {category.name}
                              </option>
                            ))}
                        </CFormSelect>
                        <small id="catalog-designCategoryId-help" className="hm-muted">
                          Also offer the designs of this category, e.g. a shared Apparel Designs
                          category for Hoodies and T-Shirts.
                        </small>
                      </CCol>
                    )}
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
                        processBackground={!isSubCategory || removeBackground}
                      />
                      {isSubCategory && selectedFile && (
                        <CFormCheck
                          className="mt-2"
                          id="catalog-removeBackground"
                          label="Remove background (turn off for fine logos and lettering)"
                          checked={removeBackground}
                          onChange={(event) => setRemoveBackground(event.target.checked)}
                        />
                      )}
                      {isSubCategory && record?.originalImageUrl && (
                        <p className="mt-2 mb-0">
                      <strong>Production file:</strong>{' '}
                      <a href={record.originalImageUrl} target="_blank" rel="noopener noreferrer" download>
                        Download original upload
                      </a>
                    </p>
                      )}
                    </CCol>
                    {isSubCategory && (
                      <>
                        {input('color', 'Color')}
                        <CCol md={6}>
                          {/* Choices follow the category's studio, e.g. Wrapping for bouquets. */}
                          <CFormLabel htmlFor="catalog-typeSelect">Type</CFormLabel>
                          <CFormSelect
                            id="catalog-typeSelect"
                            value={showCustomType ? '__custom' : form.type}
                            onChange={(event) => {
                              const value = event.target.value
                              setCustomType(value === '__custom')
                              setForm((previous) => ({
                                ...previous,
                                type: value === '__custom' ? '' : value,
                              }))
                            }}
                          >
                            <option value="">Not specified</option>
                            {Object.entries(componentTypes).map(([value, label]) => (
                              <option key={value} value={value}>
                                {label}
                              </option>
                            ))}
                            <option value="__custom">Other (free text, e.g. beads)</option>
                          </CFormSelect>
                          {showCustomType && (
                            <CFormInput
                              className="mt-2"
                              id="catalog-type"
                              name="type"
                              aria-label="Custom type"
                              placeholder="e.g. Pendant"
                              value={form.type}
                              onChange={change}
                            />
                          )}
                        </CCol>
                        {input('price', 'Price (cents)', integer)}
                        {form.trackStock ? (
                          input('stock', 'Stock', integer)
                        ) : (
                          <CCol md={6}>
                            <span className="form-label d-block">Stock</span>
                            <p className="form-control-plaintext hm-muted mb-0">
                              Unlimited (printed on demand)
                            </p>
                          </CCol>
                        )}
                        <CCol xs={12}>
                          <CFormCheck
                            id="catalog-unlimited"
                            label="Unlimited (printed design)"
                            checked={!form.trackStock}
                            onChange={(event) =>
                              setForm((previous) => ({ ...previous, trackStock: !event.target.checked }))
                            }
                          />
                        </CCol>
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
                  {!isSubCategory && form.builderType === 'JEWELRY' && (
                    <CategorySizesEditor
                      sizes={form.sizes}
                      onChange={(sizes) => setForm((previous) => ({ ...previous, sizes }))}
                    />
                  )}
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
                  {selectedFile ? 'Saving and processing image...' : 'Saving...'}
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
