import React, { useEffect, useState } from 'react'
import { CToast, CToastHeader } from '@coreui/react'
const ToastAsync = () => {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds + 1)
    }, 1000)
    return () => clearInterval(intervalId)
  }, [])

  return (
    <CToast className="costum_async_toast_header" visible={true} autohide={false} delay={2000}>
      <CToastHeader className="costum_async_toast" closeButton>
        <i className="fa-solid fa-gear fa-spin "></i>
        <div className="fw-bold me-auto ms-2 costum_alert_title_async">Processig ...</div>
        <small>{seconds} seconds ago</small>
      </CToastHeader>
    </CToast>
  )
}

export default ToastAsync
