import React, { useEffect, useState } from 'react'
import {
  CAvatar,
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
import  checkUserPermissions  from '../../../_helpers/UserInRole'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'
import { useLocation } from 'react-router-dom'
import { useAuthSelector } from '../../../redux/selectors/authSelectors'

import { CustomButton } from '../../../components'

const Users = () => {
  const { sidebarData } = useSidebarSelector()
  const { showModal } = useModal()
  const location = useLocation()
  const navItem = sidebarData?.find((el) => el.to === location?.pathname)
  const { userData } = useAuthSelector()
  const roleId = userData.role_id

  const [usersData, setUserData] = useState([])

  const { axiosRequest } = useAxios()

  const fetchuserData = async () => {
    const { data } = await axiosRequest('/users/all', 'get')
    setUserData(data)
  }

  useEffect(() => {
    fetchuserData()
  }, [])

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 id="traffic" className="card-title mb-0">
            Users
          </h4>
        </CCol>
        <CCol sm={5} className="text-end">
          {checkUserPermissions(navItem, 'create', roleId) && (
            <CustomButton actionType="create"
              onClick={() => showModal('AddUser', { roleType: 'user' }, 'post')}
            >
              CREATE NEW
            </CustomButton>
          )}
        </CCol>
      </CRow>
      <CTable align="middle" className="mb-0 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary text-center">
              <CIcon icon={cilPeople} />
            </CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">User</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Username</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Country</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Gender</CTableHeaderCell>
            {(checkUserPermissions(navItem, 'update', roleId) ||
              checkUserPermissions(navItem, 'delete', roleId)) && (
                <CTableHeaderCell className="bg-body-tertiary">Action</CTableHeaderCell>
              )}
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {usersData.map((item, index) => (
            <CTableRow v-for="item in tableItems" key={index}>
              <CTableDataCell className="text-center">
                <CAvatar
                  size="md"
                  src={import.meta.env.VITE_IMAGES_API + item?.profile_pic}
                  // status={item?.profile_pic}
                  style={{ border: '1px solid', borderRadius: '50%' }}
                />
              </CTableDataCell>
              <CTableDataCell>
                <div>{item.first_name + ' ' + item.last_name}</div>
              </CTableDataCell>
              <CTableDataCell>
                <div className="fw-semibold text-nowrap">{item?.username}</div>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                <div>{item?.country?.name} </div>
              </CTableDataCell>
              <CTableDataCell className="text-center">
                <div>{item?.gender?.name}</div>
              </CTableDataCell>
              {(checkUserPermissions(navItem, 'update', roleId) ||
                checkUserPermissions(navItem, 'delete', roleId)) && (
                  <CTableDataCell >
                    <div className="d-flex  gap-2">
                      {checkUserPermissions(navItem, 'update', roleId) && (
                        <CustomButton
                          actionType="edit"
                          onClick={() => showModal('AddUser', item, 'edit')}
                        >
                          Edit
                        </CustomButton>
                      )}
                      {checkUserPermissions(navItem, 'delete', roleId) && (
                        <CustomButton
                          actionType="delete"
                          onClick={() => showModal('AddUser', item, 'delete')}
                        >
                          Delete
                        </CustomButton>
                      )}
                    </div>
                  </CTableDataCell>
                )}
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default Users
