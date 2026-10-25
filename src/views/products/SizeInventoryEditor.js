import PropTypes from 'prop-types'
import { CButton, CFormInput } from '@coreui/react'
import { LOW_STOCK, presetSizes } from '../apparel/apparelHelpers'

/** Sizes of one product with their own stock, e.g. S 20 · M 28 · L 35. */
const SizeInventoryEditor = ({ rows, onChange }) => {
  const change = (index, key, value) =>
    onChange(rows.map((row, position) => (position === index ? { ...row, [key]: value } : row)))
  const nextSize = presetSizes.find(
    (size) => !rows.some((row) => row.size.trim().toLowerCase() === size.toLowerCase()),
  )
  return (
    <section className="hm-size-inventory" aria-labelledby="size-inventory-title">
      <h4 id="size-inventory-title">Sizes &amp; inventory</h4>
      <p className="hm-muted small">
        Stock is kept per size and decreases only when an order is placed.
      </p>
      {rows.length > 0 && (
        <table className="table table-sm hm-table mb-2">
          <thead>
            <tr>
              <th scope="col">Size</th>
              <th scope="col">Stock</th>
              <th scope="col">
                <span className="visually-hidden">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              <tr key={index}>
                <td>
                  <CFormInput
                    aria-label={`Size ${index + 1}`}
                    value={row.size}
                    maxLength={20}
                    required
                    onChange={(event) => change(index, 'size', event.target.value)}
                  />
                </td>
                <td>
                  <CFormInput
                    aria-label={`Stock for size ${row.size || index + 1}`}
                    type="number"
                    min="0"
                    max="2147483647"
                    step="1"
                    required
                    value={row.stock}
                    onChange={(event) => change(index, 'stock', event.target.value)}
                  />
                  {String(row.stock).trim() !== '' && Number(row.stock) < LOW_STOCK && (
                    <small className="hm-muted">
                      {Number(row.stock) === 0 ? 'Sold out' : 'Low stock'}
                    </small>
                  )}
                </td>
                <td className="text-end">
                  <CButton
                    type="button"
                    color="danger"
                    variant="outline"
                    size="sm"
                    aria-label={`Remove size ${row.size || index + 1}`}
                    onClick={() => onChange(rows.filter((_, position) => position !== index))}
                  >
                    Remove
                  </CButton>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      <CButton
        type="button"
        color="primary"
        variant="outline"
        size="sm"
        onClick={() => onChange([...rows, { size: nextSize ?? '', stock: '0' }])}
      >
        + Add size
      </CButton>
    </section>
  )
}
SizeInventoryEditor.propTypes = {
  rows: PropTypes.arrayOf(PropTypes.shape({ size: PropTypes.string, stock: PropTypes.string }))
    .isRequired,
  onChange: PropTypes.func.isRequired,
}
export default SizeInventoryEditor
