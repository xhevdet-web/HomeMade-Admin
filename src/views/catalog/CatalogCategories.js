import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import PropTypes from 'prop-types'
import api, { apiErrorMessage } from '../../_helpers/api'

/**
 * The one list of categories behind the Products and SubCategories navigation and pages.
 * Loaded once for the admin layout; the Categories page calls reload() after a change so
 * a new category shows up in the sidebar straight away.
 */
const CatalogCategoriesContext = createContext(null)

export const CatalogCategoriesProvider = ({ children }) => {
  const [state, setState] = useState({
    categories: [],
    loading: true,
    error: null,
  })
  const [revision, setRevision] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setState((previous) => ({ ...previous, loading: true, error: null }))
    api
      .get('/categories', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Invalid categories response')
        if (!controller.signal.aborted) setState({ categories: data, loading: false, error: null })
      })
      .catch((error) => {
        if (!controller.signal.aborted)
          setState((previous) => ({
            ...previous,
            loading: false,
            error: apiErrorMessage(error, 'Unable to load categories. Please try again.'),
          }))
      })
    return () => controller.abort()
  }, [revision])
  const reload = useCallback(() => setRevision((value) => value + 1), [])
  const value = useMemo(
    () => ({
      ...state,
      // The sidebar lists active categories only; pages still open inactive ones.
      activeCategories: state.categories.filter((category) => category.isActive),
      reload,
    }),
    [state, reload],
  )
  return (
    <CatalogCategoriesContext.Provider value={value}>{children}</CatalogCategoriesContext.Provider>
  )
}
CatalogCategoriesProvider.propTypes = { children: PropTypes.node }

const outsideProvider = {
  categories: [],
  activeCategories: [],
  loading: false,
  error: null,
  reload: () => {},
}
export const useCatalogCategories = () => useContext(CatalogCategoriesContext) ?? outsideProvider

/** Where each catalog area lives; every page and the sidebar build links from these. */
export const catalogPaths = {
  productsOverview: '/products',
  companyProducts: (categoryId) => `/products/company/${encodeURIComponent(categoryId)}`,
  customerProducts: (categoryId) => `/products/customer/${encodeURIComponent(categoryId)}`,
  subCategoriesOverview: '/sub-categories',
  subCategories: (categoryId) => `/sub-categories/${encodeURIComponent(categoryId)}`,
}
