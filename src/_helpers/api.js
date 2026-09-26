import axios from 'axios'
import { store } from '../redux/store'
import { clearUserPermissions } from '../redux/actions/authActionTypes'
import { isTokenExpired } from './IsTokenExpired'

const api = axios.create({
  baseURL: import.meta.env.VITE_APP_API,
  timeout: 15000,
})

api.interceptors.request.use((config) => {
  const token = store.getState().auth.token
  if (config.skipAuth) return config
  if (token && isTokenExpired(token)) {
    store.dispatch(clearUserPermissions('Your session has expired. Please sign in again.'))
    return Promise.reject(new axios.CanceledError('Session expired'))
  }
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = store.getState().auth.token
    // A late response from an old session must not sign out a new session.
    if (
      error.response?.status === 401 &&
      token &&
      !error.config?.skipAuth &&
      error.config?.headers?.Authorization === `Bearer ${token}`
    ) {
      store.dispatch(clearUserPermissions('Your session has expired. Please sign in again.'))
    }
    return Promise.reject(error)
  },
)

export const apiErrorMessage = (
  error,
  fallback = 'Unable to complete the request. Please try again.',
) => {
  if (axios.isAxiosError(error) && !error.response) {
    return 'Unable to reach HomeMade. Check your connection and try again.'
  }
  const message = error.response?.data?.message
  return Array.isArray(message)
    ? message.join(' ')
    : typeof message === 'string'
      ? message
      : fallback
}

export default api
