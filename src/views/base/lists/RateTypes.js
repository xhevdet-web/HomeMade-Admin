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

const RateTypes = () => {
  const listTypeId = 4; // Static listTypeId for Rate Types
  const [rateTypes, setRateTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  const fetchRateTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setRateTypes(data || []);
    } catch (error) {
      console.error("Error fetching rate types:", error);
    }
  };

  useEffect(() => {
    fetchRateTypes();
  }, []);

  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchRateTypes(); // Re-fetch rate types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchRateTypes
    );
  };

  const handleEdit = async (rateType) => {
    await showModal("ListItemsModal", rateType, "put", fetchRateTypes);
  };

  const handleDelete = async (rateType) => {
    await showModal("ListItemsModal", rateType, "delete", fetchRateTypes);
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Rate Types</h4>
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Rate Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {rateTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Rate Type
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
              {rateTypes.map((rateType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{rateType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={rateType.is_active}
                      onChange={() => toggleActive(rateType)}
                      id={`isActive-${rateType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(rateType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(rateType)}
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
            No rate types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default RateTypes;
