// src/views/.../Users.jsx
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
  CFormInput,
  CFormSwitch,        // <-- add this
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPeople } from '@coreui/icons'

import { useModal } from '../../../_helpers/HandleModals'
import useAxios from '../../../utils/useAxios'
import { CustomButton } from '../../../components'

const Users = () => {
  const { showModal } = useModal()
  const [users, setUsers] = useState([])
  const [meta, setMeta] = useState({ page: 1, limit: 20, total: 0 })
  const [search, setSearch] = useState('')

  const { axiosRequest, isLoading } = useAxios()

  const fetchUsers = async (page = 1, query = '') => {
    const { data } = await axiosRequest(`/users?page=${page}&limit=${meta.limit}&search=${encodeURIComponent(query)}`, 'get')
    setUsers(data?.items || [])
    setMeta({ page: data?.page || 1, limit: data?.limit || 20, total: data?.total || 0 })
  }

  useEffect(() => {
    fetchUsers(1, '')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const onCreate = () =>
    showModal('AddUser', {}, 'create', () => fetchUsers(meta.page, search))

  const onEdit = (user) =>
    showModal('AddUser', user, 'edit', () => fetchUsers(meta.page, search))

  // NEW: toggle active
  const onToggleActive = async (user, checked) => {
    try {
      await axiosRequest(`/users/${user.id}`, 'put', { is_active: checked })
      // update UI quickly
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: checked } : u))
      )
    } catch (e) {
      // if it fails, revert UI
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: user.is_active } : u))
      )
    }
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={4}>
          <h4 className="card-title mb-0">Users</h4>
        </CCol>
        <CCol sm={4}>
          {/* <CFormInput
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => {
              const q = e.target.value
              setSearch(q)
              fetchUsers(1, q)
            }}
          /> */}
        </CCol>
        <CCol sm={4} className="text-end">
          <CustomButton onClick={onCreate}>CREATE NEW</CustomButton>
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
            <CTableHeaderCell className="bg-body-tertiary">Active</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>

        <CTableBody>
          {users.map((user, index) => (
            <CTableRow key={user.id || index}>
              <CTableDataCell className="text-center">
                <CIcon icon={cilPeople} />
              </CTableDataCell>
              <CTableDataCell>{user.first_name} {user.last_name}</CTableDataCell>
              <CTableDataCell>{user.email}</CTableDataCell>
              <CTableDataCell>{user?.role?.name || '-'}</CTableDataCell>

              {/* NEW: Active switch */}
              <CTableDataCell>
                <CFormSwitch
                  size="lg"
                  checked={!!user.is_active}
                  onChange={(e) => onToggleActive(user, e.target.checked)}
                  disabled={isLoading}
                />
              </CTableDataCell>

              <CTableDataCell>
                <div className="d-flex gap-2">
                  <CustomButton actionType="edit" onClick={() => onEdit(user)}>
                    Edit
                  </CustomButton>
                </div>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>

      {meta.total > meta.limit && (
        <div className="d-flex justify-content-between align-items-center mt-3">
          <small>
            Page {meta.page} of {Math.ceil(meta.total / meta.limit)} • {meta.total} total
          </small>
          <div className="d-flex gap-2">
            <CustomButton
              actionType="secondary"
              disabled={meta.page <= 1}
              onClick={() => fetchUsers(meta.page - 1, search)}
            >
              Prev
            </CustomButton>
            <CustomButton
              actionType="secondary"
              disabled={meta.page >= Math.ceil(meta.total / meta.limit)}
              onClick={() => fetchUsers(meta.page + 1, search)}
            >
              Next
            </CustomButton>
          </div>
        </div>
      )}
    </>
  )
}

export default Users
