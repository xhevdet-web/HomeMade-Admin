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

const DepartmentTypes = () => {
  const listTypeId = 8; // Static listTypeId for Department Types
  const [departmentTypes, setDepartmentTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  // Fetch department types based on the static listTypeId
  const fetchDepartmentTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setDepartmentTypes(data || []);
    } catch (error) {
      console.error("Error fetching department types:", error);
    }
  };

  // Toggle the active status of a department type
  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchDepartmentTypes(); // Re-fetch department types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  // Fetch initial data on component load
  useEffect(() => {
    fetchDepartmentTypes();
  }, []);

  // Show modal for creating a new department type
  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchDepartmentTypes
    );
  };

  // Show modal for editing an existing department type
  const handleEdit = async (departmentType) => {
    await showModal(
      "ListItemsModal",
      departmentType,
      "put",
      fetchDepartmentTypes
    );
  };

  // Show modal for deleting a department type
  const handleDelete = async (departmentType) => {
    await showModal(
      "ListItemsModal",
      departmentType,
      "delete",
      fetchDepartmentTypes
    );
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Departments</h4>
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Department Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {departmentTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Department Type
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
              {departmentTypes.map((departmentType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{departmentType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={departmentType.is_active}
                      onChange={() => toggleActive(departmentType)}
                      id={`isActive-${departmentType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(departmentType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(departmentType)}
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
            No department types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default DepartmentTypes;
