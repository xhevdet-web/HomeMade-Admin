import { useState } from 'react'
import axios from './axiosInstance'
import { useToast } from '../_helpers/ToastProvider'

const useAxios = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const { showToast } = useToast()

  const axiosRequest = async (url, method, data = null, handleModalClose) => {
    setIsLoading(true)
    try {
      const axiosMethod = {
        get: axios.get,
        post: axios.post,
        put: axios.put,
        delete: axios.delete,
        patch: axios.patch,
      }[method]

      if (!axiosMethod) {
        throw new Error(`Invalid method '${method}'`)
      }
      if (method !== 'get') {
        showToast('async', 'show')
      }
      return axiosMethod(url, data)
        .then((res) => {
          showToast('async', 'hide')
          if (method !== 'get') {
            showToast(res?.data?.status || 'Success', res?.data?.message)
          }
          setIsLoading(false)
          if (method !== 'get') {
            try {
              handleModalClose && handleModalClose()
            } catch (error) {
              console.error('Invalid close function!')
            }
          }
          return res?.data
        })
        .catch((error) => {
          setIsLoading(false)
          showToast('async', 'hide')
          if (method !== 'get') {
            showToast(
              error?.response?.data?.status || 'Error',
              error?.response?.data?.message || 'Server error!',
            )
          }
          // The shared API interceptor handles session expiry and all 401s.
          setError(error)
          return error
        })
    } catch (error) {
      showToast('async', 'hide')
      showToast(
        'Error',
        'An error occurred during your request. Please contact the front administration!',
        error,
      )
      console.log('errorerror', error)
      setIsLoading(false)
      setError(error)
    }
  }

  return { axiosRequest, isLoading, error }
}

export default useAxios
