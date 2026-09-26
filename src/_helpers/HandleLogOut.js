import { useDispatch } from 'react-redux'
import { clearUserPermissions } from '../redux/actions/authActionTypes'
import { resetAllState } from '../redux/actions/sidebarActionTypes'

const useLogout = () => {
  const dispatch = useDispatch()
  const handleLogout = (event) => {
    event?.preventDefault()
    // The backend has no logout/revocation endpoint.
    dispatch(clearUserPermissions())
    dispatch(resetAllState())
  }
  return { handleLogout }
}
export default useLogout
