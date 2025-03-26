import * as types from '../actions/authActionTypes'

// Initial state for user token
const initialState = {
  token: null,
  user_data: null,
  is_authenticated: false,
}

// Reducer function for authorization
const authReducer = (state = initialState, action) => {
  switch (action.type) {
    case types.SET_USER_TOKEN:
      return {
        ...state,
        is_authenticated: true,
        token: action.payload,
      }
    case types.SET_USER_DATA:
      return {
        ...state,
        user_data: action.payload,
      }
    case types.CLEAR_USER_PERMISSIONS:
      return {
        user_data: null,
        token: null,
        is_authenticated: false,
      }
    default:
      return state
  }
}

export default authReducer
