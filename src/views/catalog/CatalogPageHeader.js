import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'

/**
 * Page title with its place in the catalog, e.g. Management / Products / Made by Company /
 * Mugs. Trail entries with `to` are links back up.
 */
const CatalogPageHeader = ({ trail, title, description, actions }) => (
  <div className="hm-page-heading">
    <div>
      <nav aria-label="Breadcrumb">
        <ol className="hm-trail">
          {trail.map((entry, index) => (
            <li key={`${entry.label}-${index}`}>
              {entry.to && index < trail.length - 1 ? (
                <Link to={entry.to}>{entry.label}</Link>
              ) : (
                <span aria-current={index === trail.length - 1 ? 'page' : undefined}>
                  {entry.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <h1>{title}</h1>
      {description && <p>{description}</p>}
    </div>
    {actions && <div className="hm-page-actions">{actions}</div>}
  </div>
)
CatalogPageHeader.propTypes = {
  trail: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.string.isRequired,
      to: PropTypes.string,
    }),
  ).isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  actions: PropTypes.node,
}
export default CatalogPageHeader
