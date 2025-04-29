import React from 'react'
import { CToast, CToastBody, CToastHeader } from '@coreui/react'
import PropTypes from 'prop-types'

const ToastError = ({ message }) => {
  return (
    <CToast className="costum_error_toast" visible={true} autohide={true} delay={2000}>
      <CToastHeader className="costum_error_toast_header" closeButton>
        <i className="fa-solid fa-exclamation fa-shake costum_alert_icon"></i>
        <div className="fw-bold me-auto ms-2 costum_alert_title">Error</div>
      </CToastHeader>
      <CToastBody>
        {' '}
        <p className="mb-0" dangerouslySetInnerHTML={{ __html: message }}></p>{' '}
      </CToastBody>
    </CToast>
  )
}

ToastError.propTypes = {
  message: PropTypes.string.isRequired,
}

export default ToastError
