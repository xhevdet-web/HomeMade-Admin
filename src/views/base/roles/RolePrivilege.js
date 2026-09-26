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
import { useModal } from '../../../_helpers/HandleModals'
import useAxios from '../../../utils/useAxios'
import { useToast } from '../../../_helpers'
import { checkUserPermissions } from '../../../_helpers'
import { useAuthSelector } from '../../../redux/selectors/authSelectors'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'
import { CustomButton } from '../../../components'

const RolePrivilege = () => {
  const { showToast } = useToast()
  const location = useLocation()
  const { item, roles } = location.state || {}
  const [actions, setActions] = useState([])
  const [editingId, setEditingId] = useState(null)
  const [tempRoleRights, setTempRoleRights] = useState({})
  const [delegationRights, setDelegationRights] = useState([])
  const { showModal } = useModal()
  const { sidebarData } = useSidebarSelector()

  const navItem = sidebarData?.find((el) => el.to === location.pathname)
  const { userData } = useAuthSelector()
  const roleId = userData?.role_id
  const { axiosRequest } = useAxios()

  const fetchActions = async () => {
    const { data } = await axiosRequest('/nav/all', 'get')
    const roleCreationRights = await axiosRequest(`/role-delegation-rights/${item.id}/all`, 'get')
    setDelegationRights(roleCreationRights.data ?? [])
    setActions(data)
  }

  useEffect(() => {
    if (item) fetchActions()
  }, [])

  const getRoleRightsForNav = (navId) => {
    return item.rights?.find((roleRight) => roleRight.nav_id === navId) || {}
  }

  const handleEditPrivilege = (navId) => {
    setEditingId((prev) => {
      if (prev === navId) {
        return null
      } else {
        const roleRight = getRoleRightsForNav(navId)
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
        const updatedRoleRights = item.rights.map((roleRight) => {
          if (roleRight.nav_id === elementId) {
            return { ...roleRight, ...response.data }
          }
          return roleRight
        })

        item.rights = updatedRoleRights
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

  if (!item) {
    return <p>Select a role from the Roles page to view its privileges.</p>
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
          {/* {console.log("first", actions)} */}
          {actions.map((action, index) => {
            const roleRight = getRoleRightsForNav(action.id);
            const isEditing = editingId === action.id;
            const currentRights = isEditing ? tempRoleRights : roleRight;
            return (
              <React.Fragment key={index}>
                <CTableRow id={action.id}>
                  <CTableDataCell>
                    <div>
                      {action.to.includes('/admin/') ? (
                        <b>ADMIN -&gt; {action.title}</b>
                      ) : (
                        <i>Client -&gt; {action.title}</i>
                      )}
                    </div>
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
                        <CButton
                          className="text-white"
                          color="danger"
                          onClick={handleCancelChanges}
                        >
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
                {action.children.length > 0 &&
                  action.children.map((child, childIndex) => {
                    const childRoleRight = getRoleRightsForNav(child.id);
                    const childIsEditing = editingId === child.id;
                    const childCurrentRights = childIsEditing
                      ? tempRoleRights
                      : childRoleRight;
                    return (
                      <CTableRow color="light" key={`${index}-${childIndex}`} id={child.id}>
                        <CTableDataCell>
                          <div className="ps-4">
                            {child.to.includes('/admin/') ? (
                              <b>ADMIN -&gt; {child.title}</b>
                            ) : (
                              <i>Client -&gt; {child.title}</i>
                            )}
                          </div>
                        </CTableDataCell>
                        <CTableDataCell className="text-center col-2">
                          <CFormCheck
                            id={`read-${child.id}`}
                            checked={childCurrentRights.read || false}
                            disabled={!childIsEditing}
                            onChange={() => handleCheckboxChange('read')}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-center col-2">
                          <CFormCheck
                            id={`create-${child.id}`}
                            checked={childCurrentRights.create || false}
                            disabled={!childIsEditing}
                            onChange={() => handleCheckboxChange('create')}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-center col-2">
                          <CFormCheck
                            id={`update-${child.id}`}
                            checked={childCurrentRights.update || false}
                            disabled={!childIsEditing}
                            onChange={() => handleCheckboxChange('update')}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-center col-2">
                          <CFormCheck
                            id={`delete-${child.id}`}
                            checked={childCurrentRights.delete || false}
                            disabled={!childIsEditing}
                            onChange={() => handleCheckboxChange('delete')}
                          />
                        </CTableDataCell>
                        <CTableDataCell className="text-center col-2">
                          {childIsEditing ? (
                            <>
                              <CButton
                                className="text-white me-2"
                                color="success"
                                onClick={() => handleSaveChanges(child.id)}
                              >
                                Save
                              </CButton>
                              <CButton
                                className="text-white"
                                color="danger"
                                onClick={handleCancelChanges}
                              >
                                Cancel
                              </CButton>
                            </>
                          ) : (
                            <CButton
                              className="text-white"
                              color="info"
                              onClick={() => handleEditPrivilege(child.id)}
                            >
                              Edit
                            </CButton>
                          )}
                        </CTableDataCell>
                      </CTableRow>
                    );
                  })}
              </React.Fragment>
            );
          })}
        </CTableBody>

      </CTable>
      <hr className="mt-3" />
      <CRow className="my-3">
        <CCol sm={7}>
          <h4 id="traffic" className="card-title mb-0">
            Role Delegation Rights
          </h4>
        </CCol>
        <CCol sm={5} className="text-end">
          {checkUserPermissions(navItem, 'create', roleId) && (
            <CustomButton
              actionType="create"
              onClick={() => showModal('RoleDelegationRights', [item.id, roles], 'post')}
            >
              ALLOW NEW DELEGATION
            </CustomButton>
          )}
        </CCol>
      </CRow>

      <CTable align="middle" className="mb-0 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary">Role Name</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary "></CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary ">Can create</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center ">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {delegationRights.length === 0 ? (
            <CTableRow>
              <CTableDataCell className="text-center">
                No role creation rights found.
              </CTableDataCell>
            </CTableRow>
          ) : (
            delegationRights.map((action, index) => {
              return (
                <CTableRow key={index}>
                  <CTableDataCell className="col-3">
                    <CFormInput
                      disabled
                      placeholder={roles?.find((role) => role.id === action.role_id)?.name}
                    ></CFormInput>
                  </CTableDataCell>
                  <CTableDataCell className="col-3">
                    <div className="text-body-secondary text-center text-truncate medium">
                      Mund të delegoj raporte tek roli -{'>'}
                    </div>
                  </CTableDataCell>
                  <CTableDataCell className="col-3">
                    <CFormInput
                      disabled
                      placeholder={
                        roles?.find((role) => role.id === action.can_create_role_id)?.name
                      }
                    ></CFormInput>
                  </CTableDataCell>
                  <CTableDataCell className="col-3 text-center">
                    <CustomButton
                      actionType="delete"
                      onClick={() => handleDeleteCreationRight(action.id)}
                    >
                      Delete
                    </CustomButton>
                  </CTableDataCell>
                </CTableRow>
              )
            })
          )}
        </CTableBody>
      </CTable>
    </>
  )
}

export default RolePrivilege
