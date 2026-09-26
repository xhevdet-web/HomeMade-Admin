const item = (name, title, to, icon_name) => ({
  id: name,
  name,
  title,
  to,
  icon_name,
  is_nav: true,
  component: 'CNavItem',
})
const heading = (title) => ({ id: title, title, is_nav: true, component: 'CNavTitle' })

const navigation = [
  item('Dashboard', 'Dashboard', '/dashboard', 'cilSpeedometer'),
  heading('Management'),
  item('Users', 'Users', '/users', 'cilPeople'),
  item('Categories', 'Categories', '/categories', 'cilFolderOpen'),
  item('SubCategories', 'SubCategories', '/sub-categories', 'cilList'),
  item('Products', 'Products', '/products', 'cilStar'),
  item('Components', 'Components', '/components', 'cilPuzzle'),
  item('Designs', 'Designs', '/designs', 'cilPencil'),
  heading('Sales'),
  item('Orders', 'Orders', '/orders', 'cilClipboard'),
]
export default navigation
