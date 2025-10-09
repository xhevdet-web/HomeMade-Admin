export const SET_LINKS = 'SET_LINKS'
export const SET_CURRENT_VIEW = 'SET_CURRENT_VIEW'
export const RESET_ALL_STATE = 'RESET_ALL_STATE'

export const setSidebarData = (links) => ({
  type: SET_LINKS,
  payload: links,
})

export const setCurrentView = (viewID) => ({
  type: SET_CURRENT_VIEW,
  payload: viewID,
})

export const resetAllState = () => ({
  type: RESET_ALL_STATE,
});