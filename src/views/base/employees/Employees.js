import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
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
  CTooltip,
} from "@coreui/react";
import useAxios from "../../../utils/useAxios";
import { useModal } from "../../../_helpers/HandleModals";
import formatPhoneNumber from "../../../utils/formatNumber";

const Employees = () => {
  const navigate = useNavigate();
  const { showModal } = useModal();
  const { axiosRequest } = useAxios();
  const [employees, setEmployees] = useState([]);

  const fetchEmployees = async () => {
    try {
      const { data } = await axiosRequest("/employees", "get");
      setEmployees(data || []);
    } catch (error) {
      console.error("Error fetching employees:", error);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  const handleCreate = () => {
    showModal("EmployeesModal", null, "post", fetchEmployees);
  };

  const handleModify = (employee) => {
    showModal("EmployeesModal", employee, "put", fetchEmployees);
  };

  const handleDelete = async (employee_id) => {
    try {
      await axiosRequest(`/employees/${employee_id}`, "delete");
      setEmployees((prevEmployees) =>
        prevEmployees.filter((emp) => emp.id !== employee_id)
      );
      showToast("Employee deleted successfully.", "success");
    } catch (error) {
      console.error("Error deleting employee:", error);
      showToast("Failed to delete employee.", "danger");
    }
  };

  const handleViewProfile = (id) => {
    navigate(`/admin/employees/${id}`);
  };

  return (
    <>
      <CRow className="mb-3">
        <CCol sm={7}>
          <h4 className="card-title mb-0">Employees</h4>
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

      {employees.length > 0 ? (
        <CTable align="middle" className="mb-0 border" hover responsive>
          <CTableHead className="text-nowrap">
            <CTableRow>
              <CTableHeaderCell className="bg-body-tertiary">
                Name
              </CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">
                Email
              </CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">
                Phone
              </CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">
                Years Experience
              </CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary">
                Joining Date
              </CTableHeaderCell>
              <CTableHeaderCell className="bg-body-tertiary text-center">
                Actions
              </CTableHeaderCell>
            </CTableRow>
          </CTableHead>
          <CTableBody>
            {employees.map((emp, index) => (
              <CTableRow key={index}>
                <CTableDataCell>{`${emp?.first_name} ${emp?.last_name}`}</CTableDataCell>
                <CTableDataCell>{emp?.email}</CTableDataCell>
                <CTableDataCell>
                  {formatPhoneNumber(emp?.phone_number)}
                </CTableDataCell>
                <CTableDataCell>{emp?.years_exp}</CTableDataCell>
                <CTableDataCell>
                  {emp.joining_date
                    ? new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(emp.joining_date))
                    : ""}
                </CTableDataCell>
                <CTableDataCell className="text-center d-flex">
                  <CButton
                    // disabled={true}
                    size="sm"
                    color="warning"
                    className="text-white text-bold px-3 me-2"
                    onClick={() => handleModify(emp)}
                  >
                    Modify
                  </CButton>

                  <CButton
                    size="sm"
                    color="danger"
                    className="text-white text-bold px-3 me-2"
                    onClick={() => handleDelete(emp.id)}
                  >
                    Delete
                  </CButton>

                  <CButton
                    size="sm"
                    color="primary"
                    className="text-white text-bold px-3"
                    onClick={() => handleViewProfile(emp.id)}
                  >
                    View Profile
                  </CButton>
                </CTableDataCell>
              </CTableRow>
            ))}
          </CTableBody>
        </CTable>
      ) : (
        <div className="text-center p-4">No employees found.</div>
      )}
    </>
  );
};

export default Employees;
