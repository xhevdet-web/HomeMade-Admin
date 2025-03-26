import { jwtDecode } from 'jwt-decode'
import * as types from '../actions/authActionTypes'
// import { setUserPermissions } from '../actions/authActionTypes';

const authMiddleware = (store) => (next) => (action) => {
  switch (action?.type) {
    case types.SET_USER_TOKEN:
      let token = action.payload
      let decodedData = jwtDecode(token)
      store.dispatch(types.setUserData(decodedData.user_data));
    default:
      return next(action)
  }
}

export default authMiddleware
