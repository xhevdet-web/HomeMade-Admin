import React, { useEffect } from 'react'
import classNames from 'classnames'

import {
  CButton,
  CButtonGroup,
  CCard,
  CCardBody,
  CCardFooter,
  CCardHeader,
  CCol,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import CIcon from '@coreui/icons-react'
import { cilCloudDownload, cilUser, cilUserFemale, cilEducation } from '@coreui/icons'

// import WidgetsDropdown from '../widgets/WidgetsDropdown'
import AdminWidgets from '../widgets/adminWidgets'
// import Widgets from '../widgets/Widgets'
import MainChart from './MainChart'
import { useAlert } from '../../_helpers/HandleAlerts'

const AdminDashboard = () => {

  const majors = [
    { key: "ZHWAM", name: "Zhvillues i Web-it dhe i Aplikacioneve Mobile" },
    { key: "ARRS", name: "Administrues i Rrjetave dhe Sistemve" }
  ]

  const zhwamGr = [
    { name: 'Grupi i pare', capacity: '25' },
    { name: 'Grupi i dyte', capacity: '22' },
    { name: 'Grupi i trete', capacity: '20' }
  ]

  const arrsGr = [
    { name: 'Grupi i pare', capacity: '20' },
    { name: 'Grupi i dyte', capacity: '18' },
    { name: 'Grupi i trete', capacity: '15' }
  ]

  const recentRegistratons = [
    { nr: "556", student: "John Doe", status: "Regular Student", major: "ZHWAM", registered: "11/07/2024" },
    { nr: "557", student: "John Doe", status: "Regular Student", major: "ARRS", registered: "10/07/2024" },
    { nr: "558", student: "John Doe", status: "Early Bird", major: "ZHWAM", registered: "09/07/2024" },
    { nr: "600", student: "John Doe", status: "Regular Student", major: "ZHWAM", registered: "07/07/2024" },
  ]

  const progressExample = [
    { title: 'Total Students', value: '1200', percent: 75, color: 'success' },
    { title: 'Total Professors', value: '150', percent: 85, color: 'info' },
    { title: 'Total Majors', value: '25', percent: 60, color: 'warning' },
    { title: 'Total Groups', value: '40', percent: 90, color: 'danger' },
  ]

  const progressGroupExample1 = [
    { title: 'First Year', value1: 340, value2: 78 },
    { title: 'Second Year', value1: 456, value2: 94 },
    { title: 'Third Year', value1: 512, value2: 67 },
    { title: 'Fourth Year', value1: 243, value2: 89 },
  ]

  const progressGroupExample2 = [
    { icon: cilUserFemale, title: 'Female', value: 45, color: 'warning' },
    { icon: cilUser, title: 'Male', value: 55, color: 'success' },
  ]

  const progressGroupExample3 = [
    { icon: cilEducation, title: 'ZHWAM', value: 400, percent: 80, color: 'success' },
    { icon: cilEducation, title: 'ARRS', value: 200, percent: 40, color: 'warning' },
  ]

  const paymentHistory = [
    { date: '2023-07-01', amount: 500 },
    { date: '2023-06-15', amount: 300 },
    { date: '2023-05-20', amount: 450 },
  ]



  return (
    <>
      <AdminWidgets className="mb-4" />

      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>Academic Year</CCardHeader>
            <CCardBody>

              <h5 className="card-title">Current Academic Year</h5>
              <p className="card-text mb-5">2018-2019</p>

            </CCardBody>
          </CCard>
        </CCol>

        <CCol>
          <CCard>
            <CCardHeader> Majors</CCardHeader>

            <CCardBody>
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Key</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {majors.map((major, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{major.key}</CTableDataCell>
                      <CTableDataCell>{major.name}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      {/* <Widgets className="mb-4" /> */}

      <CRow className='mb-4'>
        <CCol>
          <CCard>
            <CCardHeader> ZHWAM Groups </CCardHeader>

            <CCardBody>
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Capacity</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {zhwamGr.map((gr, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{gr.name}</CTableDataCell>
                      <CTableDataCell>{gr.capacity}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
        <CCol>
          <CCard>
            <CCardHeader> ARRS Groups </CCardHeader>

            <CCardBody>
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">Name</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Capacity</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {arrsGr.map((gr, index) => (
                    <CTableRow key={index}>
                      <CTableDataCell>{gr.name}</CTableDataCell>
                      <CTableDataCell>{gr.capacity}</CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow>
        <CCol>
          <CCard className="mb-4">
            <CCardBody>
              <CRow>
                <CCol sm={5}>
                  <h4 id="traffic" className="card-title mb-0">Traffic</h4>
                  <div className="small text-body-secondary">January - July 2023</div>
                </CCol>
                <CCol sm={7} className="d-none d-md-block">
                  <CButton color="primary" className="float-end">
                    <CIcon icon={cilCloudDownload} />
                  </CButton>
                  <CButtonGroup className="float-end me-3">
                    {['Day', 'Month', 'Year'].map((value) => (
                      <CButton color="outline-secondary" key={value} className="mx-0" active={value === 'Month'}>
                        {value}
                      </CButton>
                    ))}
                  </CButtonGroup>
                </CCol>
              </CRow>
              <MainChart />
            </CCardBody>
            <CCardFooter>
              <CRow xs={{ cols: 1, gutter: 4 }} sm={{ cols: 2 }} lg={{ cols: 4 }} xl={{ cols: 5 }} className="mb-2 text-center">
                {progressExample.map((item, index, items) => (
                  <CCol className={classNames({ 'd-none d-xl-block': index + 1 === items.length })} key={index}>
                    <div className="text-body-secondary">{item.title}</div>
                    <div className="fw-semibold text-truncate">{item.value} ({item.percent}%)</div>
                    <CProgress thin className="mt-2" color={item.color} value={item.percent} />
                  </CCol>
                ))}
              </CRow>
            </CCardFooter>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>Next exam submission period</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol>
                  <CRow>
                    <CCol xs={6}>
                      <div className="border-start border-start-4 border-start-info py-1 px-3">
                        <div className="text-body-secondary text-truncate small">Start Date</div>
                        <div className="fs-5 fw-semibold">10/04/2019</div>
                      </div>
                    </CCol>
                    <CCol xs={6}>
                      <div className="border-start border-start-4 border-start-danger py-1 px-3 mb-3">
                        <div className="text-body-secondary text-truncate small">
                          End Date
                        </div>
                        <div className="fs-5 fw-semibold">16/04/2019</div>
                      </div>
                    </CCol>
                  </CRow>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>

        <CCol>
          <CCard>
            <CCardHeader>Next exam deadline period</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol>
                  <CRow>
                    <CCol xs={6}>
                      <div className="border-start border-start-4 border-start-warning py-1 px-3">
                        <div className="text-body-secondary text-truncate small">Start Date</div>
                        <div className="fs-5 fw-semibold">18/04/2019</div>
                      </div>
                    </CCol>
                    <CCol xs={6}>
                      <div className="border-start border-start-4 border-start-success py-1 px-3 mb-3">
                        <div className="text-body-secondary text-truncate small">
                          End Date
                        </div>
                        <div className="fs-5 fw-semibold">05/05/2019</div>
                      </div>
                    </CCol>
                  </CRow>
                </CCol>
              </CRow>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>

      <CRow className="mb-4">
        <CCol>
          <CCard>
            <CCardHeader>Recent Student Registrations</CCardHeader>
            <CCardBody>
              <CTable align="middle" className="mb-0 border" hover responsive>
                <CTableHead className="text-nowrap">
                  <CTableRow>
                    <CTableHeaderCell className="bg-body-tertiary">
                      Nr.
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Student</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Status</CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">
                      Major
                    </CTableHeaderCell>
                    <CTableHeaderCell className="bg-body-tertiary">Date</CTableHeaderCell>
                  </CTableRow>
                </CTableHead>
                <CTableBody>
                  {recentRegistratons.map((item, index) => (
                    <CTableRow v-for="item in tableItems" key={index}>
                      <CTableDataCell>
                        <div>{item.nr}</div>
                      </CTableDataCell>
                      <CTableDataCell >
                        <div>{item.student}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.status}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.major}</div>
                      </CTableDataCell>
                      <CTableDataCell>
                        <div>{item.registered}</div>
                      </CTableDataCell>
                    </CTableRow>
                  ))}
                </CTableBody>
              </CTable>
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>


      <CRow>
        <CCol xs={12} md={6} xl={6}>
          <CRow>
            <CCol xs={6}>
              <div className="border-start border-start-4 border-start-info py-1 px-3">
                <div className="text-body-secondary text-truncate small">Regular Students</div>
                <div className="fs-5 fw-semibold">520</div>
              </div>
            </CCol>
            <CCol xs={6}>
              <div className="border-start border-start-4 border-start-danger py-1 px-3 mb-3">
                <div className="text-body-secondary text-truncate small">Early Bird</div>
                <div className="fs-5 fw-semibold">80</div>
              </div>
            </CCol>
          </CRow>
          <hr className="mt-0" />
          {progressGroupExample1.map((item, index) => (
            <div className="progress-group mb-4" key={index}>
              <div className="progress-group-prepend">
                <span className="text-body-secondary small">{item.title}</span>
              </div>
              <div className="progress-group-bars">
                <CProgress thin color="info" value={item.value1} />
                <CProgress thin color="danger" value={item.value2} />
              </div>
            </div>
          ))}
        </CCol>
        <CCol xs={12} md={6} xl={6}>
          <CRow>
            <CCol xs={6}>
              <div className="border-start border-start-4 border-start-warning py-1 px-3 mb-3">
                <div className="text-body-secondary text-truncate small">Female</div>
                <div className="fs-5 fw-semibold">78</div>
              </div>
            </CCol>
            <CCol xs={6}>
              <div className="border-start border-start-4 border-start-success py-1 px-3 mb-3">
                <div className="text-body-secondary text-truncate small">Male</div>
                <div className="fs-5 fw-semibold">49</div>
              </div>
            </CCol>
          </CRow>
          <hr className="mt-0" />
          {progressGroupExample2.map((item, index) => (
            <div className="progress-group mb-4" key={index}>
              <div className="progress-group-header">
                <CIcon className="me-2" icon={item.icon} size="lg" />
                <span>{item.title}</span>
                <span className="ms-auto fw-semibold">{item.value}%</span>
              </div>
              <div className="progress-group-bars">
                <CProgress thin color={item.color} value={item.value} />
              </div>
            </div>
          ))}
          <div className="mb-5"></div>
          {progressGroupExample3.map((item, index) => (
            <div className="progress-group" key={index}>
              <div className="progress-group-header">
                <CIcon className="me-2" icon={item.icon} size="lg" />
                <span>{item.title}</span>
                <span className="ms-auto fw-semibold">
                  {item.value} <span className="text-body-secondary small">({item.percent}%)</span>
                </span>
              </div>
              <div className="progress-group-bars">
                <CProgress thin color={item.color} value={item.percent} />
              </div>
            </div>
          ))}
        </CCol>
      </CRow>

    </>
  )
}

export default AdminDashboard 
