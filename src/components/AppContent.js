import React, { Suspense } from 'react'
import { Navigate, Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import navigation from '../navigation'
import ManagementPage from '../views/management/ManagementPage'

const Dashboard = React.lazy(() => import('../views/dashboard/Dashboard'))
const Users = React.lazy(() => import('../views/base/users/Users'))
const CatalogPage = React.lazy(() => import('../views/management/CatalogPage'))
const Products = React.lazy(() => import('../views/products/Products'))
const GarmentsPage = React.lazy(() => import('../views/garments/GarmentsPage'))
const Orders = React.lazy(() => import('../views/orders/Orders'))
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
                  <Products />
                ) : route.name === 'Categories' || route.name === 'SubCategories' ? (
                  <CatalogPage
                    key={route.id}
                    kind={route.name === 'Categories' ? 'categories' : 'sub-categories'}
                  />
                ) : (
                  <ManagementPage key={route.id} name={route.name} />
                )
              }
            />
          ))}
        <Route path="/categories/:categoryId/garments" element={<GarmentsPage />} />
        <Route path="*" element={<Page404 />} />
      </Routes>
    </Suspense>
  </CContainer>
)
export default React.memo(AppContent)
