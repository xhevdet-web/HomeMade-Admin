import PropTypes from 'prop-types'
import { CButton, CFormInput, CFormLabel } from '@coreui/react'
import ProductImage from './ProductImage'
import { formatPrice } from './productHelpers'
const ComponentEditor = ({ items, options, ready, onChange }) => {
  const update = (index, patch) =>
    onChange(items.map((item, i) => (i === index ? { ...item, ...patch } : item)))
  const complete =
    items.length > 0 &&
    items.every(
      (item) =>
        options.some((option) => option.id === item.subCategoryId) &&
        Number.isInteger(Number(item.quantity)) &&
        Number(item.quantity) > 0,
    )
  const total = items.reduce(
    (sum, item) =>
      sum +
      Number(item.quantity) *
        (options.find((option) => option.id === item.subCategoryId)?.price || 0),
    0,
  )
  return (
    <section className="hm-components-editor">
      <div className="d-flex justify-content-between align-items-center gap-2 mb-3">
        <h3>Components</h3>
        <CButton
          type="button"
          color="primary"
          variant="outline"
          disabled={!ready || !options.length || items.length >= 1000}
          onClick={() => onChange([...items, { subCategoryId: '', quantity: 1, position: '' }])}
        >
          Add Component
        </CButton>
      </div>
      <p>
        Saving a design does not reserve stock. Prices below are estimates from the current catalog.
      </p>
      {!ready && <p>Select a category and wait for its components to load.</p>}
      {ready && !options.length && (
        <p>
          This category has no active components. Choose another category or activate a component.
        </p>
      )}
      {items.map((item, index) => {
        const selected = options.find((option) => option.id === item.subCategoryId)
        return (
          <div className="hm-component-editor-row" key={index}>
            <div className="hm-component-picker">
              <span id={`component-label-${index}`}>Component {index + 1}</span>
              <details>
                <summary aria-labelledby={`component-label-${index}`}>
                  <ProductImage src={selected?.imageUrl} name={selected?.name} />
                  <span>
                    {selected?.name ||
                      (item.subCategoryId
                        ? 'Component unavailable - select another'
                        : 'Choose a component')}
                  </span>
                </summary>
                <div className="hm-component-options">
                  {options.map((option) => (
                    <button
                      type="button"
                      key={option.id}
                      disabled={!ready}
                      onClick={(event) => {
                        update(index, { subCategoryId: option.id })
                        const picker = event.currentTarget.closest('details')
                        picker.open = false
                        picker.querySelector('summary').focus()
                      }}
                    >
                      <ProductImage src={option.imageUrl} name={option.name} />
                      <span>
                        {option.name}
                        <small>
                          {formatPrice(option.price)} / item / {option.stock ?? '-'} in stock
                        </small>
                      </span>
                    </button>
                  ))}
                </div>
              </details>
            </div>
            <div>
              <CFormLabel htmlFor={`quantity-${index}`}>Quantity {index + 1}</CFormLabel>
              <CFormInput
                id={`quantity-${index}`}
                type="number"
                min={1}
                max={2147483647}
                step={1}
                required
                value={item.quantity}
                onChange={(event) => update(index, { quantity: event.target.value })}
              />
            </div>
            <div>
              <CFormLabel htmlFor={`position-${index}`}>Position {index + 1}</CFormLabel>
              <CFormInput
                id={`position-${index}`}
                placeholder="Optional"
                type="number"
                min={0}
                max={2147483647}
                step={1}
                value={item.position}
                onChange={(event) => update(index, { position: event.target.value })}
              />
            </div>
            <div>
              <span>Unit price</span>
              <strong className="d-block mt-2">
                {selected ? formatPrice(selected.price) : '-'}
              </strong>
            </div>
            <CButton
              type="button"
              color="danger"
              variant="outline"
              aria-label={`Remove component ${index + 1}`}
              onClick={() => onChange(items.filter((_, i) => i !== index))}
            >
              Remove
            </CButton>
          </div>
        )
      })}
      <div className="hm-order-info mt-3" role="status">
        Estimated totals:{' '}
        {complete
          ? `${items.reduce((sum, item) => sum + Number(item.quantity), 0)} items  /  ${formatPrice(total)}`
          : 'Select components and valid quantities'}
        . Final totals are calculated when saved.
      </div>
    </section>
  )
}
ComponentEditor.propTypes = {
  items: PropTypes.array.isRequired,
  options: PropTypes.array.isRequired,
  ready: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
}
export default ComponentEditor
