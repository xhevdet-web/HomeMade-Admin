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

const CertificationTypes = () => {
  const listTypeId = 6; // Static listTypeId for Certification Types
  const [certificationTypes, setCertificationTypes] = useState([]);
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  // Fetch certification types based on the static listTypeId
  const fetchCertificationTypes = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setCertificationTypes(data || []);
    } catch (error) {
      console.error("Error fetching certification types:", error);
    }
  };

  // Toggle the active status of a certification type
  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchCertificationTypes(); // Re-fetch certification types after update
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };

  // Fetch initial data on component load
  useEffect(() => {
    fetchCertificationTypes();
  }, []);

  // Show modal for creating a new certification type
  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchCertificationTypes
    );
  };

  // Show modal for editing an existing certification type
  const handleEdit = async (certificationType) => {
    await showModal(
      "ListItemsModal",
      certificationType,
      "put",
      fetchCertificationTypes
    );
  };

  // Show modal for deleting a certification type
  const handleDelete = async (certificationType) => {
    await showModal(
      "ListItemsModal",
      certificationType,
      "delete",
      fetchCertificationTypes
    );
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>List of Certifications</h4>
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New Certification Type
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {certificationTypes.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  Certification Type
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
              {certificationTypes.map((certificationType, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{certificationType.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={certificationType.is_active}
                      onChange={() => toggleActive(certificationType)}
                      id={`isActive-${certificationType.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(certificationType)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(certificationType)}
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
            No certification types found for this type.
          </div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default CertificationTypes;
