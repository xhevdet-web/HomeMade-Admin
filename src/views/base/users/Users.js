import React, { useEffect, useState } from 'react'
import {
  CCol,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople } from '@coreui/icons'

import { useModal } from '../../../_helpers/HandleModals'
import useAxios from '../../../utils/useAxios'
import { CustomButton } from '../../../components'

const Users = () => {
  const { showModal } = useModal()
  const [usersData, setUserData] = useState([])

  const { axiosRequest } = useAxios()

  const fetchUserData = async () => {
    const { data } = await axiosRequest('/users/all', 'get')
    setUserData(data)
  }

  useEffect(() => {
    fetchUserData()
  }, [])

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 className="card-title mb-0">Users</h4>
        </CCol>
        <CCol sm={5} className="text-end">
          <CustomButton
            // actionType="create"
            onClick={() => showModal('AddUser', {}, 'post', fetchUserData)}
          >
            CREATE NEW
          </CustomButton>
        </CCol>
      </CRow>

      <CTable align="middle" className="mb-0 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary text-center">
              <CIcon icon={cilPeople} />
            </CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Email</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Role</CTableHeaderCell>

            {/* <CTableHeaderCell className="bg-body-tertiary">Actions</CTableHeaderCell> */}
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {usersData.map((user, index) => (
            <CTableRow key={user.id || index}>
              <CTableDataCell className="text-center">
                <CIcon icon={cilPeople} />
              </CTableDataCell>
              <CTableDataCell>{user.first_name} {user.last_name}</CTableDataCell>
              <CTableDataCell>{user.email}</CTableDataCell>
              <CTableDataCell>{user?.role?.name}</CTableDataCell>

              <CTableDataCell>
                <div className="d-flex gap-2">
                  {/* <CustomButton
                    actionType="edit"
                    onClick={() => showModal('AddUser', user, 'edit')}
                  >
                    Edit
                  </CustomButton> */}
                  {/* <CustomButton
                    actionType="delete"
                    onClick={() => showModal('AddUser', user, 'delete')}
                  >
                    Delete
                  </CustomButton> */}
                </div>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default Users
