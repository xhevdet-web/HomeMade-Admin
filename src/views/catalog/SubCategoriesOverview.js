import { Navigate, useSearchParams } from 'react-router-dom'
import CategoryOverview, { countLabel } from './CategoryOverview'
import { catalogPaths } from './CatalogCategories'

const trail = [{ label: 'Management' }, { label: 'SubCategories' }]

/** /sub-categories: choose the category whose components to manage. */
const SubCategoriesOverview = () => {
  const [params] = useSearchParams()
  // Older links used /sub-categories?categoryId=….
  const legacyCategoryId = params.get('categoryId')
  if (legacyCategoryId)
    return <Navigate replace to={catalogPaths.subCategories(legacyCategoryId)} />
  return (
    <CategoryOverview
      trail={trail}
      title="SubCategories"
      description="Choose a category to manage the components and designs customers build with."
      links={(category, counts) => [
        {
          label: 'SubCategories',
          count: countLabel(counts?.subCategoryCount, 'subcategory', 'subcategories'),
          action: 'Manage',
          to: catalogPaths.subCategories(category.id),
        },
      ]}
    />
  )
}
export default SubCategoriesOverview
