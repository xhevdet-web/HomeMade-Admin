import React, { useEffect, useState } from 'react';
import {
  CCol,
  CRow,
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CButton,
  CSpinner,
} from '@coreui/react';
import { useModal } from '../../../_helpers/HandleModals';
import useAxios from '../../../utils/useAxios';
import CIcon from '@coreui/icons-react';
import { cilPencil, cilTrash } from '@coreui/icons';

const Actions = () => {
  const { showModal } = useModal();
  const [actions, setActions] = useState([]);
  const { axiosRequest, isLoading } = useAxios();

  const fetchActions = async () => {
    const { data } = await axiosRequest('/nav/all', 'get');
    setActions(data);
  };

  useEffect(() => {
    fetchActions();
  }, []);

  const handleAddNav = (newNav) => {
    setActions((prevActions) => [...prevActions, newNav]);
  };

  if (isLoading) {
    return <CSpinner color="primary" />;
  }

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 id="traffic" className="card-title mb-0">
            Sidebar Navigation
          </h4>
        </CCol>
        <CCol sm={5} className="text-end">
          <CButton
            size="sm"
            color="info"
            className="text-white text-bold px-4"
            onClick={() => showModal('AddNav', '', 'post')}
          >
            CREATE NEW
          </CButton>
        </CCol>
      </CRow>

      <CTable align="middle" className="mb-3 border" hover responsive>
        <CTableHead className="text-nowrap">
          <CTableRow>
            <CTableHeaderCell className="bg-body-tertiary">Order ID</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Icon</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">
              Element (Component - Page)
            </CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">URL</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Is Navigation</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Is Child</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Parent</CTableHeaderCell>
            <CTableHeaderCell className="bg-body-tertiary">Actions</CTableHeaderCell>
          </CTableRow>
        </CTableHead>
        <CTableBody>
          {actions?.map((item, index) => (
            <CTableRow key={index}>
              <CTableDataCell>
                <div>{item?.order_id ?? '--------'}</div>
              </CTableDataCell>
              <CTableDataCell>
                <div>{item?.icon_name ?? '--------'}</div>
              </CTableDataCell>
              <CTableDataCell>
                <div>{item?.name ?? '--------'}</div>
              </CTableDataCell>
              <CTableDataCell>
                <div>{item?.to ?? '--------'}</div>
              </CTableDataCell>
              <CTableDataCell>
                <div className={item?.is_nav ? 'text-success' : 'text-danger'}>
                  {String(item?.is_nav)}
                </div>
              </CTableDataCell>

              <CTableDataCell>
                <div className={item?.is_child ? 'text-success' : 'text-danger'}>
                  {String(item?.is_child)}
                </div>
              </CTableDataCell>
              <CTableDataCell>
                <div>{item?.parent ? item.parent : '--------'}</div>
              </CTableDataCell>

              <CTableDataCell>
                <CIcon
                  onClick={() => showModal('AddNav', item, 'edit', fetchActions)}
                  className="me-2"
                  role="button"
                  icon={cilPencil}
                ></CIcon>
                <CIcon
                  onClick={() => showModal('AddNav', item, 'delete', fetchActions)}
                  role="button"
                  icon={cilTrash}
                ></CIcon>
              </CTableDataCell>
            </CTableRow>
          ))}
        </CTableBody>
      </CTable>
    </>
  );
};

export default Actions;
