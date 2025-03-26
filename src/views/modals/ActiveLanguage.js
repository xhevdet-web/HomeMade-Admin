import React from 'react'
import PropTypes from 'prop-types'
import {
  CForm,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'

import { CustomButton } from '../../components'

const ActiveLanguge = ({ message, defaultData, type, handleModalClose }) => {
  const { axiosRequest } = useAxios()

  console.log('ActiveLanguge', message, defaultData, type, handleModalClose)

  const handleSubmit = async () => {
    let dataSend = {
      languageId: defaultData?.id,
      code: defaultData?.code,
    }

    let url = ''
    let method = ''

    if (type === 'add') {
      url = `languages/activeLanguage`
      method = 'put'
    } else if (type === 'put') {
      url = 'languages/disableLanguage'
      method = 'put'
    }

    await axiosRequest(url, method, dataSend, handleModalClose)
  }

  return (
    <CModal
      backdrop={true}
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">Aktivizo gjuhën!</CModalTitle>
      </CModalHeader>
      <CForm>
        <CModalBody>
          <div>A jeni i sigurte qe deshironi te aktivizoni kete gjuhe?</div>
        </CModalBody>
        <CModalFooter>
          <div className="d-flex gap-3">
            <CustomButton actionType="save" onClick={handleSubmit}>
              Save
            </CustomButton>
            <CustomButton actionType="cancel" onClick={handleModalClose}>
              Cancel
            </CustomButton>
          </div>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
ActiveLanguge.propTypes = {
  handleModalClose: PropTypes.func.isRequired,
  message: PropTypes.string.isRequired,
  type: PropTypes.string.isRequired,
  defaultData: PropTypes.object,
  callback: PropTypes.func,
}
export default ActiveLanguge
