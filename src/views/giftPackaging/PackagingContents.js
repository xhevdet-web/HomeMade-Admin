import PropTypes from 'prop-types'
import { CButton, CCol, CFormCheck, CFormInput, CFormLabel, CFormSelect, CRow } from '@coreui/react'
import { formatPrice } from '../products/productHelpers'
import { bundleCount } from './packagingHelpers'

const typeKey = (type) => (type || '').trim().toLowerCase()

/**
 * What fits inside the packaging: how many items (the Gift Studio slots), which item types,
 * and suggested bundles built from the gift category's items. Saved with the packaging form.
 */
const PackagingContents = ({ form, setForm, items, itemsError, disabled }) => {
  const set = (patch) => setForm((previous) => ({ ...previous, ...patch }))
  const byId = new Map(items.map((item) => [item.id, item]))
  const capacity = Number(form.capacity) || null

  // Every type the gift items use, plus any saved type no item uses any more.
  const types = []
  const seen = new Set()
  for (const type of [...items.map((item) => item.type), ...form.allowedTypes]) {
    const key = typeKey(type)
    if (key && !seen.has(key)) {
      seen.add(key)
      types.push(type.trim())
    }
  }
  const allowed = new Set(form.allowedTypes.map(typeKey))
  const toggleType = (type) =>
    set({
      allowedTypes: allowed.has(typeKey(type))
        ? form.allowedTypes.filter((entry) => typeKey(entry) !== typeKey(type))
        : [...form.allowedTypes, type],
    })
  const fits = (item) => !allowed.size || allowed.has(typeKey(item.type))
  const choices = items.filter(fits)

  const setBundle = (index, patch) =>
    set({
      suggestedBundles: form.suggestedBundles.map((bundle, i) =>
        i === index ? { ...bundle, ...patch } : bundle,
      ),
    })
  const setRow = (index, row, patch) =>
    setBundle(index, {
      items: form.suggestedBundles[index].items.map((item, i) =>
        i === row ? { ...item, ...patch } : item,
      ),
    })

  return (
    <section className="mt-4 pt-3 border-top" aria-labelledby="packaging-contents-title">
      <h3 id="packaging-contents-title" className="h6">
        What fits inside
      </h3>
      <fieldset disabled={disabled}>
        <CRow className="g-3">
          <CCol md={4}>
            <CFormLabel htmlFor="packaging-capacity">Capacity (items)</CFormLabel>
            <CFormInput
              id="packaging-capacity"
              name="capacity"
              type="number"
              min="1"
              max="100"
              step="1"
              placeholder="No limit"
              value={form.capacity}
              onChange={(event) => set({ capacity: event.target.value })}
              aria-describedby="packaging-capacity-help"
            />
            <small id="packaging-capacity-help" className="hm-muted">
              The slots customers fill in the Gift Studio. Empty: no limit.
            </small>
          </CCol>
          <CCol md={8}>
            <span className="form-label d-block">Item types it accepts</span>
            {itemsError ? (
              <small className="text-danger">{itemsError}</small>
            ) : types.length ? (
              <div className="d-flex flex-wrap gap-3" role="group" aria-label="Item types it accepts">
                {types.map((type) => (
                  <CFormCheck
                    key={type}
                    id={`packaging-type-${typeKey(type)}`}
                    label={type}
                    checked={allowed.has(typeKey(type))}
                    onChange={() => toggleType(type)}
                  />
                ))}
              </div>
            ) : (
              <small className="hm-muted d-block">
                Give the gift items a type (e.g. Treats, Drinks) to use type rules and filters.
              </small>
            )}
            <small className="hm-muted">Leave all unticked to accept every type.</small>
          </CCol>
        </CRow>

        <div className="d-flex align-items-center justify-content-between mt-4 mb-2">
          <span className="form-label mb-0">Suggested bundles</span>
          <CButton
            color="primary"
            variant="outline"
            size="sm"
            type="button"
            disabled={!choices.length}
            onClick={() =>
              set({
                suggestedBundles: [
                  ...form.suggestedBundles,
                  { name: '', items: [{ subCategoryId: '', quantity: '1' }] },
                ],
              })
            }
          >
            Add bundle
          </CButton>
        </div>
        {!form.suggestedBundles.length && (
          <p className="hm-muted small mb-0">
            Optional. Ready combinations customers add in one tap, e.g. &ldquo;Cozy night in&rdquo;.
          </p>
        )}
        {form.suggestedBundles.map((bundle, index) => {
          // Items that no longer exist are dropped on save, so they don't count.
          const count = bundleCount({
            items: bundle.items.filter(
              (item) => itemsError || !item.subCategoryId || byId.has(item.subCategoryId),
            ),
          })
          const total = bundle.items.reduce(
            (sum, item) => sum + (byId.get(item.subCategoryId)?.price || 0) * (Number(item.quantity) || 0),
            0,
          )
          const over = capacity && count > capacity
          return (
            <div key={index} className="border rounded p-3 mb-2">
              <CRow className="g-2 align-items-end">
                <CCol sm={7}>
                  <CFormLabel htmlFor={`bundle-name-${index}`} className="small">
                    Bundle name
                  </CFormLabel>
                  <CFormInput
                    id={`bundle-name-${index}`}
                    maxLength={60}
                    placeholder="e.g. Cozy night in"
                    value={bundle.name}
                    onChange={(event) => setBundle(index, { name: event.target.value })}
                  />
                </CCol>
                <CCol sm={5} className="text-sm-end small">
                  <span className={over ? 'text-danger fw-semibold' : 'hm-muted'}>
                    {count} item{count === 1 ? '' : 's'}
                    {capacity ? ` of ${capacity}` : ''}
                  </span>
                  <span className="hm-muted"> · items {formatPrice(total)}</span>
                </CCol>
              </CRow>
              {bundle.items.map((item, row) => {
                const missing = !itemsError && item.subCategoryId && !byId.has(item.subCategoryId)
                const refused = !missing && item.subCategoryId && !fits(byId.get(item.subCategoryId))
                return (
                  <CRow key={row} className="g-2 mt-1 align-items-center">
                    <CCol xs={7}>
                      {missing ? (
                        <p className="small text-danger mb-0">
                          This item no longer exists; it is removed when you save.
                        </p>
                      ) : (
                        <CFormSelect
                          aria-label={`Item ${row + 1} of ${bundle.name || `bundle ${index + 1}`}`}
                          value={item.subCategoryId}
                          onChange={(event) => setRow(index, row, { subCategoryId: event.target.value })}
                          invalid={!!refused}
                        >
                          <option value="">Choose an item</option>
                          {items.map((choice) => (
                            <option key={choice.id} value={choice.id} disabled={!fits(choice)}>
                              {choice.name}
                              {choice.type ? ` (${choice.type})` : ''}
                              {choice.isActive === false ? ' (inactive)' : ''}
                            </option>
                          ))}
                        </CFormSelect>
                      )}
                    </CCol>
                    <CCol xs={3}>
                      {!missing && (
                        <CFormInput
                          type="number"
                          min="1"
                          max="100"
                          step="1"
                          aria-label="Quantity"
                          value={item.quantity}
                          onChange={(event) => setRow(index, row, { quantity: event.target.value })}
                        />
                      )}
                    </CCol>
                    <CCol xs={2} className="text-end">
                      <CButton
                        color="secondary"
                        variant="ghost"
                        size="sm"
                        type="button"
                        aria-label="Remove item from bundle"
                        onClick={() =>
                          setBundle(index, { items: bundle.items.filter((_, i) => i !== row) })
                        }
                      >
                        ✕
                      </CButton>
                    </CCol>
                  </CRow>
                )
              })}
              <div className="d-flex justify-content-between mt-2">
                <CButton
                  color="link"
                  size="sm"
                  type="button"
                  className="px-0"
                  onClick={() =>
                    setBundle(index, { items: [...bundle.items, { subCategoryId: '', quantity: '1' }] })
                  }
                >
                  Add item
                </CButton>
                <CButton
                  color="danger"
                  variant="ghost"
                  size="sm"
                  type="button"
                  onClick={() =>
                    set({ suggestedBundles: form.suggestedBundles.filter((_, i) => i !== index) })
                  }
                >
                  Remove bundle
                </CButton>
              </div>
            </div>
          )
        })}
      </fieldset>
    </section>
  )
}
PackagingContents.propTypes = {
  form: PropTypes.shape({
    capacity: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
    allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
    suggestedBundles: PropTypes.arrayOf(
      PropTypes.shape({
        name: PropTypes.string,
        items: PropTypes.arrayOf(
          PropTypes.shape({ subCategoryId: PropTypes.string, quantity: PropTypes.string }),
        ),
      }),
    ).isRequired,
  }).isRequired,
  setForm: PropTypes.func.isRequired,
  items: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string.isRequired,
      name: PropTypes.string,
      type: PropTypes.string,
      price: PropTypes.number,
      isActive: PropTypes.bool,
    }),
  ).isRequired,
  itemsError: PropTypes.string,
  disabled: PropTypes.bool,
}
export default PackagingContents
