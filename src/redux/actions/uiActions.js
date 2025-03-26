export const SET_SIDEBAR_SHOW = 'SET_SIDEBAR_SHOW'
export const SET_SIDEBAR_UNFOLDABLE = 'SET_SIDEBAR_UNFOLDABLE'
export const SET_THEME_MODE = 'SET_THEME_MODE'

export const setSidebarShow = (state) => ({
  type: SET_SIDEBAR_SHOW,
  payload: state,
})
export const setSidebarUnfoldable = (state) => ({
  type: SET_SIDEBAR_UNFOLDABLE,
  payload: state,
})
export const setThemeMode = (state) => ({
  type: SET_THEME_MODE,
  payload: state,
})
