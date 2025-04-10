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

const TechnologyTypes = () => {
  const listTypeId = 3; // Static listTypeId for Technologies Types
  const [technologiesTypes, setTechnologiesTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  const fetchTechnologiesTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setTechnologiesTypes(data || []);
    } catch (error) {
      console.error("Error fetching Technologies types:", error);
    }
  };

  useEffect(() => {
    fetchTechnologiesTypes();
  }, []);

  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchTechnologiesTypes();
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchTechnologiesTypes
    );
  };

  const handleEdit = async (technologiesType) => {
    await showModal(
      "ListItemsModal",
      technologiesType,
      "put",
      fetchTechnologiesTypes
    );
  };

  const handleDelete = async (technologiesType) => {
    await showModal(
      "ListItemsModal",
      technologiesType,
      "delete",
      fetchTechnologiesTypes
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
        {technologiesTypes.length > 0 ? (
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
              {technologiesTypes.map((technologiesType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{technologiesType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={technologiesType.is_active}
                      onChange={() => toggleActive(technologiesType)}
                      id={`isActive-${technologiesType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(technologiesType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(technologiesType)}
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
            No technology types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default TechnologyTypes;
