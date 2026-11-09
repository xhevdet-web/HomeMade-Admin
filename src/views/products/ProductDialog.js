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
import BackgroundRemovalOption, {
  BACKGROUND_REMOVAL_TIMEOUT,
  removesBackground,
  useBackgroundRemovalStatus,
} from '../../components/BackgroundRemovalOption'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import PrintAreaEditor from '../apparel/PrintAreaEditor'
import MugPrintFields from './MugPrintFields'
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
  isMug,
  isCompany,
  originLabels,
  phoneModelGroups,
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
  // Opt-in background removal for new product photos (never for case templates).
  const [removeBackground, setRemoveBackground] = useState(false)
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
  // Phone case products: a phone model (template, overlay, printable area) customers
  // design on, or a ready-made case sold as it is, linked to the model it fits.
  const phoneCase = isCase(category ?? record?.category)
  const readyMadeCase = phoneCase && form.readyMadeCase
  const phoneModel = phoneCase && !form.readyMadeCase
  const mug = isMug(category ?? record?.category)
  const editing = (action.mode === 'create' || action.mode === 'edit') && company
  const newPhoto = !!(image || (apparel && backImage))
  const backgroundRemoval = useBackgroundRemovalStatus(editing && newPhoto && !phoneModel)
  const removingPreview = removesBackground(removeBackground, backgroundRemoval)

  // The phone models of this category, for the "Fits phone model" select.
  const [models, setModels] = useState({ categoryId: null, list: [], loading: false, error: null })
  const [modelsAttempt, setModelsAttempt] = useState(0)
  const modelsCategoryId = editing && readyMadeCase ? form.categoryId : null
  useEffect(() => {
    if (!modelsCategoryId) return
    const controller = new AbortController()
    setModels({ categoryId: modelsCategoryId, list: [], loading: true, error: null })
    api
      .get('/products', {
        params: { categoryId: modelsCategoryId, origin: 'COMPANY' },
        signal: controller.signal,
      })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid products response')
        if (controller.signal.aborted) return
        setModels({
          categoryId: modelsCategoryId,
          list: data.filter((product) => !product.baseProductId && product.printAreas?.front),
          loading: false,
          error: null,
        })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setModels({
            categoryId: modelsCategoryId,
            list: [],
            loading: false,
            error: apiErrorMessage(error, 'Unable to load the phone models. Please try again.'),
          })
      })
    return () => controller.abort()
  }, [modelsCategoryId, modelsAttempt])
  const modelGroups = phoneModelGroups(
    models.categoryId === form.categoryId ? models.list : [],
    record,
  )
  const chooseModel = (event) => {
    const id = event.target.value
    const model = modelGroups.flatMap(([, list]) => list).find((entry) => entry.id === id)
    setForm((previous) => ({
      ...previous,
      baseProductId: id,
      // The brand follows the model it fits, unless one was chosen already.
      deviceBrand: previous.deviceBrand || model?.deviceBrand || '',
    }))
  }
  const silhouette = (category ?? record?.category)?.builderConfig?.silhouette
  const frontSrc = imagePreview || record?.imageUrl
  const backSrc = backPreview || record?.backImageUrl || frontSrc
  const setField = (name) => (value) => setForm((previous) => ({ ...previous, [name]: value }))
  const change = (event) => {
    const { name, value, type, checked } = event.target
    setForm((previous) => ({ ...previous, [name]: type === 'checkbox' ? checked : value }))
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
          throw new Error('This category is no longer available.')
        if (action.mode === 'create' && !image) throw new Error('Choose an image for the product.')
        for (const file of [image, apparel && backImage, phoneModel && overlayImage]) {
          const invalid = validateImageFile(file)
          if (invalid) throw new Error(invalid)
        }
        if (phoneModel && overlayImage && overlayImage.type !== 'image/png')
          throw new Error('The overlay must be a transparent PNG.')
        const fields = companyPayload(form, apparel, phoneCase, mug, record)
        // Case templates stay untouched so the overlay and areas line up with them. Other
        // product photos get background removal only when the admin ticks it.
        const removing = newPhoto && !phoneModel && removingPreview
        if (removing) fields.removeBackground = true
        else if (phoneModel && image) fields.removeBackground = false
        if (phoneModel && removeOverlay && !overlayImage && action.mode === 'edit')
          fields.removeOverlay = true
        const files = {
          file: image,
          ...(apparel ? { backImage } : {}),
          ...(phoneModel ? { overlayImage } : {}),
        }
        const timeout = removing
          ? BACKGROUND_REMOVAL_TIMEOUT
          : image || (apparel && backImage) || (phoneModel && overlayImage)
            ? 120000
            : 15000
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
    create: category ? `Add ${category.name} product` : 'Add Product',
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
              ...(phoneCase
                ? [['Kind', record.baseProductId ? 'Ready-made case' : 'Phone model']]
                : []),
              ...(record.baseProduct ? [['Fits', record.baseProduct.name]] : []),
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
      <CCol xs={12}>
        <CFormLabel htmlFor="product-name">Name</CFormLabel>
        <CFormInput
          id="product-name"
          name="name"
          required
          maxLength={200}
          value={form.name}
          onChange={change}
          placeholder={
            apparel
              ? 'e.g. Black Essential Hoodie'
              : readyMadeCase
                ? 'e.g. iPhone 15 – Marble'
                : phoneCase
                  ? 'e.g. iPhone 14'
                  : undefined
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
                    {/* The category comes from the page it was opened on and never changes here. */}
                    <CCol xs={12}>
                      <p className="hm-form-context mb-0">
                        Category <strong>{category?.name || record?.category?.name || '—'}</strong>
                      </p>
                    </CCol>
                    {textFields}
                    {phoneCase && (
                      <CCol xs={12}>
                        <fieldset aria-describedby="product-case-kind-help">
                          <legend className="form-label fs-6 mb-1">Kind of phone case product</legend>
                          <CFormCheck
                            inline
                            type="radio"
                            name="caseKind"
                            id="product-case-kind-model"
                            label="Phone model (customers design on it)"
                            checked={!form.readyMadeCase}
                            onChange={() => setField('readyMadeCase')(false)}
                          />
                          <CFormCheck
                            inline
                            type="radio"
                            name="caseKind"
                            id="product-case-kind-ready"
                            label="Ready-made case (sold as it is)"
                            checked={form.readyMadeCase}
                            onChange={() => setField('readyMadeCase')(true)}
                          />
                          <p id="product-case-kind-help" className="hm-muted small mt-1 mb-0">
                            {form.readyMadeCase
                              ? 'A finished printed case with its own photo, price and stock, linked to the phone model it fits.'
                              : 'The blank of one phone model in the Case Studio: its template, printable area and camera opening.'}
                          </p>
                        </fieldset>
                      </CCol>
                    )}
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
                        {readyMadeCase && (
                          <CCol md={6}>
                            <CFormLabel htmlFor="product-baseProductId">Fits phone model</CFormLabel>
                            <CFormSelect
                              id="product-baseProductId"
                              name="baseProductId"
                              required
                              disabled={models.loading}
                              value={form.baseProductId}
                              onChange={chooseModel}
                              aria-describedby="product-baseProductId-help"
                            >
                              <option value="">
                                {models.loading ? 'Loading phone models...' : 'Select a phone model'}
                              </option>
                              {/* The current link, should it no longer be listed. */}
                              {form.baseProductId &&
                                form.baseProductId === record?.baseProduct?.id &&
                                !modelGroups.some(([, list]) =>
                                  list.some((model) => model.id === form.baseProductId),
                                ) && (
                                  <option value={form.baseProductId}>{record.baseProduct.name}</option>
                                )}
                              {modelGroups.map(([brand, list]) => (
                                <optgroup label={brand} key={brand}>
                                  {list.map((model) => (
                                    <option
                                      value={model.id}
                                      key={model.id}
                                      // Inactive models keep their cases but take no new ones.
                                      disabled={!model.isActive && model.id !== record?.baseProductId}
                                    >
                                      {model.name}
                                      {model.isActive ? '' : ' (inactive)'}
                                    </option>
                                  ))}
                                </optgroup>
                              ))}
                            </CFormSelect>
                            {models.error ? (
                              <small id="product-baseProductId-help" className="text-danger">
                                {models.error}{' '}
                                <CButton
                                  color="link"
                                  size="sm"
                                  className="p-0 align-baseline"
                                  onClick={() => setModelsAttempt((value) => value + 1)}
                                >
                                  Try again
                                </CButton>
                              </small>
                            ) : (
                              <small id="product-baseProductId-help" className="hm-muted">
                                {!models.loading && !modelGroups.length
                                  ? 'Add a phone model to this category first.'
                                  : 'The phone model this case is made for.'}
                              </small>
                            )}
                          </CCol>
                        )}
                        <CCol md={3}>
                          <CFormLabel htmlFor="product-deviceBrand">
                            {readyMadeCase ? 'Brand (optional)' : 'Brand'}
                          </CFormLabel>
                          <CFormSelect
                            id="product-deviceBrand"
                            name="deviceBrand"
                            required={phoneModel}
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
                    <CCol md={apparel || phoneModel ? 6 : 12}>
                      <ImagePicker
                        id="product-image"
                        file={image}
                        onChange={setImage}
                        imageUrl={record?.imageUrl}
                        name={form.name}
                        required={action.mode === 'create'}
                        processBackground={!phoneModel && removingPreview}
                        label={
                          apparel
                            ? 'Product image (front)'
                            : phoneModel
                              ? 'Case template (required)'
                              : readyMadeCase
                                ? `Photo of the finished case${action.mode === 'create' ? ' (required)' : ''}`
                                : undefined
                        }
                        hint={
                          phoneModel
                            ? 'The empty back of this exact model, ideally a transparent PNG. Stored untouched.'
                            : undefined
                        }
                      />
                    </CCol>
                    {phoneModel && (
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
                          processBackground={removingPreview}
                          label="Back image (optional)"
                          hint="Used as the studio canvas for designs on the back."
                        />
                      </CCol>
                    )}
                    {newPhoto && !phoneModel && (
                      <CCol xs={12}>
                        <BackgroundRemovalOption
                          id="product-removeBackground"
                          checked={removeBackground}
                          onChange={setRemoveBackground}
                          status={backgroundRemoval}
                          hint="Optional and slower (can take a few minutes). Applies to the new product photos above."
                        />
                      </CCol>
                    )}
                    {activeField}
                  </CRow>
                  {phoneModel && (
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
                  {mug && (
                    <MugPrintFields
                      blank={form.mugBlank}
                      print={form.mugPrint}
                      onBlank={setField('mugBlank')}
                      onChange={setField('mugPrint')}
                    />
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
                    : image || (apparel && backImage) || (phoneModel && overlayImage)
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
