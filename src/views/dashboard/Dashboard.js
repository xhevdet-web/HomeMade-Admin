import React from "react";
import { useAuthSelector } from "../../redux/selectors/authSelectors";

import AdminDashboard from "./AdminDashboard";
import SuperAdminDashboard from "./SuperAdminDashboard";

const Dashboard = () => {
  const { userData } = useAuthSelector();
  return (
    <div>
      {userData?.role_id === "7945d759-2ed7-4beb-bc13-fcebd2e12b70" ? (
        <SuperAdminDashboard />
      ) : userData?.role_id === "ea35b1d4-8675-4230-9520-f44e3cf12cf4" ? (
        <AdminDashboard />
      ) : null}
    </div>
  );
};

export default Dashboard;
