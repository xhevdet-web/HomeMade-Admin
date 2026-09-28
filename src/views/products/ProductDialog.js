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
import api, { apiErrorMessage } from '../../_helpers/api'
import ImagePicker from '../../components/ImagePicker'
import { imageFormData } from '../../_helpers/imageUpload'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import ProductImage from './ProductImage'
import DesignPreview from './DesignPreview'
import ComponentEditor from './ComponentEditor'
import ComponentTable from './ComponentTable'
import { creatorName, formatPrice, productPayload, editableItems } from './productHelpers'

const initialForm = {
  productType: 'READY_MADE',
  price: '',
  stock: '',
  name: '',
  description: '',
  imageUrl: '',
  categoryId: '',
  items: [],
  isActive: true,
}
const ProductDialog = ({ action, onClose, onSaved }) => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const editing = ['create', 'edit'].includes(action.mode)
  const [form, setForm] = useState(initialForm)
  const [record, setRecord] = useState(null)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [subAttempt, setSubAttempt] = useState(0)
  const [subState, setSubState] = useState({
    categoryId: '',
    items: [],
    loading: false,
    error: null,
  })
  const [selectedFile, setSelectedFile] = useState(null)
  const submitting = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const readyMade = form.productType === 'READY_MADE'

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    Promise.all([
      action.mode === 'create'
        ? Promise.resolve(null)
        : api.get(`/products/${encodeURIComponent(action.id)}`, {
            signal: controller.signal,
          }),
      editing ? api.get('/categories', { signal: controller.signal }) : Promise.resolve(null),
    ])
      .then(([detail, options]) => {
        if (controller.signal.aborted) return
        if (options && !Array.isArray(options.data)) throw new Error('Invalid categories response')
        if (detail && (!detail.data || typeof detail.data.id !== 'string'))
          throw new Error('Invalid product response')
        const data = detail?.data
        setRecord(data)
        setCategories(options?.data || [])
        setForm(
          data
            ? {
                productType: data.productType ?? 'CUSTOM_DESIGN',
                price: (data.price / 100).toFixed(2),
                stock: String(data.stock ?? 0),
                name: data.name,
                description: data.description ?? '',
                imageUrl: data.imageUrl ?? '',
                categoryId: data.categoryId,
                items: editableItems(data.items),
                isActive: data.isActive,
              }
            : initialForm,
        )
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(error, 'Unable to load the product form. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [action.id, action.mode, editing, attempt])

  useEffect(() => {
    if (!editing || readyMade || loading || loadError || !form.categoryId) return
    const categoryId = form.categoryId
    const controller = new AbortController()
    setSubState({ categoryId, items: [], loading: true, error: null })
    api
      .get(`/categories/${encodeURIComponent(categoryId)}/sub-categories`, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid subcategory response')
        if (!controller.signal.aborted)
          setSubState({
            categoryId,
            items: data.filter((item) => item.isActive && item.categoryId === categoryId),
            loading: false,
            error: null,
          })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setSubState({
            categoryId,
            items: [],
            loading: false,
            error: apiErrorMessage(error, 'Unable to load subcategories. Please try again.'),
          })
      })
    return () => controller.abort()
  }, [form.categoryId, editing, readyMade, loading, loadError, subAttempt])

  const subReady =
    !!form.categoryId &&
    subState.categoryId === form.categoryId &&
    !subState.loading &&
    !subState.error
  const subItems = subReady ? subState.items : []
  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({
      ...previous,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'categoryId' || name === 'productType' ? { items: [] } : {}),
    }))
  }
  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current) return
    setError(null)
    if (!isAdmin) {
      setError('Only administrators can manage products.')
      return
    }
    let payload
    if (editing) {
      if (!form.name.trim()) {
        setError('Name is required.')
        return
      }
      const componentsChanged =
        action.mode === 'create' ||
        form.categoryId !== record?.categoryId ||
        JSON.stringify(editableItems(record?.items)) !== JSON.stringify(form.items)
      if (
        !readyMade &&
        componentsChanged &&
        (!categories.some((category) => category.id === form.categoryId) ||
          !subReady ||
          !form.items.length ||
          form.items.some((item) => !subItems.some((sub) => sub.id === item.subCategoryId)))
      ) {
        setError('Select an available category and active components for every row.')
        return
      }
      if (readyMade && !categories.some((category) => category.id === form.categoryId)) {
        setError('Select an available category.')
        return
      }
      if (readyMade && action.mode === 'create' && !selectedFile) {
        setError('Choose an image for the ready-made product.')
        return
      }
      try {
        payload = productPayload(form)
        if (action.mode === 'edit' && !componentsChanged) {
          delete payload.items
          delete payload.categoryId
        }
        if (action.mode === 'edit') delete payload.productType
      } catch (error) {
        setError(error.message)
        return
      }
    }
    submitting.current = true
    setSaving(true)
    try {
      let saved
      if (action.mode === 'delete') await api.delete(`/products/${encodeURIComponent(action.id)}`)
      else if (action.mode === 'create')
        saved = await api.post('/products', imageFormData(payload, selectedFile), {
          timeout: selectedFile ? 120000 : 15000,
        })
      else
        saved = await api.patch(
          `/products/${encodeURIComponent(action.id)}`,
          imageFormData(payload, selectedFile),
          { timeout: selectedFile ? 120000 : 15000 },
        )
      if (saved) {
        setRecord(saved.data)
        setSelectedFile(null)
      }
      onSaved(
        `Product ${action.mode === 'delete' ? 'deleted' : action.mode === 'create' ? 'created' : 'updated'} successfully.`,
        saved?.data,
      )
    } catch (error) {
      setError(
        apiErrorMessage(error) +
          (error.response?.status === 409 && action.mode === 'edit'
            ? ' Create a new design to use different components.'
            : ''),
      )
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }
  const input = (name, label, props = {}) => (
    <CCol md={6}>
      <CFormLabel htmlFor={`product-${name}`}>{label}</CFormLabel>
      <CFormInput
        id={`product-${name}`}
        name={name}
        value={form[name]}
        onChange={change}
        {...props}
      />
    </CCol>
  )
  const title = {
    create: 'Add Product',
    edit: 'Edit Product',
    view: 'Product details',
    delete: 'Delete Product',
  }[action.mode]
  const fields = record
    ? [
        ['Name', record.name],
        ['Description', record.description || 'Not provided'],
        ['Category', record.category?.name || 'Unavailable category'],
        ['Product type', record.productType === 'READY_MADE' ? 'Ready-made' : 'Custom design'],
        ['Creator', creatorName(record.createdBy)],
        ['Item count', record.itemCount],
        ['Price', formatPrice(record.price)],
        ...(record.productType === 'READY_MADE' ? [['Available stock', record.stock]] : []),
        ['Status', record.isActive ? 'Active' : 'Inactive'],
      ]
    : []
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
      aria-labelledby="product-dialog-title"
      className="hm-catalog-modal"
    >
      <CModalHeader closeButton={!saving}>
        <CModalTitle id="product-dialog-title">{title}</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={submit}>
        <CModalBody>
          {loading ? (
            <div className="hm-empty" role="status">
              <CSpinner aria-hidden="true" />
              <p>Loading product...</p>
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
                  {record?.productType !== 'READY_MADE' && (
                    <section className="hm-order-section">
                      <h3>Customer design</h3>
                      <DesignPreview src={record?.designPreviewUrl} name={record?.name} large />
                    </section>
                  )}
                  <h3>Catalog image</h3>
                  <ProductImage src={record?.imageUrl} name={record?.name} transparent large />
                  <dl className="hm-catalog-details">
                    {fields.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {record?.items?.length > 0 && <ComponentTable items={record.items} />}
                </>
              ) : action.mode === 'delete' ? (
                <>
                  <p>
                    Delete <strong>{record?.name}</strong>?
                  </p>
                  <p>This action cannot be undone.</p>
                </>
              ) : (
                <fieldset disabled={saving || !isAdmin}>
                  <CRow className="g-3">
                    {action.mode === 'create' && (
                      <CCol xs={12}>
                        <CFormLabel htmlFor="product-productType">Product type</CFormLabel>
                        <CFormSelect
                          id="product-productType"
                          name="productType"
                          value={form.productType}
                          onChange={change}
                        >
                          <option value="READY_MADE">Ready-made product</option>
                          <option value="CUSTOM_DESIGN">Custom design</option>
                        </CFormSelect>
                      </CCol>
                    )}
                    <CCol md={6}>
                      <CFormLabel htmlFor="product-categoryId">Category</CFormLabel>
                      <CFormSelect
                        id="product-categoryId"
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
                              Category no longer available
                            </option>
                          )}
                        {categories.map((category) => (
                          <option value={category.id} key={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </CFormSelect>
                      {!categories.length && (
                        <p className="mt-2">Create a category before adding a product.</p>
                      )}
                    </CCol>
                    {!readyMade && (
                      <CCol xs={12}>
                        <ComponentEditor
                          items={form.items}
                          options={subItems}
                          ready={subReady}
                          onChange={(items) => setForm((previous) => ({ ...previous, items }))}
                        />
                      </CCol>
                    )}
                    {!readyMade &&
                      form.categoryId &&
                      subState.categoryId === form.categoryId &&
                      subState.error && (
                        <CCol xs={12}>
                          <CAlert color="danger" role="alert">
                            {subState.error}{' '}
                            <CButton
                              color="link"
                              onClick={() => setSubAttempt((value) => value + 1)}
                            >
                              Retry subcategories
                            </CButton>
                          </CAlert>
                        </CCol>
                      )}
                    <CCol xs={12}>
                      <ImagePicker
                        id="entity-image"
                        file={selectedFile}
                        onChange={setSelectedFile}
                        imageUrl={record?.imageUrl}
                        name={form.name}
                        required={readyMade && action.mode === 'create'}
                        processBackground
                      />
                    </CCol>
                    {readyMade &&
                      input('price', 'Price (€)', {
                        required: true,
                        type: 'number',
                        min: '0',
                        step: '0.01',
                      })}
                    {readyMade &&
                      input('stock', 'Available stock', {
                        required: true,
                        type: 'number',
                        min: '0',
                        max: '2147483647',
                        step: '1',
                      })}
                    {input('name', 'Name', { required: true, maxLength: 200 })}
                    <CCol xs={12}>
                      <CFormLabel htmlFor="product-description">Description</CFormLabel>
                      <CFormTextarea
                        id="product-description"
                        name="description"
                        rows={3}
                        value={form.description}
                        onChange={change}
                      />
                    </CCol>
                    <CCol xs={12}>
                      <CFormCheck
                        id="product-isActive"
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
            type="button"
            color="secondary"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            {action.mode === 'view' ? 'Close' : 'Cancel'}
          </CButton>
          {action.mode !== 'view' && (
            <CButton
              type="submit"
              color={action.mode === 'delete' ? 'danger' : 'primary'}
              disabled={
                saving ||
                loading ||
                !!loadError ||
                !isAdmin ||
                (action.mode === 'create' &&
                  !readyMade &&
                  (!subReady || !form.items.length || !subItems.length))
              }
            >
              {saving ? (
                <>
                  <CSpinner size="sm" aria-hidden="true" className="me-2" />
                  {action.mode === 'delete'
                    ? 'Deleting...'
                    : selectedFile
                      ? 'Saving and processing image...'
                      : 'Saving...'}
                </>
              ) : action.mode === 'delete' ? (
                'Delete Product'
              ) : (
                'Save Product'
              )}
            </CButton>
          )}
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
ProductDialog.propTypes = {
  action: PropTypes.shape({
    mode: PropTypes.oneOf(['create', 'edit', 'view', 'delete']).isRequired,
    id: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
export default ProductDialog
