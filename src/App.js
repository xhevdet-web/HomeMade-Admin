import React, { Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { useColorModes } from '@coreui/react'
import './scss/style.scss'
import { Preloader } from './components'
// import "bootstrap/dist/css/bootstrap.min.css";
// import "bootstrap/dist/js/bootstrap.bundle.min";
import { useAuthSelector } from './redux/selectors/authSelectors'

// Containers
const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))


// Pages
const Login = React.lazy(() => import('./views/pages/login/Login'))
// const Register = React.lazy(() => import('./views/pages/register/Register'))
const Page404 = React.lazy(() => import('./views/pages/page404/Page404'))
const Page500 = React.lazy(() => import('./views/pages/page500/Page500'))

const App = () => {
  const { isColorModeSet, setColorMode } = useColorModes('sims-template-theme')
  const storedTheme = useSelector((state) => state.ui.theme)
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.href.split('?')[1])
    const theme = urlParams.get('theme') && urlParams.get('theme').match(/^[A-Za-z0-9\s]+/)[0]
    if (theme) {
      setColorMode(theme)
    }

    if (isColorModeSet()) {
      return
    }

    setColorMode(storedTheme)
  }, [])

  const { isAuthenticated, userData } = useAuthSelector()

  return (
    <HashRouter>
      <Suspense fallback={<Preloader />}>
        <Routes>
          {isAuthenticated !== true && userData === null ? (
            <>
              <Route exact path="/" name="Login Page" element={<Login />} />
              {/* <Route exact path="/register" name="Register Page" element={<Register />} /> */}
              <Route exact path="/404" name="Page 404" element={<Page404 />} />
              <Route exact path="/500" name="Page 500" element={<Page500 />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </>
          ) : userData.role_id !== 'b263c795-18e5-46ae-a5f0-22928d24e32d' ? (
            <Route path="*" name="Home" element={<DefaultLayout />} />
          ) : (
            <Route path="*" name="Home" element={<AttendanceLayout />} />
          )}
        </Routes>
      </Suspense>
    </HashRouter>
  )
}

export default App
