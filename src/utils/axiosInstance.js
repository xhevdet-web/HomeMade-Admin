import axios from 'axios'
import { store } from '../redux/store'

const defaultInstance = axios.create({
  baseURL: import.meta.env.VITE_APP_API || `http://localhost:8000/api-v1`,
})

defaultInstance.interceptors.request.use(
  (config) => {
    const state = store.getState()
    const token = state.auth.token
    const NavId = state.sidebar.current_view

    if (token) {
      config.headers.Authorization = `Bearer ${token}`
      config.headers.privilageid = NavId
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// defaultInstance.interceptors.response.use(
//   (response) => {
//     return response;
//   },
//   async (error) => {
//     if (error.response && error.response.status === 403) {
//       console.log("error.response", error.response);
//       if (error.response.data.message === "You need to login again!") {
//         alert(error.response.data.message);
//         const { handleLogout } = useLogout();
//         await handleLogout();

//       }
//     }
//     return Promise.reject(error);
//   }
// );

export default defaultInstance
