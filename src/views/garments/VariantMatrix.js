import { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CAlert,
  CButton,
  CCol,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CFormSelect,
  CRow,
} from '@coreui/react'
import {
  autoSku,
  cellKey,
  emptyCell,
  isSold,
  LOW_STOCK,
  presetSizes,
  skuPrefix,
  stockLevel,
} from './garmentHelpers'

const usedWarning = (what) =>
  `Remove ${what}? Variants that customers already designed on will be deactivated instead of deleted when you save.`

const VariantMatrix = ({ matrix, onChange, garmentName, error }) => {
  const { sizes, colors, cells } = matrix
  const [customSize, setCustomSize] = useState('')
  const [target, setTarget] = useState('all')
  const [bulkStock, setBulkStock] = useState('')
  const [bulkPrice, setBulkPrice] = useState('')
  const [prefix, setPrefix] = useState('')
  const update = (changes) => onChange({ ...matrix, ...changes })
  const setCell = (size, color, next) => {
    const key = cellKey(size, color.value)
    const copy = { ...cells }
    if (next) copy[key] = { ...cells[key], ...next }
    else delete copy[key]
    update({ cells: copy })
  }
  const hasSaved = (predicate) =>
    Object.entries(cells).some(([key, cell]) => cell.saved && predicate(key))

  // ----- sizes -----
  const addSize = (size) => {
    const value = size.trim()
    if (!value || sizes.some((existing) => existing.toLowerCase() === value.toLowerCase())) return
    update({ sizes: [...sizes, value] })
  }
  const moveSize = (index, offset) => {
    const next = [...sizes]
    const [size] = next.splice(index, 1)
    next.splice(index + offset, 0, size)
    update({ sizes: next })
  }
  const removeSize = (size) => {
    if (hasSaved((key) => key.startsWith(`${size}\u0000`)) && !window.confirm(usedWarning(`size ${size}`)))
      return
    const copy = Object.fromEntries(
      Object.entries(cells).filter(([key]) => !key.startsWith(`${size}\u0000`)),
    )
    update({ sizes: sizes.filter((existing) => existing !== size), cells: copy })
  }

  // ----- colours -----
  const changeColor = (index, changes) => {
    const previous = colors[index]
    const next = { ...previous, ...changes }
    let nextCells = cells
    if (changes.value && changes.value.toLowerCase() !== previous.value.toLowerCase()) {
      // Cells are keyed by colour value, so move them with the colour.
      nextCells = { ...cells }
      for (const size of sizes) {
        const from = cellKey(size, previous.value)
        if (nextCells[from]) {
          nextCells[cellKey(size, changes.value)] = { ...nextCells[from], saved: false }
          delete nextCells[from]
        }
      }
    }
    update({ colors: colors.map((color, row) => (row === index ? next : color)), cells: nextCells })
  }
  const removeColor = (color) => {
    const suffix = `\u0000${color.value.toLowerCase()}`
    if (hasSaved((key) => key.endsWith(suffix)) && !window.confirm(usedWarning(`colour ${color.name}`)))
      return
    update({
      colors: colors.filter((existing) => existing !== color),
      cells: Object.fromEntries(Object.entries(cells).filter(([key]) => !key.endsWith(suffix))),
    })
  }

  // ----- bulk actions -----
  const targets = () =>
    colors.flatMap((color) =>
      sizes
        .filter(
          (size) =>
            target === 'all' || target === `size:${size}` || target === `color:${color.value}`,
        )
        .map((size) => [size, color]),
    )
  const applyToSold = (changes) => {
    const copy = { ...cells }
    for (const [size, color] of targets()) {
      const key = cellKey(size, color.value)
      if (isSold(copy[key])) copy[key] = { ...copy[key], ...changes(size, color) }
    }
    update({ cells: copy })
  }
  const generateAll = () => {
    const copy = { ...cells }
    for (const color of colors)
      for (const size of sizes) {
        const key = cellKey(size, color.value)
        if (!isSold(copy[key])) copy[key] = emptyCell()
      }
    update({ cells: copy })
  }
  const setStock = () => {
    const stock = Number(bulkStock)
    if (!String(bulkStock).trim() || !Number.isInteger(stock) || stock < 0) return
    const copy = { ...cells }
    // Setting stock on a row/column also starts selling its empty cells.
    for (const [size, color] of targets())
      copy[cellKey(size, color.value)] = { ...(copy[cellKey(size, color.value)] || emptyCell()), stock: String(stock) }
    update({ cells: copy })
  }

  const soldCount = Object.values(cells).filter(isSold).length
  const lowCount = Object.values(cells).filter((cell) => ['low', 'sold-out'].includes(stockLevel(cell))).length

  return (
    <section className="hm-variant-matrix mt-4" aria-labelledby="variant-matrix-title">
      <h3 id="variant-matrix-title">Sizes, colours &amp; stock</h3>
      <p className="hm-muted">
        Each sold size × colour is a variant with its own stock. Leave a cell empty when that
        combination is not sold.
      </p>
      {error && (
        <CAlert color="danger" role="alert">
          {error}
        </CAlert>
      )}

      <div className="hm-variant-block">
        <h4>Sizes</h4>
        <ul className="hm-size-chips" aria-label="Sizes in display order">
          {sizes.map((size, index) => (
            <li key={size} className="hm-size-chip">
              <span>{size}</span>
              <button
                type="button"
                aria-label={`Move ${size} left`}
                disabled={index === 0}
                onClick={() => moveSize(index, -1)}
              >
                ‹
              </button>
              <button
                type="button"
                aria-label={`Move ${size} right`}
                disabled={index === sizes.length - 1}
                onClick={() => moveSize(index, 1)}
              >
                ›
              </button>
              <button type="button" aria-label={`Remove size ${size}`} onClick={() => removeSize(size)}>
                ×
              </button>
            </li>
          ))}
          {!sizes.length && <li className="hm-muted">No sizes yet.</li>}
        </ul>
        <div className="d-flex flex-wrap gap-2 align-items-center">
          {presetSizes
            .filter((size) => !sizes.includes(size))
            .map((size) => (
              <CButton key={size} type="button" size="sm" color="primary" variant="outline" onClick={() => addSize(size)}>
                + {size}
              </CButton>
            ))}
          <CFormInput
            size="sm"
            className="hm-size-input"
            aria-label="Custom size"
            placeholder="Custom size"
            maxLength={20}
            value={customSize}
            onChange={(event) => setCustomSize(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault()
                addSize(customSize)
                setCustomSize('')
              }
            }}
          />
          <CButton
            type="button"
            size="sm"
            color="primary"
            variant="outline"
            disabled={!customSize.trim()}
            onClick={() => {
              addSize(customSize)
              setCustomSize('')
            }}
          >
            Add size
          </CButton>
        </div>
      </div>

      <div className="hm-variant-block">
        <h4>Colours</h4>
        {colors.map((color, index) => (
          <CRow className="g-2 align-items-end mb-2" key={index}>
            <CCol xs={12} sm={5}>
              <CFormLabel htmlFor={`garment-color-${index}-name`}>Colour {index + 1} name</CFormLabel>
              <CFormInput
                id={`garment-color-${index}-name`}
                maxLength={60}
                value={color.name}
                onChange={(event) => changeColor(index, { name: event.target.value })}
              />
            </CCol>
            <CCol xs={3} sm={2}>
              <CFormLabel htmlFor={`garment-color-${index}-picker`}>Picker</CFormLabel>
              <CFormInput
                id={`garment-color-${index}-picker`}
                type="color"
                value={/^#[0-9a-f]{6}$/i.test(color.value) ? color.value : '#000000'}
                onChange={(event) => changeColor(index, { value: event.target.value.toUpperCase() })}
              />
            </CCol>
            <CCol xs={9} sm={3}>
              <CFormLabel htmlFor={`garment-color-${index}-value`}>Hex value</CFormLabel>
              <CFormInput
                id={`garment-color-${index}-value`}
                maxLength={7}
                value={color.value}
                onChange={(event) => changeColor(index, { value: event.target.value })}
              />
            </CCol>
            <CCol xs={12} sm={2}>
              <CButton
                type="button"
                color="danger"
                variant="outline"
                className="w-100"
                aria-label={`Remove colour ${color.name || index + 1}`}
                onClick={() => removeColor(color)}
              >
                Remove
              </CButton>
            </CCol>
          </CRow>
        ))}
        <CButton
          type="button"
          color="primary"
          variant="outline"
          size="sm"
          onClick={() => {
            // A fresh, unused grey so two new colours never collide.
            let shade = 0x80
            const used = new Set(colors.map((color) => color.value.toLowerCase()))
            while (used.has(`#${shade.toString(16).repeat(3)}`) && shade < 0xff) shade += 1
            update({ colors: [...colors, { name: '', value: `#${shade.toString(16).repeat(3)}`.toUpperCase() }] })
          }}
        >
          + Add colour
        </CButton>
      </div>

      {sizes.length > 0 && colors.length > 0 && (
        <>
          <div className="hm-variant-block">
            <h4>Bulk actions</h4>
            <CRow className="g-2 align-items-end">
              <CCol xs={12} md={3}>
                <CFormLabel htmlFor="variant-bulk-target">Apply to</CFormLabel>
                <CFormSelect id="variant-bulk-target" value={target} onChange={(event) => setTarget(event.target.value)}>
                  <option value="all">All cells</option>
                  {colors.map((color, row) => (
                    <option key={row} value={`color:${color.value}`}>
                      Row: {color.name || color.value}
                    </option>
                  ))}
                  {sizes.map((size) => (
                    <option key={size} value={`size:${size}`}>
                      Column: {size}
                    </option>
                  ))}
                </CFormSelect>
              </CCol>
              <CCol xs={6} md={2}>
                <CFormLabel htmlFor="variant-bulk-stock">Stock</CFormLabel>
                <CFormInput id="variant-bulk-stock" type="number" min="0" step="1" value={bulkStock} onChange={(event) => setBulkStock(event.target.value)} />
              </CCol>
              <CCol xs={6} md={2}>
                <CButton type="button" color="primary" variant="outline" className="w-100" onClick={setStock}>
                  Set stock
                </CButton>
              </CCol>
              <CCol xs={6} md={3}>
                <CFormLabel htmlFor="variant-bulk-price">Price override (€)</CFormLabel>
                <CFormInput id="variant-bulk-price" inputMode="decimal" placeholder="Base price" value={bulkPrice} onChange={(event) => setBulkPrice(event.target.value)} />
              </CCol>
              <CCol xs={6} md={2}>
                <CButton type="button" color="primary" variant="outline" className="w-100" onClick={() => applyToSold(() => ({ price: bulkPrice.trim() }))}>
                  Copy price
                </CButton>
              </CCol>
              <CCol xs={6} md={3}>
                <CFormLabel htmlFor="variant-sku-prefix">SKU prefix</CFormLabel>
                <CFormInput id="variant-sku-prefix" maxLength={20} placeholder={skuPrefix(garmentName)} value={prefix} onChange={(event) => setPrefix(event.target.value)} />
              </CCol>
              <CCol xs={6} md={3}>
                <CButton
                  type="button"
                  color="primary"
                  variant="outline"
                  className="w-100"
                  onClick={() => applyToSold((size, color) => ({ sku: autoSku(prefix || skuPrefix(garmentName), color.name, size) }))}
                >
                  Generate SKUs
                </CButton>
              </CCol>
              <CCol xs={12} md={3}>
                <CButton type="button" color="primary" className="w-100" onClick={generateAll}>
                  Generate all combinations
                </CButton>
              </CCol>
            </CRow>
            <small className="hm-muted d-block mt-2">
              An empty price uses the garment base price. SKUs look like {autoSku(prefix || skuPrefix(garmentName), colors[0]?.name || 'RED', sizes[0] || 'S')}.
            </small>
          </div>

          <p className="hm-muted small mb-2" aria-live="polite">
            {soldCount} variants sold · {lowCount} sold out or below {LOW_STOCK} in stock
          </p>
          <div className="hm-variant-grid-wrap">
            <table className="hm-variant-grid">
              <thead>
                <tr>
                  <th scope="col">Colour</th>
                  {sizes.map((size) => (
                    <th scope="col" key={size}>
                      {size}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {colors.map((color, row) => (
                  <tr key={row}>
                    <th scope="row">
                      <span className="hm-swatch" style={{ backgroundColor: color.value }} aria-hidden="true" />
                      {color.name || color.value}
                    </th>
                    {sizes.map((size) => {
                      const cell = cells[cellKey(size, color.value)]
                      const label = `${color.name || color.value} ${size}`
                      return (
                        <td key={size} className={`hm-variant-cell is-${stockLevel(cell)}`}>
                          {isSold(cell) ? (
                            <div className="hm-variant-cell-fields">
                              <label>
                                <span>Stock</span>
                                <input
                                  type="number"
                                  min="0"
                                  step="1"
                                  className="form-control form-control-sm"
                                  aria-label={`${label} stock`}
                                  value={cell.stock}
                                  onChange={(event) => setCell(size, color, { stock: event.target.value })}
                                />
                              </label>
                              <label>
                                <span>€</span>
                                <input
                                  inputMode="decimal"
                                  className="form-control form-control-sm"
                                  placeholder="Base"
                                  aria-label={`${label} price override in euros`}
                                  value={cell.price}
                                  onChange={(event) => setCell(size, color, { price: event.target.value })}
                                />
                              </label>
                              <label>
                                <span>SKU</span>
                                <input
                                  className="form-control form-control-sm"
                                  maxLength={64}
                                  aria-label={`${label} SKU`}
                                  value={cell.sku}
                                  onChange={(event) => setCell(size, color, { sku: event.target.value })}
                                />
                              </label>
                              <div className="d-flex justify-content-between align-items-center">
                                <CFormCheck
                                  id={`variant-${cellKey(size, color.value).replace('\u0000', '-')}-active`}
                                  label="Active"
                                  aria-label={`${label} active`}
                                  checked={cell.isActive}
                                  onChange={(event) => setCell(size, color, { isActive: event.target.checked })}
                                />
                                <button
                                  type="button"
                                  className="hm-variant-clear"
                                  aria-label={`Stop selling ${label}`}
                                  onClick={() => {
                                    if (cell.saved && !window.confirm(usedWarning(label))) return
                                    setCell(size, color, null)
                                  }}
                                >
                                  ×
                                </button>
                              </div>
                              {stockLevel(cell) === 'sold-out' && <small className="hm-variant-flag">Sold out</small>}
                              {stockLevel(cell) === 'low' && <small className="hm-variant-flag">Low stock</small>}
                            </div>
                          ) : (
                            <button
                              type="button"
                              className="hm-variant-add"
                              aria-label={`Sell ${label}`}
                              onClick={() => setCell(size, color, emptyCell())}
                            >
                              + Sell
                            </button>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </section>
  )
}
VariantMatrix.propTypes = {
  matrix: PropTypes.shape({
    sizes: PropTypes.array.isRequired,
    colors: PropTypes.array.isRequired,
    cells: PropTypes.object.isRequired,
  }).isRequired,
  onChange: PropTypes.func.isRequired,
  garmentName: PropTypes.string,
  error: PropTypes.string,
}
export default VariantMatrix
