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
import { validateImageFile } from '../../_helpers/imageUpload'
import ImagePicker from '../../components/ImagePicker'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import PrintAreaEditor from '../apparel/PrintAreaEditor'
import ProductImage from './ProductImage'
import DesignPreview from './DesignPreview'
import ComponentTable from './ComponentTable'
import SizeInventoryEditor from './SizeInventoryEditor'
import {
  companyPayload,
  creatorName,
  emptyProductForm,
  formatPrice,
  isApparel,
  isCompany,
  originLabels,
  productDate,
  productForm,
  productFormData,
} from './productHelpers'
import { packagingLabel } from '../giftPackaging/packagingHelpers'
import CaseTemplateEditor from '../cases/CaseTemplateEditor'
import { brandLabel, deviceBrands, isCase } from '../cases/caseHelpers'
import { sizeLabel } from '../orders/orderHelpers'

const useObjectUrl = (file) => {
  const [url, setUrl] = useState(null)
  useEffect(() => {
    if (!file) {
      setUrl(null)
      return
    }
    const next = URL.createObjectURL(file)
    setUrl(next)
    return () => URL.revokeObjectURL(next)
  }, [file])
  return url
}

/**
 * Admins create and edit COMPANY products (catalog). CUSTOMER products are designs saved
 * from the app: admins can review them, rename, deactivate or delete them, but never
 * change their components, price or the piece they were made on.
 */
const ProductDialog = ({ action, categories, categoryId, onClose, onSaved }) => {
  const { userData } = useAuthSelector()
  const isAdmin = userData?.role === 'ADMIN'
  const [record, setRecord] = useState(null)
  const [form, setForm] = useState(() =>
    emptyProductForm(
      categoryId,
      isApparel(categories.find((category) => category.id === categoryId)),
    ),
  )
  const [loading, setLoading] = useState(action.mode !== 'create')
  const [loadError, setLoadError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [image, setImage] = useState(null)
  const [backImage, setBackImage] = useState(null)
  const [overlayImage, setOverlayImage] = useState(null)
  const [removeOverlay, setRemoveOverlay] = useState(false)
  const submitting = useRef(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const imagePreview = useObjectUrl(image)
  const backPreview = useObjectUrl(backImage)
  const overlayPreview = useObjectUrl(overlayImage)

  useEffect(() => {
    if (action.mode === 'create') return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    api
      .get(`/products/${encodeURIComponent(action.id)}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!data || typeof data.id !== 'string') throw new Error('Invalid product response')
        if (controller.signal.aborted) return
        setRecord(data)
        setForm(productForm(data))
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setLoadError(apiErrorMessage(error, 'Unable to load the product. Please try again.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [action.id, action.mode, attempt])

  const company = action.mode === 'create' || isCompany(record)
  const category = categories.find((entry) => entry.id === form.categoryId)
  const apparel = isApparel(category ?? record?.category)
  // Phone case models: one product per model, with its own template and overlay.
  const phoneCase = isCase(category ?? record?.category)
  const silhouette = (category ?? record?.category)?.builderConfig?.silhouette
  const frontSrc = imagePreview || record?.imageUrl
  const backSrc = backPreview || record?.backImageUrl || frontSrc
  const setField = (name) => (value) => setForm((previous) => ({ ...previous, [name]: value }))
  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
  }
  const changeCategory = (event) => {
    const next = categories.find((entry) => entry.id === event.target.value)
    setForm((previous) => {
      // Apparel is sold in sizes by default; untouched defaults follow the category.
      const untouched = !previous.sizes.some((row) => Number(row.stock) > 0)
      const defaults = emptyProductForm(event.target.value, isApparel(next))
      return {
        ...previous,
        categoryId: event.target.value,
        ...(untouched && action.mode === 'create'
          ? { sized: defaults.sized, sizes: defaults.sizes, frontEnabled: defaults.frontEnabled }
          : {}),
      }
    })
  }

  const submit = async (event) => {
    event.preventDefault()
    if (submitting.current) return
    setError(null)
    if (!isAdmin) {
      setError('Only administrators can manage products.')
      return
    }
    let request
    try {
      if (action.mode === 'delete')
        request = () => api.delete(`/products/${encodeURIComponent(action.id)}`)
      else if (!company) {
        // Customer designs: only their name, description and visibility are editable.
        if (!form.name.trim()) throw new Error('Name is required.')
        const body = {
          name: form.name.trim(),
          description: form.description.trim() || null,
          isActive: form.isActive,
        }
        request = () => api.patch(`/products/${encodeURIComponent(action.id)}`, productFormData(body))
      } else {
        if (!categories.some((entry) => entry.id === form.categoryId))
          throw new Error('Select a category.')
        if (action.mode === 'create' && !image) throw new Error('Choose an image for the product.')
        for (const file of [image, backImage, overlayImage]) {
          const invalid = validateImageFile(file)
          if (invalid) throw new Error(invalid)
        }
        if (phoneCase && overlayImage && overlayImage.type !== 'image/png')
          throw new Error('The overlay must be a transparent PNG.')
        const fields = companyPayload(form, apparel, phoneCase)
        // Case templates stay untouched so the overlay and areas line up with them.
        if (phoneCase && image) fields.removeBackground = false
        if (phoneCase && removeOverlay && !overlayImage && action.mode === 'edit')
          fields.removeOverlay = true
        const files = {
          file: image,
          ...(apparel ? { backImage } : {}),
          ...(phoneCase ? { overlayImage } : {}),
        }
        const timeout = image || backImage || overlayImage ? 120000 : 15000
        request =
          action.mode === 'create'
            ? () =>
                api.post('/products', productFormData({ ...fields, origin: 'COMPANY' }, files), {
                  timeout,
                })
            : () =>
                api.patch(
                  `/products/${encodeURIComponent(action.id)}`,
                  productFormData(fields, files),
                  { timeout },
                )
      }
    } catch (validationError) {
      setError(validationError.message)
      return
    }
    submitting.current = true
    setSaving(true)
    try {
      const saved = await request()
      onSaved(
        `Product ${action.mode === 'delete' ? 'deleted' : action.mode === 'create' ? 'created' : 'updated'} successfully.`,
        saved?.data,
      )
    } catch (error) {
      setError(apiErrorMessage(error))
    } finally {
      submitting.current = false
      setSaving(false)
    }
  }

  const title = {
    create: 'Add Product',
    edit: company ? 'Edit Product' : 'Edit customer design',
    view: 'Product details',
    delete: 'Delete Product',
  }[action.mode]
  const details = record
    ? [
        ['Origin', originLabels[record.origin] || record.origin],
        ['Category', record.category?.name || 'Unavailable category'],
        ...(company
          ? [
              ['Price', formatPrice(record.price)],
              ...(record.deviceBrand ? [['Brand', brandLabel(record.deviceBrand)]] : []),
              ...(record.color ? [['Colour', record.color]] : []),
              ...(record.sizes?.length ? [] : [['Available stock', record.stock]]),
            ]
          : [
              ['Customer', creatorName(record.createdBy)],
              ...(record.baseProduct ? [['Made on', record.baseProduct.name]] : []),
              ...(record.selectedSize?.name ? [['Size', sizeLabel(record.selectedSize)]] : []),
              ...(packagingLabel(record) ? [['Gift packaging', packagingLabel(record)]] : []),
              [
                'Calculated price',
                record.basePrice || record.packagingPrice
                  ? `${formatPrice(record.price)} (${[
                      record.basePrice ? `${formatPrice(record.basePrice)} base` : null,
                      record.packagingPrice ? `${formatPrice(record.packagingPrice)} packaging` : null,
                      'components',
                    ]
                      .filter(Boolean)
                      .join(' + ')})`
                  : formatPrice(record.price),
              ],
              ['Components', record.itemCount],
            ]),
        ['Created', productDate(record.createdAt)],
        ['Status', record.isActive ? 'Active' : 'Inactive'],
      ]
    : []
  const textFields = (
    <>
      <CCol md={6}>
        <CFormLabel htmlFor="product-name">Name</CFormLabel>
        <CFormInput
          id="product-name"
          name="name"
          required
          maxLength={200}
          value={form.name}
          onChange={change}
          placeholder={
            apparel ? 'e.g. Black Essential Hoodie' : phoneCase ? 'e.g. iPhone 14' : undefined
          }
        />
      </CCol>
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
    </>
  )
  const activeField = (
    <CCol xs={12}>
      <CFormCheck
        id="product-isActive"
        name="isActive"
        label="Active"
        checked={form.isActive}
        onChange={change}
      />
    </CCol>
  )

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
                  {company ? (
                    <div className="hm-apparel-previews">
                      <figure>
                        <figcaption>{record?.backImageUrl ? 'Front' : 'Product image'}</figcaption>
                        <ProductImage src={record?.imageUrl} name={record?.name} transparent large />
                      </figure>
                      {record?.overlayImageUrl && (
                        <figure>
                          <figcaption>Overlay</figcaption>
                          <ProductImage
                            src={record.overlayImageUrl}
                            name={`${record.name} overlay`}
                            transparent
                            large
                          />
                        </figure>
                      )}
                      {record?.backImageUrl && (
                        <figure>
                          <figcaption>Back</figcaption>
                          <ProductImage
                            src={record.backImageUrl}
                            name={`${record.name} back`}
                            transparent
                            large
                          />
                        </figure>
                      )}
                    </div>
                  ) : (
                    <section className="hm-order-section">
                      <h3>Customer design</h3>
                      <div className="hm-apparel-previews">
                        <figure>
                          {record?.backDesignPreviewUrl && <figcaption>Front</figcaption>}
                          <DesignPreview src={record?.designPreviewUrl} name={record?.name} large />
                        </figure>
                        {record?.backDesignPreviewUrl && (
                          <figure>
                            <figcaption>Back</figcaption>
                            <DesignPreview
                              src={record.backDesignPreviewUrl}
                              name={`${record.name} back`}
                              large
                            />
                          </figure>
                        )}
                      </div>
                    </section>
                  )}
                  <h3 className="mt-3">{record?.name}</h3>
                  {record?.description && <p className="hm-muted">{record.description}</p>}
                  <dl className="hm-catalog-details">
                    {details.map(([label, value]) => (
                      <div key={label}>
                        <dt>{label}</dt>
                        <dd>{value}</dd>
                      </div>
                    ))}
                  </dl>
                  {company && record?.sizes?.length > 0 && (
                    <table className="table table-sm hm-table">
                      <caption>Stock per size</caption>
                      <thead>
                        <tr>
                          <th scope="col">Size</th>
                          <th scope="col">Stock</th>
                        </tr>
                      </thead>
                      <tbody>
                        {record.sizes.map((entry) => (
                          <tr key={entry.size}>
                            <td>{entry.size}</td>
                            <td>{entry.stock < 1 ? 'Sold out' : entry.stock}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                  {record?.items?.length > 0 && <ComponentTable items={record.items} />}
                </>
              ) : action.mode === 'delete' ? (
                <>
                  <p>
                    Delete <strong>{record?.name}</strong>?
                  </p>
                  <p>
                    This action cannot be undone. Products that have orders, or that customers
                    designed on, cannot be deleted; deactivate them instead.
                  </p>
                </>
              ) : !company ? (
                <fieldset disabled={saving || !isAdmin}>
                  <CAlert color="info">
                    This design was created by {creatorName(record?.createdBy)} in the app. Its
                    components, size and price stay as the customer saved them.
                  </CAlert>
                  <CRow className="g-3">
                    {textFields}
                    {activeField}
                  </CRow>
                </fieldset>
              ) : (
                <fieldset disabled={saving || !isAdmin}>
                  <CRow className="g-3">
                    <CCol md={6}>
                      <CFormLabel htmlFor="product-categoryId">Category</CFormLabel>
                      <CFormSelect
                        id="product-categoryId"
                        name="categoryId"
                        required
                        value={form.categoryId}
                        onChange={changeCategory}
                      >
                        <option value="">Select a category</option>
                        {categories.map((entry) => (
                          <option value={entry.id} key={entry.id}>
                            {entry.name}
                          </option>
                        ))}
                      </CFormSelect>
                    </CCol>
                    {textFields}
                    <CCol md={6}>
                      <CFormLabel htmlFor="product-price">Price (€)</CFormLabel>
                      <CFormInput
                        id="product-price"
                        name="price"
                        required
                        type="number"
                        min="0"
                        step="0.01"
                        value={form.price}
                        onChange={change}
                      />
                    </CCol>
                    {phoneCase && (
                      <>
                        <CCol md={3}>
                          <CFormLabel htmlFor="product-deviceBrand">Brand</CFormLabel>
                          <CFormSelect
                            id="product-deviceBrand"
                            name="deviceBrand"
                            required
                            value={form.deviceBrand}
                            onChange={change}
                          >
                            <option value="">Select a brand</option>
                            {form.deviceBrand && !deviceBrands[form.deviceBrand] && (
                              <option value={form.deviceBrand}>{brandLabel(form.deviceBrand)}</option>
                            )}
                            {Object.entries(deviceBrands).map(([value, label]) => (
                              <option value={value} key={value}>
                                {label}
                              </option>
                            ))}
                          </CFormSelect>
                        </CCol>
                        <CCol md={3}>
                          <CFormLabel htmlFor="product-sortOrder">Sort order</CFormLabel>
                          <CFormInput
                            id="product-sortOrder"
                            name="sortOrder"
                            type="number"
                            min="0"
                            step="1"
                            value={form.sortOrder}
                            onChange={change}
                            aria-describedby="product-sortOrder-help"
                          />
                          <small id="product-sortOrder-help" className="hm-muted">
                            Lower shows first within its brand.
                          </small>
                        </CCol>
                      </>
                    )}
                    {apparel && (
                      <CCol md={6}>
                        <CFormLabel htmlFor="product-color">Colour</CFormLabel>
                        <div className="d-flex gap-2">
                          <CFormInput
                            id="product-color"
                            name="color"
                            maxLength={60}
                            placeholder="e.g. Black"
                            value={form.color}
                            onChange={change}
                          />
                          <CFormInput
                            type="color"
                            aria-label="Colour swatch"
                            className="form-control-color"
                            value={form.colorHex}
                            onChange={(event) => setField('colorHex')(event.target.value)}
                          />
                        </div>
                        <small className="hm-muted">
                          One product is one colour. Sell another colour as its own product.
                        </small>
                      </CCol>
                    )}
                    <CCol xs={12}>
                      <CFormCheck
                        id="product-sized"
                        label="Sold in sizes (stock per size)"
                        checked={form.sized}
                        onChange={(event) => setField('sized')(event.target.checked)}
                      />
                    </CCol>
                    <CCol xs={12}>
                      {form.sized ? (
                        <SizeInventoryEditor rows={form.sizes} onChange={setField('sizes')} />
                      ) : (
                        <CCol md={6} className="p-0">
                          <CFormLabel htmlFor="product-stock">Available stock</CFormLabel>
                          <CFormInput
                            id="product-stock"
                            name="stock"
                            required
                            type="number"
                            min="0"
                            max="2147483647"
                            step="1"
                            value={form.stock}
                            onChange={change}
                          />
                        </CCol>
                      )}
                    </CCol>
                    <CCol md={apparel || phoneCase ? 6 : 12}>
                      <ImagePicker
                        id="product-image"
                        file={image}
                        onChange={setImage}
                        imageUrl={record?.imageUrl}
                        name={form.name}
                        required={action.mode === 'create'}
                        processBackground={!phoneCase}
                        label={
                          apparel
                            ? 'Product image (front)'
                            : phoneCase
                              ? 'Case template (required)'
                              : undefined
                        }
                        hint={
                          phoneCase
                            ? 'The empty back of this exact model, ideally a transparent PNG. Stored untouched.'
                            : undefined
                        }
                      />
                    </CCol>
                    {phoneCase && (
                      <CCol md={6}>
                        <ImagePicker
                          id="product-overlay-image"
                          file={overlayImage}
                          onChange={setOverlayImage}
                          imageUrl={record?.overlayImageUrl}
                          name={`${form.name} overlay`}
                          label="Overlay (optional)"
                          hint="Transparent PNG the same size as the template: only the edges and camera island visible, drawn above the customer image. Most models do not need one."
                        />
                        {record?.overlayImageUrl && !overlayImage && (
                          <CFormCheck
                            className="mt-2"
                            id="product-remove-overlay"
                            label="Remove the current overlay"
                            checked={removeOverlay}
                            onChange={(event) => setRemoveOverlay(event.target.checked)}
                          />
                        )}
                      </CCol>
                    )}
                    {apparel && (
                      <CCol md={6}>
                        <ImagePicker
                          id="product-back-image"
                          file={backImage}
                          onChange={setBackImage}
                          imageUrl={record?.backImageUrl}
                          name={`${form.name} back`}
                          processBackground
                          label="Back image (optional)"
                          hint="Used as the studio canvas for designs on the back."
                        />
                      </CCol>
                    )}
                    {activeField}
                  </CRow>
                  {phoneCase && (
                    <section className="mt-4" aria-label="Case template">
                      <CaseTemplateEditor
                        src={imagePreview || record?.imageUrl}
                        overlaySrc={overlayPreview || (removeOverlay ? null : record?.overlayImageUrl)}
                        area={form.caseArea}
                        camera={form.cameraArea}
                        cameraEnabled={form.cameraEnabled}
                        onAreaChange={setField('caseArea')}
                        onCameraChange={setField('cameraArea')}
                        onCameraEnabled={setField('cameraEnabled')}
                      />
                    </section>
                  )}
                  {apparel && (
                    <section className="mt-4" aria-label="Print areas">
                      <h4>Studio print areas</h4>
                      <p className="hm-muted small">
                        Where customers may place designs on this product in the Creative Studio.
                      </p>
                      <PrintAreaEditor
                        side="front"
                        label="Front"
                        src={frontSrc}
                        silhouette={silhouette}
                        enabled={form.frontEnabled}
                        area={form.frontPrintArea}
                        onEnabled={setField('frontEnabled')}
                        onChange={setField('frontPrintArea')}
                      />
                      <PrintAreaEditor
                        side="back"
                        label="Back"
                        src={backSrc}
                        silhouette={silhouette}
                        enabled={form.backEnabled}
                        area={form.backPrintArea}
                        onEnabled={setField('backEnabled')}
                        onChange={setField('backPrintArea')}
                      />
                    </section>
                  )}
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
              disabled={saving || loading || !!loadError || !isAdmin}
            >
              {saving ? (
                <>
                  <CSpinner size="sm" aria-hidden="true" className="me-2" />
                  {action.mode === 'delete'
                    ? 'Deleting...'
                    : image || backImage || overlayImage
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
  categories: PropTypes.array.isRequired,
  categoryId: PropTypes.string,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
export default ProductDialog
