import React, { Suspense } from 'react'
import { Route, Routes } from 'react-router-dom'
import { CContainer, CSpinner } from '@coreui/react'
import HandleAlerts from '../_helpers/HandleAlerts'
import Page404 from '../views/pages/page404/Page404'
import { useSidebarSelector } from '../redux/selectors/sidebarSelector'
import Preloader from './Preloader'


const componentMap = {
  Users: React.lazy(() => import('../views/base/users/Users')),
  Nav: React.lazy(() => import('../views/base/nav/Nav')),
  Roles: React.lazy(() => import('../views/base/roles/Roles')),
  ListType: React.lazy(() => import('../views/base/lists/ListType')),
  ListItems: React.lazy(() => import('../views/base/lists/ListItems')),
  // Genders: React.lazy(() => import('../views/base/genders/Genders')),
  // Dashboard: React.lazy(() => import('../views/dashboard/Dashboard')),
  RolePrivilege: React.lazy(() => import('../views/base/roles/RolePrivilege')),

  Login: React.lazy(() => import('../views/pages/login/Login')), // Ensure Page404 is included in your lazy imports

  Page404: React.lazy(() => import('../views/pages/page404/Page404')), // Ensure Page404 is included in your lazy imports
  Employees: React.lazy(() => import('../views/base/employees/Employees')),
  EmployeeDetails: React.lazy(() => import('../views/base/employees/EmployeeDetails'))


}

const AppContent = () => {
  // const routes = MyRoutes();
  const { sidebarData } = useSidebarSelector()

  // useEffect(() => {
  //   if (userData) {
  //     showModal('TermsAndConditions', 'sms')
  //   }
  // }, [userData, showModal])

  const routes = sidebarData?.filter((route) => route.name !== 'Login')

  return (
    <CContainer className="px-4 app-content" fluid>
      <Suspense fallback={<CSpinner color="primary" />}>
        <HandleAlerts>
          {/* <ShowAlerts notifications={notifications} /> */}
          <Routes>
            {routes?.map((route, idx) => {
              const Component = componentMap[route.name] || Page404
              return (
                route.name && (
                  <Route
                    key={idx}
                    path={route.to}
                    exact
                    name={route.name}
                    element={
                      <Suspense fallback={<Preloader />}>
                        <Component />
                      </Suspense>
                    }
                  />
                )
              )
            })}
            <Route path="*" name="Page 404" element={<Page404 />} />
            {/* <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password/:token" element={<ResetPassword />} /> */}

            {/* <Route path="/users-attendance" name="UsersAttendance" element={<UsersAttendance />} /> */}

            {/* <Route path="/" element={<Navigate to="/404" replace />} /> */}
          </Routes>
        </HandleAlerts>
      </Suspense>
    </CContainer>
  )
}

export default React.memo(AppContent)
