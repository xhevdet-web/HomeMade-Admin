import React, { useEffect, useState } from "react";
import {
  CTable,
  CTableHead,
  CTableRow,
  CTableHeaderCell,
  CTableBody,
  CTableDataCell,
  CCard,
  CCardHeader,
  CCardBody,
  CFormCheck,
} from "@coreui/react";
import useAxios from "../../../utils/useAxios";
import { useModal } from "../../../_helpers";
import CustomButton from "../../../components/CustomButton";

const DiplomaTypes = () => {
  const listTypeId = 7; // Static listTypeId for Diploma Types
  const [diplomaTypes, setDiplomaTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  // Fetch diploma types based on the static listTypeId
  const fetchDiplomaTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setDiplomaTypes(data || []);
    } catch (error) {
      console.error("Error fetching diploma types:", error);
    }
  };

  // Fetch initial data on component load
  useEffect(() => {
    fetchDiplomaTypes();
  }, []);

  // Toggle the active status of a diploma type
  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchDiplomaTypes(); // Re-fetch diploma types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  // Show modal for creating a new diploma type
  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchDiplomaTypes
    );
  };

  // Show modal for editing an existing diploma type
  const handleEdit = async (diplomaType) => {
    await showModal("ListItemsModal", diplomaType, "put", fetchDiplomaTypes);
  };

  // Show modal for deleting a diploma type
  const handleDelete = async (diplomaType) => {
    await showModal("ListItemsModal", diplomaType, "delete", fetchDiplomaTypes);
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Diploma Types</h4> {/* Static name for list type */}
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Diploma Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {diplomaTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Diploma Type
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-center">
                  Active
                </CTableHeaderCell>
                <CTableHeaderCell className="bg-body-tertiary text-end">
                  Actions
                </CTableHeaderCell>
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {diplomaTypes.map((diplomaType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{diplomaType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={diplomaType.is_active}
                      onChange={() => toggleActive(diplomaType)}
                      id={`isActive-${diplomaType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(diplomaType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(diplomaType)}
                    >
                      Delete
                    </CustomButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        ) : (
          <div className="text-center p-4">
            No diploma types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default DiplomaTypes;
