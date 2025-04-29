import React, { useEffect, useState } from 'react'
import { CToast, CToastBody, CToastHeader } from '@coreui/react'
import PropTypes from 'prop-types'

const ToastInfo = ({ message }) => {
  const [seconds, setSeconds] = useState(9)

  useEffect(() => {
    const intervalId = setInterval(() => {
      setSeconds((prevSeconds) => prevSeconds - 1)
    }, 1000)

    return () => clearInterval(intervalId)
  }, [])

  return (
    <CToast className="costum_info_toast" visible={true} autohide={true} delay={8000}>
      <CToastHeader className="costum_info_toast_header" closeButton>
        <i className="fa-solid fa-info fa-shake costum_alert_info_icon" />
        <div className="fw-bold me-auto ms-2 costum_alert_info_title"> Info</div>
        <small>{seconds > 0 ? seconds : '0'} seconds</small>
      </CToastHeader>
      <CToastBody>{message}</CToastBody>
    </CToast>
  )
}

ToastInfo.propTypes = {
  message: PropTypes.string.isRequired,
}

export default ToastInfo
