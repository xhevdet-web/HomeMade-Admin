import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
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

const ListItems = () => {
  const { listTypeId } = useParams();
  const [lists, setLists] = useState([]);
  const [listTypeName, setListTypeName] = useState("");
  const { axiosRequest } = useAxios();
  const { showModal } = useModal();

  const fetchLists = async () => {
    try {
      const { data } = await axiosRequest(`/lists/${listTypeId}`, "get");
      setLists(data || []);
    } catch (error) {
      console.error("Error fetching lists:", error);
    }
  };

  const fetchListTypeName = async () => {
    try {
      const { data } = await axiosRequest(`/list-types/${listTypeId}`, "get");
      setListTypeName(data?.name || "");
    } catch (error) {
      console.error("Error fetching list type name:", error);
    }
  };
  const toggleActive = async (item) => {
    try {
      await axiosRequest(`/lists/${item.id}/toggle`, "patch");
      fetchLists();
    } catch (error) {
      console.error("Failed to update active status", error);
    }
  };
  useEffect(() => {
    if (listTypeId) {
      fetchLists();
      fetchListTypeName();
    }
  }, [listTypeId]);

  const handleCreate = async () => {
    await showModal(
      "ListItemsModal",
      { list_type_id: listTypeId },
      "post",
      fetchLists
    );
  };

  const handleEdit = async (list) => {
    await showModal("ListItemsModal", list, "put", fetchLists);
  };

  const handleDelete = async (list) => {
    await showModal("ListItemsModal", list, "delete", fetchLists);
  };

  return (
    <CCard className="mb-4">
      <CCardHeader className="d-flex justify-content-between align-items-center">
        <h4>Lists for: {listTypeName || listTypeId}</h4>
        <CustomButton actionType="create" onClick={handleCreate}>
          Add New List Item
        </CustomButton>
      </CCardHeader>
      <CCardBody>
        {lists.length > 0 ? (
          <CTable align="middle" className="mb-0 border" hover responsive>
            <CTableHead>
              <CTableRow>
                <CTableHeaderCell className="bg-body-tertiary">
                  List Name
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
              {lists.map((list, index) => (
                <CTableRow key={index}>
                  <CTableDataCell>{list.name}</CTableDataCell>
                  <CTableDataCell className="text-center">
                    <CFormCheck
                      type="checkbox"
                      checked={list.is_active}
                      onChange={() => toggleActive(list)}
                      id={`isActive-${list.id}`}
                      title="Toggle Active Status"
                    />
                  </CTableDataCell>
                  <CTableDataCell className="text-end">
                    <CustomButton
                      actionType="edit"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleEdit(list)}
                    >
                      Edit
                    </CustomButton>
                    <CustomButton
                      actionType="delete"
                      className="text-white text-bold px-3 me-2"
                      onClick={() => handleDelete(list)}
                    >
                      Delete
                    </CustomButton>
                  </CTableDataCell>
                </CTableRow>
              ))}
            </CTableBody>
          </CTable>
        ) : (
          <div className="text-center p-4">No lists found for this type.</div>
        )}
      </CCardBody>
    </CCard>
  );
};

export default ListItems;
