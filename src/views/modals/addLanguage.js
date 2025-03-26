import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  CForm,
  CFormCheck,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { CustomButton } from '../../components'

const AddLanguage = ({ message, defaultData, type, handleModalClose }) => {
  console.log('AddLanguage', message)
  const { axiosRequest, isLoading } = useAxios()
  const [data, setData] = useState(
    (defaultData && defaultData) || {
      name: '',
      image_url: '',
      is_active: false,
      is_default: false,
      code: '',
    },
  )

  const handleChange = (e) => {
    const { value, name, type, checked } = e.target
    setData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  let url = ''
  let method = ''
  if (type === 'put') {
    url = `languages`
    method = 'put'
  } else if (type === 'post') {
    url = 'languages'
    method = 'post'
  }
  // else if (type === 'delete') {
  //   url = `languages/${data.id}`
  //   method = 'languages'
  // }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await axiosRequest(url, method, data, handleModalClose)
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
        <CModalTitle id="StaticBackdropExampleLabel">Shto një gjuhë!</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CFormInput
            type="text"
            onChange={handleChange}
            name="name"
            id="name"
            placeholder="Language name"
            aria-label="default input example"
            defaultValue={data?.name}
          />
          {/* <CFormInput
            type="file"
            onChange={handleChange}
            name="image_url"
            id="image_url"
            aria-label="photo input example"
            className="mt-2"
            // defaultValue={data?.image_url}
          /> */}
          <CFormInput
            type="text"
            onChange={handleChange}
            name="image_url"
            id="image_url"
            floatingLabel="Image URL"
            placeholder="Image URL"
            aria-label="default input example"
            defaultValue={data?.image_url}
            className="mt-2"
          />

          <CFormCheck
            type="checkbox"
            onChange={handleChange}
            floatingLabel="Is default?"
            name="is_default"
            id="is_default"
            label="Default"
            className="mt-2"
            checked={data.is_default}
          />
          <CFormInput
            type="text"
            onChange={handleChange}
            name="code"
            id="code"
            floatingLabel="Code"
            placeholder="Code"
            aria-label="XK"
            defaultValue={data?.code}
          />
        </CModalBody>
        <CModalFooter>
          <CustomButton
            disabled={isLoading}
            type="submit"
            actionType={type === 'put' ? 'edit' : 'save'}
          >
            {type === 'put' ? 'Ruaj ndryshimet' : 'Shto'}
          </CustomButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

AddLanguage.propTypes = {
  message: PropTypes.string,
  type: PropTypes.string.isRequired,
  defaultData: PropTypes.object,
  handleModalClose: PropTypes.func.isRequired,
}

export default AddLanguage
