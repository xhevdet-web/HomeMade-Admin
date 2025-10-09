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
  CProgress,
  CButton,
  CNavLink,
} from '@coreui/react'
import { NavLink, useLocation } from 'react-router-dom'
import { useModal } from '../../../_helpers/HandleModals'
import useAxios from '../../../utils/useAxios'

const Roles = () => {
  const { showModal } = useModal()

  const [roles, setAllRoles] = useState([])
  const { axiosRequest } = useAxios()

  const getAllRoles = async () => {
    let { data } = await axiosRequest('/user-roles/all', 'get')
    setAllRoles(data)
  }

  useEffect(() => {
    getAllRoles()
  }, [])

  const calculateUsage = (roleRights) => {
    if (!roleRights || roleRights?.length === 0) return 0
    const totalRights = roleRights?.length * 4
    const trueRights = roleRights.reduce((acc, right) => {
      return (
        acc +
        (right.create ? 1 : 0) +
        (right.read ? 1 : 0) +
        (right.update ? 1 : 0) +
        (right.delete ? 1 : 0)
      )
    }, 0)
    return (trueRights / totalRights) * 100
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 id="traffic" className="card-title mb-0">
            Roles
          </h4>
        </CCol>
        <CCol sm={5} className="text-end">
          <CButton
            size="sm"
            color="info"
            className="text-white text-bold px-4 "
            onClick={() => showModal('AddRole', '', 'post')}
          >
            CREATE NEW
          </CButton>
        </CCol>
      </CRow>

      <CTable align="middle" className="mb-0 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Controll Allowance</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary text-center">
              Modify Privileges
            </CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {roles?.map((item, index) => {
            console.log("first", item)
            const usageValue = calculateUsage(item.rights)
            const usagePeriod = `${item.rights?.length} Navs`
            const usageColor = usageValue > 75 ? 'success' : usageValue > 50 ? 'warning' : 'danger'
            return (
              <CTableRow key={index}>
                <CTableDataCell>
                  <div>{item.name}</div>
                </CTableDataCell>
                <CTableDataCell>
                  <div className="d-flex justify-content-between text-nowrap">
                    <div className="fw-semibold">{usageValue.toFixed(2)}%</div>
                    <div className="ms-3">
                      <small className="text-body-secondary">{usagePeriod}</small>
                    </div>
                  </div>
                  <CProgress thin color={usageColor} value={usageValue} />
                </CTableDataCell>
                <CTableDataCell className="text-center">
                  <CNavLink to="/admin/role-privilege" as={NavLink} state={{ item, roles }}>
                    <CButton size="sm" color="info" className="text-white text-bold px-4">
                      Modify
                    </CButton>
                  </CNavLink>
                </CTableDataCell>
              </CTableRow>
            )
          })}
        </CTableBody>
      </CTable>
    </>
  )
}

export default Roles
