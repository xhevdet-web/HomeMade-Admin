export const SET_USER_TOKEN = 'SET_USER_TOKEN'
export const CLEAR_USER_PERMISSIONS = 'CLEAR_USER_PERMISSIONS'
export const SET_USER_DATA = 'SET_USER_DATA'

export const setUserToken = (token) => ({
  type: SET_USER_TOKEN,
  payload: token,
})
export const setUserData = (userData) => ({
  type: SET_USER_DATA,
  payload: userData,
})

export const clearUserPermissions = () => ({
  type: CLEAR_USER_PERMISSIONS,
})
