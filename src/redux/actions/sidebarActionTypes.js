export const SET_LINKS = 'SET_LINKS'
export const CLEAR = 'CLEAR'

export const setSidebarData = (links) => ({
  type: SET_LINKS,
  payload: links,
})
export const setUserData = () => ({
  type: CLEAR,
})
