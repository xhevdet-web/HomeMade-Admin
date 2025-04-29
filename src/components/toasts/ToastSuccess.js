import React from 'react'
import { CToast, CToastBody, CToastHeader } from '@coreui/react'
import PropTypes from 'prop-types'

const ToastSuccess = ({ message }) => {
  return (
    <CToast className="costum_success_toast" visible={true} autohide={true} delay={2000}>
      <CToastHeader className="costum_success_toast_header" closeButton>
        <i className="fa-solid fa-check fa-shake costum_alert_success_icon"></i>
        <div className="fw-bold me-auto ms-2 costum_alert_success_title">Success</div>
      </CToastHeader>
      <CToastBody>{message}</CToastBody>
    </CToast>
  )
}

ToastSuccess.propTypes = {
  message: PropTypes.string.isRequired,
}

export default ToastSuccess
