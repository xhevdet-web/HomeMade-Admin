import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import api, { apiErrorMessage } from '../_helpers/api'
import { isTokenExpired, tokenExpiresAt } from '../_helpers/IsTokenExpired'
import { clearUserPermissions, setAuthStatus, setUserData } from '../redux/actions/authActionTypes'
import { useAuthSelector } from '../redux/selectors/authSelectors'
import { store } from '../redux/store'

export const useAdminSession = () => {
  const auth = useAuthSelector()
  const dispatch = useDispatch()
  const [attempt, setAttempt] = useState(0)
  const [verifiedToken, setVerifiedToken] = useState(null)
  const { token } = auth

  useEffect(() => {
    setVerifiedToken(null)
    if (!token) return
    if (isTokenExpired(token)) {
      dispatch(clearUserPermissions('Your session has expired. Please sign in again.'))
      return
    }
    const controller = new AbortController()
    dispatch(setAuthStatus('checking'))
    api
      .get('/auth/me', { signal: controller.signal })
      .then(({ data }) => {
        if (controller.signal.aborted || store.getState().auth.token !== token) return
        dispatch(setUserData(data))
        if (data?.role === 'ADMIN') setVerifiedToken(token)
      })
      .catch((error) => {
        if (controller.signal.aborted || store.getState().auth.token !== token) return
        if (error.response?.status === 401 || error.response?.status === 403) {
          dispatch(
            clearUserPermissions('Access denied. Please sign in with an administrator account.'),
          )
        } else {
          dispatch(setAuthStatus('error', apiErrorMessage(error)))
        }
      })
    // Expire idle sessions too; cap long timers to the browser's timer limit.
    let timer
    const scheduleExpiry = () => {
      const remaining = tokenExpiresAt(token) - Date.now()
      if (remaining <= 0) {
        if (store.getState().auth.token === token)
          dispatch(clearUserPermissions('Your session has expired. Please sign in again.'))
      } else timer = setTimeout(scheduleExpiry, Math.min(remaining, 2147483647))
    }
    scheduleExpiry()
    return () => {
      controller.abort()
      clearTimeout(timer)
    }
  }, [token, attempt, dispatch])

  return {
    ...auth,
    verified: !!token && verifiedToken === token && auth.is_authenticated,
    retry: () => setAttempt((value) => value + 1),
  }
}
