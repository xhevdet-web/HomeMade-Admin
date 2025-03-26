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
import { useModal } from '../../../_helpers/HandleModals'
import useAxios from '../../../utils/useAxios'
import { checkUserPermissions } from '../../../_helpers/UserInRole'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'
import { useAuthSelector } from '../../../redux/selectors/authSelectors'

import { CustomButton } from '../../../components'

const LabelTranslations = () => {
  const { showModal } = useModal()
  const [labelTranslationData, setLabelTranslationData] = useState()
  const [allLanguages, setAllLanguages] = useState([])
  const { sidebarData } = useSidebarSelector()
  const { userData } = useAuthSelector()
  const navItem = sidebarData?.find((el) => el.to === location.pathname)
  const roleId = userData.role_id

  const { axiosRequest } = useAxios()

  const fetchLabelTranslationData = async () => {
    const { data } = await axiosRequest('/label-translations/all', 'get')
    setLabelTranslationData(data)
  }

  const getAllLanguages = async () => {
    const { data } = await axiosRequest('/languages/allActiveLang', 'get')
    setAllLanguages(data)
  }

  const handleEditLanguage = async (labelTranslationData) => {
    showModal(
      'AddLabelTranslations',
      { labelTranslationData, allLanguages },
      'put',
      fetchLabelTranslationData,
    )
  }

  const handleDeleteLanguage = async (labelTranslationData) => {
    showModal(
      'AddLabelTranslations',
      { labelTranslationData, allLanguages },
      'delete',
      fetchLabelTranslationData,
    )
  }

  useEffect(() => {
    fetchLabelTranslationData()
    getAllLanguages()
  }, [])

  return (
    <>
      <CRow>
        <CRow className="mb-3">
          <CCol sm={7}>
            <h4 id="traffic" className="card-title mb-0">
              Label Translations
            </h4>
          </CCol>
          <CCol sm={5} className="text-end">
            {checkUserPermissions(navItem, 'create', roleId) && (
              <CustomButton
                actionType="create"
                onClick={() =>
                  showModal(
                    'AddLabelTranslations',
                    { labelTranslationData, allLanguages },
                    'post',
                    fetchLabelTranslationData,
                  )
                }
              >
                ADD NEW LABEL TRANSLATION
              </CustomButton>
            )}
          </CCol>
        </CRow>
        <CCol xs>
          <CTable align="middle" className="mb-0 border " hover responsive>
            <CTableHead className="text-nowrap">
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary text-center">COUNT</CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center">KEY</CTableHeaderCell>
                {allLanguages?.map((el, index) => {
                  return (
                    <CTableHeaderCell key={index} className="bg-body-tertiary text-center">
                      Values {el?.code}
                    </CTableHeaderCell>
                  )
                })}
                <CTableHeaderCell className="bg-body-tertiary text-center">ACTION</CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {labelTranslationData?.map((item, index) => (
                <CTableRow v-for="item in tableItems" key={index}>
                  <CTableDataCell className="text-center">
                    <div>{index + 1}</div>
                  </CTableDataCell>

                  <CTableDataCell className="text-center">
                    <div>{item.keyname}</div>
                  </CTableDataCell>
                  {item?.allValues?.map((elem, index) => {
                    return (
                      <CTableDataCell key={index} className="text-center">
                        {elem?.value}
                      </CTableDataCell>
                    )
                  })}

                  <CTableDataCell className="text-center">
                    <div className="d-flex justify-content-center gap-3">
                      {checkUserPermissions(navItem, 'update', roleId) && (
                        <CustomButton actionType="edit" onClick={() => handleEditLanguage(item)}>
                          Edit
                        </CustomButton>
                      )}
                      {checkUserPermissions(navItem, 'delete', roleId) && (
                        <CustomButton
                          actionType="delete"
                          onClick={() => handleDeleteLanguage(item)}
                        >
                          Delete
                        </CustomButton>
                      )}
                    </div>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        </CCol>
      </CRow>
    </>
  )
}

export default LabelTranslations
