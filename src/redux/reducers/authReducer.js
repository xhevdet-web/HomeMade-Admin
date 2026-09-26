import * as types from '../actions/authActionTypes'

export const initialAuthState = {
  token: null,
  user_data: null,
  is_authenticated: false,
  status: 'idle',
  message: null,
}

const authReducer = (state = initialAuthState, action) => {
  switch (action.type) {
    case types.SET_USER_TOKEN:
      return { ...initialAuthState, token: action.payload, status: 'checking' }
    case types.SET_USER_DATA:
      if (action.payload?.role !== 'ADMIN') {
        return {
          ...initialAuthState,
          message: 'Access denied. An administrator account is required.',
        }
      }
      return {
        ...state,
        user_data: action.payload,
        is_authenticated: !!state.token,
        status: 'ready',
        message: null,
      }
    case types.SET_AUTH_STATUS:
      return { ...state, ...action.payload, is_authenticated: false, user_data: null }
    case types.CLEAR_USER_PERMISSIONS:
      return { ...initialAuthState, message: action.payload || null }
    default:
      return state
  }
}

export default authReducer
