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

const EmployeeTypes = () => {
  const listTypeId = 1; // Static listTypeId for Employee Types
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  // Fetch employee types based on the static listTypeId
  const fetchEmployeeTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setEmployeeTypes(data || []);
    } catch (error) {
      console.error("Error fetching employee types:", error);
    }
  };

  // Fetch initial data on component load
  useEffect(() => {
    fetchEmployeeTypes();
  }, []);

  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchEmployeeTypes(); // Re-fetch employee types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchEmployeeTypes
    );
  };

  const handleEdit = async (employeeType) => {
    await showModal("ListItemsModal", employeeType, "put", fetchEmployeeTypes);
  };

  const handleDelete = async (employeeType) => {
    await showModal(
      "ListItemsModal",
      employeeType,
      "delete",
      fetchEmployeeTypes
    );
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Employee Types</h4> {/* Static name for list type */}
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Employee Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {employeeTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Employee Type
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
              {employeeTypes.map((employeeType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{employeeType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={employeeType.is_active}
                      onChange={() => toggleActive(employeeType)}
                      id={`isActive-${employeeType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(employeeType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(employeeType)}
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
            No employee types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default EmployeeTypes;
