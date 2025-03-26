// authSelectors.js

import { useSelector } from 'react-redux'

// Custom hook to select authentication state
export const useAuthSelector = () => {
  const isAuthenticated = useSelector((state) => state?.auth?.is_authenticated)
  // const isAuthenticated = true // DEBUGGING PURPOSES ONLY! REMOVE LATER!!!
  const userData = useSelector((state) => state?.auth?.user_data)
  
  const token = useSelector((state) => state?.auth?.token)
  // const userData = { name: 'filani', surename: 'testues' } // DEBUGGING PURPOSES ONLY! REMOVE LATER!!!

  return { isAuthenticated, userData, token }
}
