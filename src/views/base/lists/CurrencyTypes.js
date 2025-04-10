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

const CurrencyTypes = () => {
  const listTypeId = 5; // Static listTypeId for Currency Types
  const [currencyTypes, setCurrencyTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  const fetchCurrencyTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setCurrencyTypes(data || []);
    } catch (error) {
      console.error("Error fetching currency types:", error);
    }
  };

  useEffect(() => {
    fetchCurrencyTypes();
  }, []);

  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchCurrencyTypes(); // Re-fetch currency types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchCurrencyTypes
    );
  };

  const handleEdit = async (currencyType) => {
    await showModal("ListItemsModal", currencyType, "put", fetchCurrencyTypes);
  };

  const handleDelete = async (currencyType) => {
    await showModal(
      "ListItemsModal",
      currencyType,
      "delete",
      fetchCurrencyTypes
    );
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Currency Types</h4>
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Currency Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {currencyTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Currency Type
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
              {currencyTypes.map((currencyType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{currencyType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={currencyType.is_active}
                      onChange={() => toggleActive(currencyType)}
                      id={`isActive-${currencyType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(currencyType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(currencyType)}
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
            No currency types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default CurrencyTypes;
