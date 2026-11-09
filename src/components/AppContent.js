import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import navigation from '../navigation'
import ManagementPage from '../views/management/ManagementPage'

const Dashboard = React.lazy(() => import('../views/dashboard/Dashboard'))
const Users = React.lazy(() => import('../views/base/users/Users'))
const CatalogPage = React.lazy(() => import('../views/management/CatalogPage'))
const Products = React.lazy(() => import('../views/products/Products'))
const ProductsOverview = React.lazy(() => import('../views/catalog/ProductsOverview'))
const SubCategories = React.lazy(() => import('../views/subCategories/SubCategories'))
const SubCategoriesOverview = React.lazy(() => import('../views/catalog/SubCategoriesOverview'))
const Orders = React.lazy(() => import('../views/orders/Orders'))
const GiftPackaging = React.lazy(() => import('../views/giftPackaging/GiftPackaging'))
const Page404 = React.lazy(() => import('../views/pages/page404/Page404'))

const AppContent = () => (
  <CContainer className="app-content hm-content" fluid>
    <Suspense
      fallback={
        <div className="hm-empty" role="status">
          <CSpinner size="sm" />
          <p>Loading your workspace…</p>
        </div>
      }
    >
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        {/* Products and SubCategories are managed one category at a time. */}
        <Route path="/products/company/:categoryId" element={<Products origin="COMPANY" />} />
        <Route path="/products/customer/:categoryId" element={<Products origin="CUSTOMER" />} />
        <Route path="/sub-categories/:categoryId" element={<SubCategories />} />
        {navigation
          .filter((route) => route.to)
          .map((route) => (
            <Route
              key={route.id}
              path={route.to}
              element={
                route.name === 'Dashboard' ? (
                  <Dashboard />
                ) : route.name === 'Users' ? (
                  <Users />
                ) : route.name === 'Orders' ? (
                  <Orders />
                ) : route.name === 'Products' ? (
                  <ProductsOverview />
                ) : route.name === 'SubCategories' ? (
                  <SubCategoriesOverview />
                ) : route.name === 'GiftPackaging' ? (
                  <GiftPackaging />
                ) : route.name === 'Categories' ? (
                  <CatalogPage key={route.id} kind="categories" />
                ) : (
                  <ManagementPage key={route.id} name={route.name} />
                )
              }
            />
          ))}
        <Route path="*" element={<Page404 />} />
      </Routes>
    </Suspense>
  </CContainer>
)
export default React.memo(AppContent)
