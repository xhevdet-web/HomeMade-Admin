import { useState } from 'react'
import { useDispatch } from 'react-redux'
import {
  CAlert,
  CButton,
  CCard,
  CCardBody,
  CForm,
  CFormInput,
  CFormLabel,
  CSpinner,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../../_helpers/api'
import { setUserToken } from '../../../redux/actions/authActionTypes'
import { useAuthSelector } from '../../../redux/selectors/authSelectors'

const Login = () => {
  const dispatch = useDispatch()
  const { message } = useAuthSelector()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [pending, setPending] = useState(false)

  const handleLogin = async (event) => {
    event.preventDefault()
    if (pending) return
    setError(null)
    setPending(true)
    try {
      const { data } = await api.post(
        '/auth/login',
        { email: email.trim(), password },
        { skipAuth: true },
      )
      if (typeof data.accessToken !== 'string') throw new Error('Missing access token')
      dispatch(setUserToken(data.accessToken))
      // App verifies the role using /auth/me before allowing any admin route.
    } catch (error) {
      setError(apiErrorMessage(error, 'Sign in failed. Please check your email and password.'))
    } finally {
      setPending(false)
    }
  }

  return (
    <main className="hm-login">
      <section className="hm-login-brand">
        <a className="hm-wordmark" href="#/login">
          <span className="hm-monogram">h.</span>
          <span>
            HomeMade<small>ADMIN STUDIO</small>
          </span>
        </a>
        <div>
          <span className="hm-eyebrow">MADE WITH CARE. MANAGED WITH CLARITY.</span>
          <h1>
            A thoughtful space
            <br />
            for beautiful things.
          </h1>
          <p>
            Your collections, your customers, your craft.
            <br />
            All together in the HomeMade studio.
          </p>
        </div>
        <span className="hm-login-footnote">The business behind the handmade.</span>
      </section>
      <section className="hm-login-form">
        <CCard>
          <CCardBody>
            <span className="hm-eyebrow">WELCOME TO YOUR STUDIO</span>
            <h2>Welcome back</h2>
            <p className="hm-muted">Sign in with your administrator account.</p>
            {(error || message) && (
              <CAlert color="danger" role="alert">
                {error || message}
              </CAlert>
            )}
            <CForm onSubmit={handleLogin}>
              <CFormLabel htmlFor="login-email">Email address</CFormLabel>
              <CFormInput
                id="login-email"
                className="mb-4"
                type="email"
                autoComplete="username"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={pending}
              />
              <CFormLabel htmlFor="login-password">Password</CFormLabel>
              <CFormInput
                id="login-password"
                className="mb-4"
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                disabled={pending}
              />
              <CButton className="w-100" color="primary" type="submit" disabled={pending}>
                {pending ? (
                  <>
                    <CSpinner size="sm" className="me-2" />
                    Signing in…
                  </>
                ) : (
                  'Sign in to HomeMade'
                )}
              </CButton>
            </CForm>
            <p className="hm-login-note">
              Administrator access only. For account assistance, contact your HomeMade
              administrator.
            </p>
          </CCardBody>
        </CCard>
      </section>
    </main>
  )
}
export default Login
