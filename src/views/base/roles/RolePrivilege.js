import React, { useEffect, useState } from 'react'
import {
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CFormCheck,
  CButton,
  CFormInput,
} from '@coreui/react'
import { useLocation } from 'react-router-dom'
import { useModal } from '../../../_helpers/index.js'
import useAxios from '../../../utils/useAxios'
import { useToast } from '../../../_helpers'
import { checkUserPermissions } from '../../../_helpers'
import { useAuthSelector } from '../../../redux/selectors/authSelectors'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'
import CustomButton from '../../../components/CustomButton'

const RolePrivilege = () => {
  const { showToast } = useToast()
  const location = useLocation()
  const { item, roles } = location?.state
  const [actions, setActions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [tempRoleRights, setTempRoleRights] = useState({})
  const [delegationRights, setDelegationRights] = useState([])
  const { showModal } = useModal()
  const { sidebarData } = useSidebarSelector()

  const navItem = sidebarData?.find((el) => el.to === location.pathname)
  const { userData } = useAuthSelector()
  const roleId = userData.role_id
  const { axiosRequest } = useAxios()

  const fetchActions = async () => {
    const { data } = await axiosRequest(`/nav/all?role_id=${item.id}`, 'get')
    const roleCreationRights = await axiosRequest(`/role-delegation-rights/${item.id}/all`, 'get')
    setDelegationRights(roleCreationRights.data ?? [])
    setActions(data)
  }

  useEffect(() => {
    fetchActions()
  }, [])

  const getRoleRightsForNav = (navItem) => {
    return navItem.nav_rights?.[0] || {}
  }

  const handleEditPrivilege = (navId) => {
    setEditingId((prev) => {
      if (prev === navId) {
        return null
      } else {
        const navItem = actions.find((nav) => nav.id === navId)
        const roleRight = getRoleRightsForNav(navItem)
        setTempRoleRights({ ...roleRight })
        return navId
      }
    })
  }

  const handleCheckboxChange = (operation) => {
    setTempRoleRights((prev) => ({
      ...prev,
      [operation]: !prev[operation],
    }))
  }

  const prepareRequestBody = () => {
    const roleRight = tempRoleRights
    return {
      id: roleRight.id,
      nav_id: roleRight.nav_id,
      create: roleRight.create,
      read: roleRight.read,
      update: roleRight.update,
      delete: roleRight.delete,
    }
  }

  const handleSaveChanges = async (elementId) => {
    const requestBody = prepareRequestBody(elementId)

    try {
      const response = await axiosRequest('/role-rights/update', 'put', requestBody)

      if (response.status === 'Success') {
        const updatedActions = actions.map((nav) => {
          if (nav.id === elementId) {
            return {
              ...nav,
              nav_rights: [{ ...nav.nav_rights?.[0], ...response.data }],
            }
          }
          return nav
        })

        setActions(updatedActions)
        setEditingId(null)
        setTempRoleRights({})
      }
    } catch (error) {
      console.error('Error in handleSaveChanges: ', error)
      showToast('Error', 'Ndodhi një gabim gjatë ruajtjes së ndryshimeve.')
    }
  }

  const handleCancelChanges = () => {
    setEditingId(null)
    setTempRoleRights({})
    showToast('Info', 'Modifikimi i rolit u anulua!')
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={12}>
          <h4 id="traffic" className="card-title mb-0">
            {item?.name} - Role Privileges
          </h4>
        </CCol>
      </CRow>
      <CTable align="middle" className="mb-0 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary">Privilege Name</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Read</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Create</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Update</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Delete</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {actions?.map((action, index) => {
            const roleRight = getRoleRightsForNav(action)
            const isEditing = editingId === action.id
            const currentRights = isEditing ? tempRoleRights : roleRight
            return (
              <CTableRow key={index}>
                <CTableDataCell>
                  <div>{action.to.includes('/admin/') ? <b>ADMIN -&gt; {action.title}</b> : <i>Client -&gt; {action.title}</i>}</div>
                </CTableDataCell>
                <CTableDataCell className="text-center col-2">
                  <CFormCheck
                    id={`read-${action.id}`}
                    checked={currentRights.read || false}
                    disabled={!isEditing}
                    onChange={() => handleCheckboxChange('read')}
                  />
                </CTableDataCell>
                <CTableDataCell className="text-center col-2">
                  <CFormCheck
                    id={`create-${action.id}`}
                    checked={currentRights.create || false}
                    disabled={!isEditing}
                    onChange={() => handleCheckboxChange('create')}
                  />
                </CTableDataCell>
                <CTableDataCell className="text-center col-2">
                  <CFormCheck
                    id={`update-${action.id}`}
                    checked={currentRights.update || false}
                    disabled={!isEditing}
                    onChange={() => handleCheckboxChange('update')}
                  />
                </CTableDataCell>
                <CTableDataCell className="text-center col-2">
                  <CFormCheck
                    id={`delete-${action.id}`}
                    checked={currentRights.delete || false}
                    disabled={!isEditing}
                    onChange={() => handleCheckboxChange('delete')}
                  />
                </CTableDataCell>
                <CTableDataCell className="text-center col-2">
                  {isEditing ? (
                    <>
                      <CButton
                        className="text-white me-2"
                        color="success"
                        onClick={() => handleSaveChanges(action.id)}
                      >
                        Save
                      </CButton>
                      <CButton className="text-white" color="danger" onClick={handleCancelChanges}>
                        Cancel
                      </CButton>
                    </>
                  ) : (
                    <CButton
                      className="text-white"
                      color="info"
                      onClick={() => handleEditPrivilege(action.id)}
                    >
                      Edit
                    </CButton>
                  )}
                </CTableDataCell>
              </CTableRow>
            )
          })}
        </CTableBody>
      </CTable>
    </>
  )
}

export default RolePrivilege
