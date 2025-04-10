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

const SpecializationTypes = () => {
  const listTypeId = 2; // Static listTypeId for Specialization Types
  const [specializationTypes, setSpecializationTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  const fetchSpecializationTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setSpecializationTypes(data || []);
    } catch (error) {
      console.error("Error fetching specialization types:", error);
    }
  };

  useEffect(() => {
    fetchSpecializationTypes();
  }, []);

  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchSpecializationTypes(); // Re-fetch specialization types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchSpecializationTypes
    );
  };

  const handleEdit = async (specializationType) => {
    await showModal(
      "ListItemsModal",
      specializationType,
      "put",
      fetchSpecializationTypes
    );
  };

  const handleDelete = async (specializationType) => {
    await showModal(
      "ListItemsModal",
      specializationType,
      "delete",
      fetchSpecializationTypes
    );
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Specialization Types</h4>
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Specialization Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {specializationTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Specialization Type
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
              {specializationTypes.map((specializationType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{specializationType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={specializationType.is_active}
                      onChange={() => toggleActive(specializationType)}
                      id={`isActive-${specializationType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(specializationType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(specializationType)}
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
            No specialization types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default SpecializationTypes;
