import { isTokenExpired } from '../../_helpers/IsTokenExpired'
import { SET_USER_TOKEN, clearUserPermissions } from '../actions/authActionTypes'

const authMiddleware = () => (next) => (action) => {
  if (action.type === SET_USER_TOKEN && isTokenExpired(action.payload)) {
    return next(clearUserPermissions('Your session is invalid or expired. Please sign in again.'))
  }
  return next(action)
}

export default authMiddleware
