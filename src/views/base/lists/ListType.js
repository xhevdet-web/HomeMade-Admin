import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
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
  CFormCheck,
} from "@coreui/react";
import { useModal } from "../../../_helpers/HandleModals";
import useAxios from "../../../utils/useAxios";
import { checkUserPermissions } from "../../../_helpers";
import { CustomButton } from "../../../components";
import { useSidebarSelector } from "../../../redux/selectors/sidebarSelector";
import { useAuthSelector } from "../../../redux/selectors/authSelectors";

const ListType = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const [listTypes, setListTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { sidebarData } = useSidebarSelector()
  const { userData } = useAuthSelector()
  const location = useLocation()
    const navItem = sidebarData?.find((el) => el.to === location.pathname)
  const roleId = userData.role_id

  const getAllListTypes = async () => {
    try {
      const { data } = await axiosRequest("/list-types", "get");
      setListTypes(data || []);
    } catch (error) {
      console.error("Error fetching list types:", error);
    }
  };
  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/list-types/${item.id}/toggle`, "patch");
      getAllListTypes();
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  useEffect(() => {
    getAllListTypes();
  }, []);
  const handleCreate = () => {
    showModal("ListTypeModal", null, "post", getAllListTypes);
  };

  const handleModify = (item) => {
    showModal("ListTypeModal", item, "put", getAllListTypes);
  };

  const handleDelete = (item) => {
    showModal("ListTypeModal", item, "delete", getAllListTypes);
  };

  const handleViewLists = (listTypeId) => {
    navigate(`/admin/list/${listTypeId}`);
  };

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 className="card-title mb-0">List Types</h4>
        </CCol>
        <CCol sm={5} className="text-end">
          <CButton
            size="sm"
            color="info"
            className="text-white text-bold px-4"
            onClick={handleCreate}
          >
            CREATE NEW
          </CButton>
        </CCol>
      </CRow>

      {listTypes.length > 0 ? (
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell>Name</CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                Active
              </CTableHeaderCell>
              <CTableHeaderCell className="text-center">
                Actions
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>

          <CTableBody>
            {listTypes.map((item, index) => (
              <CTableRow key={index}>
                <CTableDataCell>{item.name}</CTableDataCell>

                <CTableDataCell className="text-center">
                  <CFormCheck
                    type="checkbox"
                    checked={item.is_active}
                    onChange={() => toggleActive(item)}
                    id={`isActive-${item.id}`}
                    title="Toggle Active Status"
                  />
                </CTableDataCell>

                <CTableDataCell className="text-center">
               {checkUserPermissions(navItem, 'update', roleId) && (
                         <CButton
                    size="sm"
                    color="warning"
                    className="text-white text-bold px-3 me-2"
                    onClick={() => handleModify(item)}
                  >
                    Modify
                  </CButton> 
                                  )}
                  <CButton
                    size="sm"
                    color="danger"
                    className="text-white text-bold px-3 me-2"
                    onClick={() => handleDelete(item)}
                  >
                    Delete
                  </CButton>
                  <CButton
                    size="sm"
                    color="primary"
                    className="text-white text-bold px-3"
                    onClick={() => handleViewLists(item.id)}
                  >
                    View Lists
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      ) : (
        <div className="text-center p-4">No list types added yet.</div>
      )}
    </>
  );
};

export default ListType;
