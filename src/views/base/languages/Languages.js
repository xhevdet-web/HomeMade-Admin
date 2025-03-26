import React, { useEffect, useState } from 'react'
import {
  CCard,
  CCardBody,
  CCardHeader,
  CCol,
  CFormSwitch,
  CProgress,
  CRow,
  CTable,
  CTableBody,
  CTableDataCell,
  CTableHead,
  CTableHeaderCell,
  CTableRow,
} from '@coreui/react'

import { useModal } from '../../../_helpers/HandleModals'
import useAxios from '../../../utils/useAxios'

import { CustomButton } from '../../../components'

const Languages = () => {
  const { showModal } = useModal()
  const [languagesData, setLanguagesData] = useState([])
  const [countData, setCountData] = useState([])
  const [countForEachLang, setCountForEachLang] = useState([])
  const { axiosRequest } = useAxios()

  const fetchlanguagesData = async () => {
    const { data } = await axiosRequest('/languages/all', 'get')
    setLanguagesData(data)
    const count = await axiosRequest('/label-translations/countLabels', 'get')
    setCountData(count?.data)
    const countForEachLang = await axiosRequest(
      '/label-translations/countLabelsForEachLanguage',
      'get',
    )
    setCountForEachLang(countForEachLang?.data)
  }

  const handleEditLanguage = async (languageData) => {
    showModal('AddLanguage', languageData, 'put')
  }

  const handleActiveLanguage = (data, method) => {
    showModal('ActiveLanguage', data, method)
  }

  useEffect(() => {
    fetchlanguagesData()
  }, [])

  console.log('countForEachLang', countForEachLang)
  return (
    <>
      <CRow>
        <CRow className="mb-3">
          <CCol sm={7}>
            <h4 id="traffic" className="card-title mb-0">
              Languages
            </h4>
          </CCol>
          <CCol sm={5} className="text-end">
            <CustomButton actionType="create" onClick={() => showModal('AddLanguage', '', 'post')}>
              ADD NEW LANGUAGE
            </CustomButton>
          </CCol>
        </CRow>
        <CCol xs>
          <CTable align="middle" className="mb-0 border " hover responsive>
            <CTableHead className="text-nowrap">
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary text-center">ID</CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center">Name</CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center">Code</CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center">Active</CTableHeaderCell>
                {/* <CTableHeaderCell className="bg-body-tertiary text-center">
                  Fav-icon
                </CTableHeaderCell> */}
                <CTableHeaderCell className="bg-body-tertiary text-center">Edit</CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center">
                  Translation status
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {languagesData.map((item, index) => (
                <>
                  <CTableRow v-for="item in tableItems" key={index}>
                    <CTableDataCell className="text-center">
                      <div>{item.id}</div>
                    </CTableDataCell>
                    <CTableDataCell className="text-center">
                      <div>{item.name}</div>
                    </CTableDataCell>

                    <CTableDataCell className="text-center">
                      <div>
                        {item.code} {'  '}
                        <img src={item?.image_url} alt="URL" style={{ maxWidth: '20px' }} />
                      </div>
                    </CTableDataCell>

                    <CTableDataCell className="text-center">
                      <div>
                        {item.is_active == true ? (
                          <i className="fa fa-check text-success" />
                        ) : (
                          <i className="fa fa-times text-danger" />
                        )}
                      </div>
                    </CTableDataCell>

                    {/* <CTableDataCell className="text-center">
                    <CIcon size="xl" icon={cifAl} title={item.image_url} />
                  </CTableDataCell> */}

                    <CTableDataCell className="text-center">
                      {/* <CIcon
                        onClick={() => handleEditLanguage(item)}
                        role="button"
                        icon={cilPencil}
                      ></CIcon> */}

                      <CustomButton actionType="edit" onClick={() => handleEditLanguage(item)}>
                        Edit
                      </CustomButton>
                    </CTableDataCell>

                    <CTableDataCell className="text-center">
                      <CFormSwitch
                        className="d-flex justify-content-center"
                        id={`switch-${item.id}`}
                        checked={item.is_active}
                        onChange={() => handleActiveLanguage(item, item.is_active ? 'put' : 'add')}
                      />
                    </CTableDataCell>
                  </CTableRow>
                </>
              ))}
            </CTableBody>
          </CTable>

          <CCard className="mt-4">
            <CCardHeader>Statistics</CCardHeader>
            <CCardBody>
              <CRow>
                <CCol xs={12} md={12} xl={12}>
                  <CRow>
                    <CCol xs={6}>
                      <div className="border-start border-start-4 border-start-info py-1 px-3">
                        <div className="text-body-secondary text-truncate small">Translated</div>
                        <div className="fs-5 fw-semibold">{countData?.withTranslation}</div>
                      </div>
                    </CCol>
                    <CCol xs={6}>
                      <div className="border-start border-start-4 border-start-danger py-1 px-3 mb-3">
                        <div className="text-body-secondary text-truncate small">
                          Not translated
                        </div>
                        <div className="fs-5 fw-semibold">{countData?.withoutTranslation}</div>
                      </div>
                    </CCol>
                  </CRow>
                  <hr className="mt-0" />
                  {countForEachLang.map((item, index) => (
                    <div className="progress-group mb-4" key={index}>
                      <div className="progress-group-prepend">
                        <span className="text-body-secondary small">{item.languageName}</span>
                      </div>
                      <div className="progress-group-bars">
                        <CProgress thin color="info" value={item.withoutTranslation} />
                        <CProgress thin color="danger" value={item.withTranslation} />
                      </div>
                    </div>
                  ))}
                </CCol>
              </CRow>

              <br />
            </CCardBody>
          </CCard>
        </CCol>
      </CRow>
    </>
  )
}

export default Languages
