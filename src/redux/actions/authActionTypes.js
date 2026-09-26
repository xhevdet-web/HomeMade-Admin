export const SET_USER_TOKEN = 'SET_USER_TOKEN'
export const SET_USER_DATA = 'SET_USER_DATA'
export const CLEAR_USER_PERMISSIONS = 'CLEAR_USER_PERMISSIONS'
export const SET_AUTH_STATUS = 'SET_AUTH_STATUS'

export const setUserToken = (token) => ({ type: SET_USER_TOKEN, payload: token })
export const setUserData = (user) => ({ type: SET_USER_DATA, payload: user })
export const clearUserPermissions = (message = null) => ({
  type: CLEAR_USER_PERMISSIONS,
  payload: message,
})
export const setAuthStatus = (status, message = null) => ({
  type: SET_AUTH_STATUS,
  payload: { status, message },
})
