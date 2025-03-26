import React, { createContext, useCallback, useContext, useState, useMemo } from 'react'
import PropTypes from 'prop-types'
import { CAlert, CAlertHeading, CCarousel, CCarouselItem } from '@coreui/react'

const AlertContext = createContext()

export const useAlert = () => {
  return useContext(AlertContext)
}

const HandleAlerts = ({ children }) => {
  const [alerts, setAlerts] = useState([])

  // Memoize alerts to avoid recomputing unnecessarily
  const showAlert = useCallback(
    (id, type, title, message) => {
      if (!id || !type || !title || !message) {
        console.error('Alert id, type, title, and message are required')
        return
      }
      setAlerts((prevAlerts) => {
        const alertExists = prevAlerts.some((alert) => alert.message === message)
        if (!alertExists) {
          return [...prevAlerts, { id, type, title, message }]
        }
        return prevAlerts
      })
    },
    [],
  )

  const clearAlerts = useCallback(() => {
    setAlerts([])
  }, [])

  // Determine if carousel is needed
  const isCarousel = useMemo(() => alerts.length > 1, [alerts])

  return (
    <AlertContext.Provider value={{ showAlert, clearAlerts }}>
      {isCarousel ? (
        <CCarousel indicators={true} pause="hover" touch={true} wrap={true}>
          {alerts.map((alert) => (
            <CCarouselItem key={alert.id}>
              <CAlert color={alert.type}>
                <CAlertHeading as="h4">{alert.title}</CAlertHeading>
                {alert.id.startsWith('unique') ? (
                  <div dangerouslySetInnerHTML={{ __html: alert.message }} />
                ) : (
                  <p>{alert.message}</p>
                )}
              </CAlert>
            </CCarouselItem>
          ))}
        </CCarousel>
      ) : (
        alerts.map((alert) => (
          <CAlert key={alert.id} color={alert.type}>
            <CAlertHeading as="h4">{alert.title}</CAlertHeading>
            {(alert.id.startsWith('unique_') || alert.id.startsWith('excused_unique_')) ? (
              <div dangerouslySetInnerHTML={{ __html: alert.message }} />
            ) : (
              <p>{alert.message}</p>
            )}
          </CAlert>
        ))
      )}
      {children}
    </AlertContext.Provider>
  )
}

HandleAlerts.propTypes = {
  children: PropTypes.node,
}

export default HandleAlerts
