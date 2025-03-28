import React from "react";
import { CContainer, CRow, CCol } from "@coreui/react";
import logo from "../../assets/images/avatars/cacttus.png";

const Dashboard = () => {
  return (
    <CContainer className="text-center py-5">
      <CRow className="justify-content-center">
        <CCol md={6}>
          <img
            src={logo}
            alt="Dashboard Logo"
            className="img-fluid mb-4"
            style={{ maxHeight: "150px" }}
          />
          <h2 className="fw-bold mb-2">Welcome to the Team Management Platform</h2>
          <p className="text-muted fs-5">
            This platform is built to manage employee information and CVs — all in one organized and accessible place.
          </p>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default Dashboard;
