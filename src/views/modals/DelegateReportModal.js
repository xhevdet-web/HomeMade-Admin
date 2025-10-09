import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CButton,
  CCol,
  CForm,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import { fetchDataByType } from '../utils/getListByListTypeId'
import useAxios from '../../utils/useAxios'

const DelegateReportModal = ({ message, defaultData, handleModalClose, callback }) => {
  const [listTypes, setListTypes] = useState([])

  const [userRoles, setUserRoles] = useState([])
  const [users, setUsers] = useState([])

  // const [reportAllData, setReportAllData] = useState([])

  const { axiosRequest, isLoading } = useAxios()

  const [data, setData] = useState({
    status_id: null,
    report_id: '',
    delegated_to: '',
    delegated_to_user: '',
    user_role_id: defaultData.user_role_id,
  })

  const handleChange = async (e) => {
    const { value, name } = e.target

    setData((prevState) => ({
      ...prevState,
      [name]: value,
    }))

    if (name === 'delegated_to') {
      try {
        const response = await axiosRequest(`/users/${value}`, 'get')
        setUsers(response?.data || [])
      } catch (error) {
        console.error('Error fetching users by role:', error.message)
      }
    }
  }

  const getListsData = async () => {
    try {
      const data = await fetchDataByType('report_status', axiosRequest)
      setListTypes(data)
    } catch (error) {
      console.error('Error fetching categories:', error.message)
    }
  }

  const getUserRoles = async () => {
    try {
      const data = await axiosRequest('/user-roles/allowed/all', 'get')
      setUserRoles(data?.data)

      // const reportData = await axiosRequest(`/reports/${defaultData?.id}`, 'get')
      // setReportAllData(reportData?.data)
    } catch (error) {
      console.error('Error fetching roles:', error.message)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    const payload = {
      status_id: 20,
      report_id: defaultData.id,
      delegated_to: data.delegated_to,
      delegated_to_user: data.delegated_to_user,
      user_role_id: defaultData.user_role_id,
      reporter_email: defaultData?.email,
      reporter_full_name: defaultData?.full_name
    }

    try {
      const response = await axiosRequest('/reports/delegatedTo', 'post', payload)

      if (response?.status === 200 || response?.status === 201) {
        callback(response.data)
      } else {
        console.error('Failed to submit data:', response)
      }
      handleModalClose()
    } catch (error) {
      console.error('Error during submission:', error.message)
    }
  }

  useEffect(() => {
    getListsData()
    getUserRoles()
  }, [])

  return (
    <CModal
      backdrop="static"
      visible
      size="xl"
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">Delego Raportimin</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <CRow className="h-auto">
            {/* <CCol md={12}>
              <CFormSelect
                name="status_id"
                onChange={handleChange}
                value={data.status_id}
                className="mt-3"
                aria-label="Statusi i rastit"
                floatingLabel="Statusi i rastit"
              >
                {listTypes?.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.name}
                  </option>
                ))}
        
              </CFormSelect>
            </CCol> */}

            <CCol md={6}>
              <CFormSelect
                name="delegated_to"
                onChange={handleChange}
                value={data.delegated_to}
                className="mt-3"
                aria-label="Delego rastin tek roli"
                floatingLabel="Delego rastin tek roli"
              >
                <option value="">Zgjidh një rol</option>
                {userRoles?.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>

            <CCol md={6}>
              <CFormSelect
                name="delegated_to_user"
                onChange={handleChange}
                value={data.delegated_to_user}
                className="mt-3"
                aria-label="Delego tek përdoruesi"
                floatingLabel="Delego tek përdoruesi"
                disabled={!users.length} // Disable if no users are available
              >
                <option value="">Zgjidh një përdorues</option>
                {users?.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.full_name}
                  </option>
                ))}
              </CFormSelect>
            </CCol>
          </CRow>
        </CModalBody>
        <CModalFooter>
          <CButton disabled={isLoading} type="submit" color="primary">
            Delego Rastin
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

DelegateReportModal.propTypes = {
  message: PropTypes.string,
  defaultData: PropTypes.object,
  handleModalClose: PropTypes.func.isRequired,
  callback: PropTypes.func.isRequired,
}

export default DelegateReportModal
