import React, { createContext, useContext, useState, useCallback } from 'react'
import { CToaster } from '@coreui/react'
import PropTypes from 'prop-types' // Import PropTypes
import { ToastAsync, ToastSuccess, ToastError, ToastInfo } from '../components/toasts'

const ToastContext = createContext()

export const useToast = () => {
  return useContext(ToastContext)
}

export const ToastProvider = ({ children }) => {
  const [toasts, setToasts] = useState([])
  const [showAsync, setShowAsync] = useState(false)

  const showToast = useCallback((type, message) => {
    if (!type) {
      console.error('Toast type is required!')
      return
    }
    switch (type) {
      case 'async':
        if (message === 'show') {
          setShowAsync(true)
        } else if (message === 'hide') {
          setShowAsync(false)
        }
        break
      case 'Success':
        var toast = <ToastSuccess key={Date.now()} message={message} />
        setToasts((prevToasts) => [...prevToasts, toast])
        break
      case 'Info':
        var toasti = <ToastInfo key={Date.now()} message={message} />
        setToasts((prevToasts) => [...prevToasts, toasti])
        break
      case 'Error':
        var toaste = <ToastError key={Date.now()} message={message} />
        setToasts((prevToasts) => [...prevToasts, toaste])
        break
      default:
        console.error('Invalid toast type:', type)
    }
  }, [])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <CToaster className="p-3" placement="top-end">
        {showAsync && <ToastAsync key="async-toast" />}
        {toasts}
      </CToaster>
    </ToastContext.Provider>
  )
}

ToastProvider.propTypes = {
  children: PropTypes.node.isRequired,
}

export default ToastProvider
