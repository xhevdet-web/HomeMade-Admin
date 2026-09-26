import { useSelector } from 'react-redux'

export const useAuthSelector = () => {
  const auth = useSelector((state) => state.auth)
  return { ...auth, userData: auth.user_data, isAuthenticated: auth.is_authenticated }
}
