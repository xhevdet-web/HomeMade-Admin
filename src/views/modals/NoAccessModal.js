import React from 'react'
import PropTypes from 'prop-types'
import {CModal, CModalBody, CModalFooter, CModalHeader, CModalTitle } from '@coreui/react'
import { CustomButton } from '../../components'

const NoAccessModal = ({ message, handleModalClose }) => {
  console.log('NoAccessModal message: ', message)
  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">Nuk keni qasje tek ky veprim!</CModalTitle>
      </CModalHeader>
      <CModalBody>
        Roli juaj nuk ka leje të kryejë këtë veprim. Si pasojë, do të ktheheni në faqen kryesore për
        shkak të këtij veprimi të ndaluar.
        {/* {message} */}
      </CModalBody>
      <CModalFooter>
        <CustomButton onClick={handleModalClose}>Në rregull!</CustomButton>
      </CModalFooter>
    </CModal>
  )
}

NoAccessModal.propTypes = {
  message: PropTypes.string.isRequired,
  handleModalClose: PropTypes.func.isRequired,
}

export default NoAccessModal
