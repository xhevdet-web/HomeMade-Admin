import React, { Suspense, useEffect } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { CButton, CSpinner, useColorModes } from '@coreui/react'
import { useAdminSession } from './hooks/useAdminSession'
import useLogout from './_helpers/HandleLogOut'
import './scss/style.scss'

const DefaultLayout = React.lazy(() => import('./layout/DefaultLayout'))
const Login = React.lazy(() => import('./views/pages/login/Login'))

const Loading = () => (
  <div className="hm-session" role="status">
    <CSpinner size="sm" aria-hidden="true" />
    <span>Checking your session…</span>
  </div>
)

const App = () => {
  const { setColorMode } = useColorModes('sims-template-theme')
  const storedTheme = useSelector((state) => state.ui.theme)
  const session = useAdminSession()
  const { handleLogout } = useLogout()
  useEffect(() => {
    setColorMode(storedTheme)
  }, [storedTheme, setColorMode])

  let content
  if (session.token && session.status === 'error') {
    content = (
      <div className="hm-session">
        <h1>We couldn’t verify your session</h1>
        <p role="alert">{session.message}</p>
        <div className="d-flex gap-2">
          <CButton color="primary" onClick={session.retry}>
            Try again
          </CButton>
          <CButton color="secondary" variant="outline" onClick={handleLogout}>
            Back to sign in
          </CButton>
        </div>
      </div>
    )
  } else if (session.token && !session.verified) {
    content = <Loading />
  } else {
    content = (
      <Routes>
        <Route
          path="/login"
          element={session.verified ? <Navigate to="/dashboard" replace /> : <Login />}
        />
        <Route
          path="*"
          element={session.verified ? <DefaultLayout /> : <Navigate to="/login" replace />}
        />
      </Routes>
    )
  }
  return (
    <HashRouter>
      <Suspense fallback={<Loading />}>{content}</Suspense>
    </HashRouter>
  )
}
export default App
