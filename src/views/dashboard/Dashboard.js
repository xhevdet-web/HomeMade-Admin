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
          <h2 className="fw-bold mb-2">Welcome to the Initial Project</h2>
          <p className="text-muted fs-5">
          This is our starting project. We use it as a base for all our future projects. It includes the basic setup and structure so we don’t have to start from scratch every time.
          </p>
        </CCol>
      </CRow>
    </CContainer>
  );
};

export default Dashboard;
