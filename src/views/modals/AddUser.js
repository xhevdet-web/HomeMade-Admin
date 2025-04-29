import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { useToast, useValidation } from '../../_helpers'
import { CustomButton } from '../../components'

const AddUser = ({ message, handleModalClose, type, defaultData, callback }) => {
  const [data, setData] = useState(
    defaultData || {
      first_name: '',
      last_name: '',
      email: '',
      password: '',
      role_id: ''
    }
  )

  const [roles, setRoles] = useState([])
  const [loading, setLoading] = useState(true)

  const { axiosRequest, isLoading } = useAxios()
  const { validateForm, validated } = useValidation()
  const { showToast } = useToast()

  const handleChange = (e) => {
    const { name, value } = e.target
    setData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    // const form = e.target

    // if (!validateForm(form)) {
    //   e.stopPropagation()
    //   return
    // }

    try {
      const payload = {
        first_name: data.first_name,
        last_name: data.last_name,
        email: data.email,
        password: data.password,
        role_id: data.role_id,
      }
      await axiosRequest('/auth/register', 'post', payload, handleModalClose)
      callback()
      // showToast('Success', 'User registered successfully.')
    } catch (error) {
      showToast('Error', error?.response?.data?.message || 'Failed to register user.')
      console.error('Registration Error:', error)
    }
  }

  const fetchRoles = async () => {
    try {
      const { data } = await axiosRequest('user-roles/all', 'get')
      setRoles(data)
    } catch (error) {
      console.error('Failed to fetch roles:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoles()
  }, [])

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      {loading ? (
        <div className="text-center py-5">
          <CSpinner />
        </div>
      ) : (
        <>
          <CModalHeader>
            <CModalTitle id="StaticBackdropExampleLabel">
              {type === 'edit' ? 'Edit User' : 'Add User'}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmit} noValidate validated={validated}>
            <CModalBody>
              <CFormInput
                type="text"
                name="first_name"
                value={data.first_name}
                onChange={handleChange}
                floatingLabel="First Name"
                required
                className="mt-2"
              />
              <CFormInput
                type="text"
                name="last_name"
                value={data.last_name}
                onChange={handleChange}
                floatingLabel="Last Name"
                required
                className="mt-2"
              />
              <CFormInput
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                floatingLabel="Email"
                required
                className="mt-2"
              />
              <CFormInput
                type="password"
                name="password"
                value={data.password}
                onChange={handleChange}
                floatingLabel="Password"
                required
                className="mt-2"
              />
              <CFormSelect
                name="role_id"
                value={data.role_id || ''}
                onChange={handleChange}
                floatingLabel="Select Role"
                required
                className="mt-2"
              >
                <option value="" disabled hidden>
                  Select a role
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </CFormSelect>

            </CModalBody>
            <CModalFooter>
              <CustomButton type="button" actionType="secondary" onClick={handleModalClose}>
                Close
              </CustomButton>
              <CustomButton type="submit" actionType="save" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <CSpinner size="sm" /> Saving...
                  </>
                ) : (
                  'Save'
                )}
              </CustomButton>
            </CModalFooter>
          </CForm>
        </>
      )}
    </CModal>
  )
}

AddUser.propTypes = {
  message: PropTypes.string,
  handleModalClose: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  defaultData: PropTypes.object.isRequired,
  callback: PropTypes.func.isRequired
}

export default AddUser
