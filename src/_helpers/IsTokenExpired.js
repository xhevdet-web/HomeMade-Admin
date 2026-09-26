import { jwtDecode } from 'jwt-decode'

export const tokenExpiresAt = (token) => {
  try {
    const { exp } = jwtDecode(token)
    return typeof exp === 'number' && Number.isFinite(exp) ? exp * 1000 : 0
  } catch {
    return 0
  }
}

// This is only an expiry check. The backend validates the signature and user.
export const isTokenExpired = (token) => tokenExpiresAt(token) <= Date.now()
