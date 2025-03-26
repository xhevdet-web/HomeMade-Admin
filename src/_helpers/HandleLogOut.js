import { useDispatch } from 'react-redux'
import useAxios from '../utils/useAxios'
import { useAuthSelector } from '../redux/selectors/authSelectors'
import { clearUserPermissions } from '../redux/actions/authActionTypes'

const useLogout = () => {
  const dispatch = useDispatch()
  const { axiosRequest } = useAxios()
  const { token } = useAuthSelector()

  const handleLogout = async (event) => {
    event.preventDefault()
    try {
      const logOutResponse = await axiosRequest('/auth/logout', 'post', { token })
      if (logOutResponse?.status === 'Success') {
        dispatch(clearUserPermissions())
      } else {
        dispatch(clearUserPermissions())
      }
    } catch (error) {
      console.error('Logout error:', error)
    }
  }

  return { handleLogout }
}

export default useLogout
