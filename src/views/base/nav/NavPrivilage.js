import React from 'react'
import {
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
} from '@coreui/react'
import avatar2 from 'src/assets/images/avatars/2.jpg'
import { cibCcVisa, cibSuperuser, cifBr } from '@coreui/icons'
import { useLocation } from 'react-router-dom'
import { useModal } from '../../../_helpers/HandleModals'

import { CustomButton } from '../../../components'

const ActionPrivilege = () => {
  const { showModal } = useModal()

  const tableExample = [
    {
      avatar: { src: cibSuperuser, status: 'success' },
      user: {
        name: 'Modifiko Profilin',
      },

      usage: {
        value: 100,
        period: 'Jun 11, 2023 - Jul 10, 2024',
        color: 'success',
      },
    },
    {
      avatar: { src: avatar2, status: 'danger' },
      user: {
        name: 'Paraqit provime',
        new: false,
        registered: 'Jan 1, 2023',
      },
      country: { name: 'Brazil', flag: cifBr },
      usage: {
        value: 22,
        period: 'Jun 11, 2023 - Jul 10, 2023',
        color: 'info',
      },
      payment: { name: 'Visa', icon: cibCcVisa },
      activity: '5 minutes ago',
    },
  ]
  const location = useLocation()
  const { item } = location?.state
  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 id="traffic" className="card-title mb-0">
            {item?.component_name} - Functions
          </h4>
        </CCol>

        <CCol sm={5} className="text-end">
          <CustomButton actionType="create" onClick={() => showModal('AddActionFunction')}>
            CREATE NEW
          </CustomButton>
        </CCol>
      </CRow>
      <CTable align="middle" className="mb-0 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary">Privilage Name</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {tableExample.map((item, index) => (
            <CTableRow v-for="item in tableItems" key={index}>
              <CTableDataCell>
                <div>{item.user.name}</div>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  )
}

export default ActionPrivilege
