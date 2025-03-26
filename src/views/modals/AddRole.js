import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { CustomButton } from '../../components'

const AddRole = ({ message, defaultData, handleModalClose, callback }) => {
  console.log('AddRole message: ', message)
  const [data, setData] = useState(
    (defaultData && defaultData) || {
      name: '',
    },
  )

  const handleChange = (e) => {
    const { value, name } = e.target
    setData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const { axiosRequest, isLoading } = useAxios()

  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent default form submission behavior
    await axiosRequest('user-roles', 'post', data, handleModalClose)
    callback()
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
        <CModalTitle id="StaticBackdropExampleLabel">Shto një rol!</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CFormInput
            type="text"
            onChange={handleChange}
            name="icon"
            id="icon"
            className='mb-3'
            floatingLabel="Ikona e Rolit (font awsome)"
            placeholder="Ikona e Rolit (font awsome)"
          />

          <CFormInput
            type="text"
            onChange={handleChange}
            name="name"
            id="name"
            floatingLabel="Emri i Rolit"
            placeholder="Emri i Rolit"
          />

          {/* {message} */}
        </CModalBody>
        <CModalFooter>
          <CustomButton disabled={isLoading} type="submit" actionType="save">
            Shto
          </CustomButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

AddRole.propTypes = {
  message: PropTypes.string,
  defaultData: PropTypes.object,
  handleModalClose: PropTypes.func.isRequired,
}

export default AddRole
