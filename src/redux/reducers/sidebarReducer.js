import * as types from '../actions/sidebarActionTypes'

const initialState = {
  links: [],
  current_view: null,
}

const sidebarReducer = (state = initialState, action) => {
  switch (action.type) {
    
    case types.RESET_ALL_STATE:
      return initialState

    case types.SET_LINKS:
      return {
        ...state,
        links: action.payload,
      }

    case types.SET_CURRENT_VIEW:
      return {
        ...state,
        current_view: action.payload,
      }

    case types.CLEAR:
      return {
        links: [],
      }

    default:
      return state
  }
}

export default sidebarReducer
