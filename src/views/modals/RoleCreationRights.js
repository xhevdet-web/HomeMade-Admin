import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  CDropdown,
  CDropdownItem,
  CDropdownMenu,
  CDropdownToggle,
  CForm,
  CFormInput,
  CFormLabel,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { CustomButton } from '../../components'

const RoleCreationRights = ({ message, defaultData, handleModalClose }) => {
  console.log('RoleCreationRights', message)
  const roles = defaultData[1]
  const [selectedRole, setSelectedRole] = useState(null)
  const [data, setData] = useState({
    role_id: defaultData[0] || '',
    can_create_role_id: '',
  })

  useEffect(() => {
    setData((prevData) => ({
      ...prevData,
      can_create_role_id: selectedRole,
    }))
  }, [selectedRole])

  const handleChange = (e) => {
    const { value, name } = e.target
    setData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
  }

  const handleSelect = (value) => {
    setSelectedRole(value)
  }

  const { axiosRequest, isLoading } = useAxios()

  const handleSubmit = async (e) => {
    e.preventDefault() // Prevent default form submission behavior
    await axiosRequest('role-creation-rights', 'post', data, handleModalClose)
  }

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="staticBackdropLabel"
    >
      <CModalHeader>
        <CModalTitle id="staticBackdropLabel">Lejo krijimin e përdoruesve me rolin...</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <div className="form-group">
            <CFormLabel htmlFor="name">Roli</CFormLabel>
            <CFormInput
              type="text"
              disabled
              onChange={handleChange}
              name="name"
              id="name"
              placeholder={roles?.find((role) => role.id === data.role_id).name}
              aria-label="Emri i rolit"
              required
            />
          </div>
          <div className="form-group">
            <CFormLabel htmlFor="roles">Mund të krijoj</CFormLabel>
            <CDropdown>
              <CDropdownToggle color="secondary">
                {selectedRole
                  ? roles.find((role) => role.id === selectedRole).name
                  : 'Zgjidhni një rol'}
              </CDropdownToggle>
              <CDropdownMenu>
                {roles?.map((elem, index) => (
                  <CDropdownItem key={index} onClick={() => handleSelect(elem.id)}>
                    {elem.name}
                  </CDropdownItem>
                ))}
              </CDropdownMenu>
            </CDropdown>
          </div>
        </CModalBody>
        <CModalFooter>
          <CustomButton onClick={handleModalClose}>Anulo</CustomButton>
          {/* <CustomButton type="submit" disabled={isLoading}>
            {isLoading ? <CSpinner size="sm" /> : 'Shto'}
          </CustomButton> */}
          <CustomButton type="submit" disabled={isLoading} actionType={isLoading ? '' : 'save'}>
            {isLoading ? <CSpinner size="sm" /> : 'Shto'}
          </CustomButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

RoleCreationRights.propTypes = {
  message: PropTypes.string,
  defaultData: PropTypes.array.isRequired,
  handleModalClose: PropTypes.func.isRequired,
}

export default RoleCreationRights
