const initialState = {
  sidebarShow: true,
  sidebarUnfoldable: false,
  theme: 'light',
}

const uiReducer = (state = initialState, action) => {
  switch (action.type) {
    case 'SET_SIDEBAR_SHOW':
      return { ...state, sidebarShow: action.payload }
    case 'SET_SIDEBAR_UNFOLDABLE':
      return { ...state, sidebarUnfoldable: action.payload }
    case 'SET_THEME_MODE':
      return { ...state, theme: action.payload }
    // Other cases...
    default:
      return state
  }
}
export default uiReducer
