import PropTypes from 'prop-types'
import { CButton, CCol, CFormInput, CFormLabel, CRow } from '@coreui/react'
import { sizeId } from './catalogFields'

const CategorySizesEditor = ({ sizes, onChange }) => {
  const change = (index, key, value) =>
    onChange(
      sizes.map((size, row) =>
        row === index
          ? { ...size, [key]: value, ...(key === 'name' ? { id: sizeId(value) } : {}) }
          : size,
      ),
    )
  return (
    <section className="mt-4" aria-label="Category sizes">
      <h3>Sizes (Optional)</h3>
      <p className="hm-muted">Configure sizes only if this category requires them.</p>
      {sizes.map((size, index) => (
        <div className="border rounded p-3 mb-3" key={index}>
          <CRow className="g-3">
            {[
              ['name', 'Name', { required: true }],
              [
                'measurement',
                'Measurement',
                { type: 'number', min: '0', step: 'any', required: true },
              ],
              ['unit', 'Unit', { required: true }],
              [
                'maxItems',
                'Max Items',
                { type: 'number', min: '1', max: '2147483647', step: '1', required: true },
              ],
            ].map(([key, label, props]) => (
              <CCol xs={12} md={key === 'name' ? 12 : 4} key={key}>
                <CFormLabel htmlFor={`size-${index}-${key}`}>{label}</CFormLabel>
                <CFormInput
                  id={`size-${index}-${key}`}
                  aria-label={`Size ${index + 1} ${label}`}
                  value={size[key]}
                  onChange={(event) => change(index, key, event.target.value)}
                  {...props}
                />
                {key === 'maxItems' && (
                  <small className="hm-muted">
                    Maximum number of components/beads allowed for this size.
                  </small>
                )}
              </CCol>
            ))}
          </CRow>
          <CButton
            type="button"
            color="danger"
            variant="outline"
            size="sm"
            className="mt-3"
            aria-label={`Remove size ${index + 1}`}
            onClick={() => onChange(sizes.filter((_, row) => row !== index))}
          >
            Delete size
          </CButton>
        </div>
      ))}
      <CButton
        type="button"
        color="primary"
        variant="outline"
        onClick={() =>
          onChange([...sizes, { id: '', name: '', measurement: '', unit: 'cm', maxItems: '' }])
        }
      >
        + Add Size
      </CButton>
    </section>
  )
}
CategorySizesEditor.propTypes = {
  sizes: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
}
export default CategorySizesEditor
