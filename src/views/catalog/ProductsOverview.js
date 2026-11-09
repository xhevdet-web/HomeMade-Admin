import { Navigate, useSearchParams } from 'react-router-dom'
import CategoryOverview, { countLabel } from './CategoryOverview'
import { catalogPaths } from './CatalogCategories'

const trail = [{ label: 'Management' }, { label: 'Products' }]

/** /products: choose a category, then its company products or its customers' designs. */
const ProductsOverview = () => {
  const [params] = useSearchParams()
  // Older links (e.g. from the Categories page) used /products?categoryId=…&origin=….
  const legacyCategoryId = params.get('categoryId')
  if (legacyCategoryId)
    return (
      <Navigate
        replace
        to={
          params.get('origin') === 'CUSTOMER'
            ? catalogPaths.customerProducts(legacyCategoryId)
            : catalogPaths.companyProducts(legacyCategoryId)
        }
      />
    )
  return (
    <CategoryOverview
      trail={trail}
      title="Products"
      description="Choose a category: manage what the company sells, or look at what customers designed."
      links={(category, counts) => [
        {
          label: 'Made by Company',
          count: countLabel(counts?.companyProductCount, 'product', 'products'),
          action: 'Manage',
          to: catalogPaths.companyProducts(category.id),
        },
        {
          label: 'Made by Customers',
          count: countLabel(counts?.customerProductCount, 'design', 'designs'),
          action: 'View',
          to: catalogPaths.customerProducts(category.id),
        },
      ]}
    />
  )
}
export default ProductsOverview
