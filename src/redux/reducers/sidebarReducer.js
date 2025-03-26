import * as types from '../actions/sidebarActionTypes'

const initialState = {
  links: [],
}

const sidebarReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SET_LINKS:
      return {
        links: action.payload,
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
