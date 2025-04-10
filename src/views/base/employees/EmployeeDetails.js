import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  CRow,
  CCol,
  CCard,
  CCardBody,
  CCardTitle,
  CCardHeader,
  CButton,
  CSpinner,
  CBadge,
  CContainer,
} from "@coreui/react";
import { FaFilePdf } from "react-icons/fa";
import useAxios from "../../../utils/useAxios";
import formatPhoneNumber from "../../../utils/formatNumber";

const EmployeeDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { axiosRequest } = useAxios();
  const [employee, setEmployee] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchEmployee = async () => {
    try {
      const { data } = await axiosRequest(`/employees/${id}`, "get");
      setEmployee(data);
    } catch (error) {
      console.error("Failed to fetch employee", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchEmployee();
  }, [id]);

  if (loading) {
    return (
      <div className="text-center my-5">
        <CSpinner color="primary" />
      </div>
    );
  }

  if (!employee) {
    return <div className="text-center p-4">Employee not found.</div>;
  }

  const {
    first_name,
    last_name,
    email,
    phone_number,
    birthdate,
    joining_date,
    years_exp,
    employee_type,
    specialization,
    technologies,
    documents,
    price_range,
    educations,
    certifications,
  } = employee;

  const currencyCode = price_range?.currency_type?.name?.split(" - ")[0];

  return (
    <CContainer className="py-4">
      <CButton color="secondary" className="mb-4" onClick={() => navigate(-1)}>
        ← Back
      </CButton>

      <CCard className="shadow-sm border-0">
        <CCardHeader className="mb-3">
          <h4 className="mb-0">Employee Profile</h4>
        </CCardHeader>

        <CCardBody className="fs-5 mx-3">
          {/* Personal Info */}
          <section className="mb-5">
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              📌 Personal Information
            </h5>{" "}
            <div className="mb-4">
              <CRow className="align-items-center py-2 border-bottom">
                <CCol md={4}>
                  <strong>Name:</strong>
                </CCol>
                <CCol md={8}>
                  {first_name} {last_name}
                </CCol>
              </CRow>
              <CRow className="align-items-center py-2 border-bottom">
                <CCol md={4}>
                  <strong>Email:</strong>
                </CCol>
                <CCol md={8}>{email}</CCol>
              </CRow>
              <CRow className="align-items-center py-2 border-bottom">
                <CCol md={4}>
                  <strong>Phone:</strong>
                </CCol>
                <CCol md={8}>{formatPhoneNumber(phone_number)}</CCol>
              </CRow>
              <CRow className="align-items-center py-2 border-bottom">
                <CCol md={4}>
                  <strong>Birthdate:</strong>
                </CCol>
                <CCol md={8}>
                  {birthdate
                    ? new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(birthdate))
                    : ""}
                </CCol>
              </CRow>

              <CRow className="align-items-center py-2 border-bottom">
                <CCol md={4}>
                  <strong>Joining Date:</strong>
                </CCol>
                <CCol md={8}>
                  {joining_date
                    ? new Intl.DateTimeFormat("en-GB", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      }).format(new Date(joining_date))
                    : ""}
                </CCol>
              </CRow>
              <CRow className="align-items-center py-2">
                <CCol md={4}>
                  <strong>Years of Experience:</strong>
                </CCol>
                <CCol md={8}>{years_exp}</CCol>
              </CRow>
            </div>
          </section>
          <hr />

          {/* Work Info */}
          <section className="mb-5">
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              💼 Work Information
            </h5>{" "}
            <div className="mb-4">
              <CRow className="align-items-center py-2 border-bottom">
                <CCol md={4}>
                  <strong>Employee Type:</strong>
                </CCol>
                <CCol md={8}>{employee_type?.name || "-"}</CCol>
              </CRow>
              <CRow className="align-items-center py-2">
                <CCol md={4}>
                  <strong>Specialization:</strong>
                </CCol>
                <CCol md={8}>{specialization?.name || "-"}</CCol>
              </CRow>
            </div>
          </section>
          <hr />

          {/* Technologies */}
          <section className="mb-5">
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              🛠 Technologies and Tools
            </h5>
            {technologies?.length > 0 ? (
              <div className="d-flex flex-wrap gap-2">
                {technologies.map((tech) => (
                  <div key={tech.id} className="px-3 py-2">
                    {tech.name}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted">
                No technologies information available.
              </p>
            )}
          </section>

          <hr />

          {/* Education */}
          <section className="mb-5">
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              🎓 Education
            </h5>
            {educations?.length > 0 ? (
              <ul className="ps-3">
                {educations.map((edu, index) => (
                  <li key={index}>
                    <span className="fw-semibold text-dark">
                      {edu.diploma?.name || edu.diploma_id}
                    </span>{" "}
                    - {edu.department?.name || edu.department_id}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No education information available.</p>
            )}
          </section>

          <hr />

          {/* Certifications */}
          {/* Certifications */}
          <section className="mb-5">
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              🏅 Certifications
            </h5>
            {certifications?.length > 0 ? (
              <ul className="ps-3">
                {certifications.map((cert) => (
                  <li key={cert.id} className="mb-1">
                    <span className="text-dark fw-medium">{cert.name}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">
                No certifications information available.
              </p>
            )}
          </section>
          <hr />

          {/* Documents */}
          <section className="mb-5">
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              📄 Documents
            </h5>
            {documents?.length > 0 ? (
              <ul className="ps-3">
                {documents.map((doc) => (
                  <li key={doc.id} className="mb-1">
                    <a
                      href={`${import.meta.env.VITE_IMAGES_API}${doc.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-decoration-none"
                    >
                      <FaFilePdf className="me-2 text-danger" />
                      <span className="text-primary fw-semibold">
                        {doc.doc_name}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted">No documents available.</p>
            )}
          </section>

          <hr />

          {/* Price Range */}
          {/* Price Range */}
          <section>
            <h5 className="mb-3 fs-4 fw-semibold border-start ps-2 border-primary border-4">
              💲 Price Range
            </h5>
            {price_range ? (
              <div className="mb-4">
                <CRow className="align-items-center py-2 border-bottom">
                  <CCol md={4}>
                    <strong>Price Range:</strong>
                  </CCol>
                  <CCol md={8}>
                    {price_range.price_from} - {price_range.price_to} (
                    {currencyCode})
                  </CCol>
                </CRow>
                <CRow className="align-items-center py-2">
                  <CCol md={4}>
                    <strong>Rate Type:</strong>
                  </CCol>
                  <CCol md={8}>{price_range.rate_type?.name}</CCol>
                </CRow>
              </div>
            ) : (
              <p className="text-muted">
                No price range information available.
              </p>
            )}
          </section>
        </CCardBody>
      </CCard>
    </CContainer>
  );
};

export default EmployeeDetails;
