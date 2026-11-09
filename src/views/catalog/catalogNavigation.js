import { catalogPaths } from './CatalogCategories'

const link = (id, title, to, extra = {}) => ({
  id,
  title,
  to,
  component: 'CNavItem',
  ...extra,
})
const group = (id, title, children, icon_name) => ({
  id,
  title,
  icon_name,
  component: 'CNavGroup',
  children,
})

/** One link per category, or a hint when there is none yet. */
const categoryLinks = (prefix, categories, path) =>
  categories.length
    ? categories.map((category) =>
        link(`${prefix}-${category.id}`, category.name, path(category.id)),
      )
    : [
        link(`${prefix}-none`, 'No active categories', '/categories', {
          end: true,
        }),
      ]

/**
 * Turns the Products and SubCategories entries of the sidebar into groups with one entry
 * per active category, taken from the live category list (never hardcoded):
 *
 * Products ▾ → Overview · Made by Company ▸ categories · Made by Customers ▸ categories
 * SubCategories ▾ → Overview · categories
 */
export const catalogNavigation = (items, categories) =>
  items.map((item) => {
    if (item.catalogGroup === 'products')
      return group(
        item.id,
        item.title,
        [
          link('products-overview', 'Overview', catalogPaths.productsOverview, {
            end: true,
          }),
          group(
            'products-company',
            'Made by Company',
            categoryLinks('products-company', categories, catalogPaths.companyProducts),
          ),
          group(
            'products-customer',
            'Made by Customers',
            categoryLinks('products-customer', categories, catalogPaths.customerProducts),
          ),
        ],
        item.icon_name,
      )
    if (item.catalogGroup === 'sub-categories')
      return group(
        item.id,
        item.title,
        [
          link('sub-categories-overview', 'Overview', catalogPaths.subCategoriesOverview, {
            end: true,
          }),
          ...categoryLinks('sub-categories', categories, catalogPaths.subCategories),
        ],
        item.icon_name,
      )
    return item
  })
