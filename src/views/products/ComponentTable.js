import PropTypes from 'prop-types'
import ProductImage from './ProductImage'
import { formatPrice } from './productHelpers'
const ComponentTable = ({ items = [] }) => (
  <div className="table-responsive">
    <table className="table hm-table hm-component-table">
      <caption>Saved component prices</caption>
      <thead>
        <tr>
          {['Component', 'Color', 'Type', 'Quantity', 'Position', 'Unit price', 'Line total'].map(
            (label) => (
              <th scope="col" key={label}>
                {label}
              </th>
            ),
          )}
        </tr>
      </thead>
      <tbody>
        {items.length ? (
          items.map((item, index) => (
            <tr key={item.id || index}>
              <td>
                <div className="d-flex align-items-center gap-2">
                  <ProductImage src={item.subCategory?.imageUrl} name={item.subCategory?.name} />
                  <strong>{item.subCategory?.name || 'Unavailable component'}</strong>
                </div>
              </td>
              <td>{item.subCategory?.color || '-'}</td>
              <td>{item.subCategory?.type || '-'}</td>
              <td>{item.quantity}</td>
              <td>{item.position ?? '-'}</td>
              <td>{formatPrice(item.unitPrice)}</td>
              <td>{formatPrice(item.quantity * item.unitPrice)}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={7}>No saved components.</td>
          </tr>
        )}
      </tbody>
    </table>
  </div>
)
ComponentTable.propTypes = { items: PropTypes.array }
export default ComponentTable
