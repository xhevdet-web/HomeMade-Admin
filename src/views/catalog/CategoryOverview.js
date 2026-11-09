import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { Link } from 'react-router-dom'
import { CAlert, CButton, CSpinner } from '@coreui/react'
import api from '../../_helpers/api'
import EmptyState from '../../components/EmptyState'
import ProductImage from '../products/ProductImage'
import { builderLabels } from '../management/catalogFields'
import { useCatalogCategories } from './CatalogCategories'
import CatalogPageHeader from './CatalogPageHeader'

/**
 * Counts per category from GET /categories/summary: one request for all categories. When
 * it is unavailable the cards still work, without counts.
 */
const useCategoryCounts = () => {
  const [counts, setCounts] = useState(null)
  useEffect(() => {
    const controller = new AbortController()
    api
      .get('/categories/summary', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data) || controller.signal.aborted) return
        setCounts(Object.fromEntries(data.map((entry) => [entry.id, entry])))
      })
      .catch(() => {
        if (!controller.signal.aborted) setCounts({})
      })
    return () => controller.abort()
  }, [])
  return counts
}

export const countLabel = (count, singular, plural) =>
  Number.isInteger(count) ? `${count} ${count === 1 ? singular : plural}` : null

/**
 * "Choose a category" landing page: one card per category, each with the links of the
 * resource (e.g. company products and customer designs) and their counts.
 */
const CategoryOverview = ({ trail, title, description, links }) => {
  const { categories, loading, error, reload } = useCatalogCategories()
  const counts = useCategoryCounts()
  return (
    <>
      <CatalogPageHeader trail={trail} title={title} description={description} />
      {loading && !categories.length ? (
        <div className="hm-empty" role="status">
          <CSpinner aria-hidden="true" />
          <p>Loading categories...</p>
        </div>
      ) : error && !categories.length ? (
        <CAlert color="danger" role="alert">
          {error}{' '}
          <CButton color="link" onClick={reload}>
            Try again
          </CButton>
        </CAlert>
      ) : !categories.length ? (
        <div className="hm-panel">
          <EmptyState
            title="No categories yet"
            description="Create a category first; it appears here and in the sidebar."
          />
          <div className="text-center pb-4">
            <CButton as={Link} to="/categories" color="primary">
              Go to Categories
            </CButton>
          </div>
        </div>
      ) : (
        <ul className="hm-category-grid">
          {categories.map((category) => (
            <li key={category.id} className="hm-category-card">
              <div className="hm-category-card-head">
                <ProductImage src={category.imageUrl} name={category.name} transparent />
                <div>
                  <h2>{category.name}</h2>
                  <span className="hm-muted small">
                    {builderLabels[category.builderType] || 'No studio'}
                  </span>
                </div>
                {!category.isActive && <span className="hm-badge ms-auto">Inactive</span>}
              </div>
              <div className="hm-category-card-links">
                {links(category, counts?.[category.id]).map((entry) => (
                  <Link key={entry.to} to={entry.to} className="hm-category-card-link">
                    <span>
                      <strong>{entry.label}</strong>
                      {counts === null ? (
                        <small>Counting...</small>
                      ) : (
                        entry.count && <small>{entry.count}</small>
                      )}
                    </span>
                    <span aria-hidden="true">{entry.action} →</span>
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      )}
    </>
  )
}
CategoryOverview.propTypes = {
  trail: PropTypes.array.isRequired,
  title: PropTypes.string.isRequired,
  description: PropTypes.string,
  links: PropTypes.func.isRequired,
}
export default CategoryOverview
