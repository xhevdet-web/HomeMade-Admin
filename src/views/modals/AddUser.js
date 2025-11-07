// src/views/.../AddUser.jsx
import React, { useEffect, useMemo, useState } from "react";
import PropTypes from "prop-types";
import {
  CForm,
  CFormInput,
  CFormSelect,
  CFormSwitch,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from "@coreui/react";
import useAxios from "../../utils/useAxios";
import { useValidation } from "../../_helpers";
import { CustomButton } from "../../components";

/** Generates a strong temporary password (shown disabled). */
const generateTempPassword = (len = 12) => {
  const charset =
    "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_-+=[]{};:,.?";
  let out = "";
  const cryptoObj = window.crypto || window.msCrypto;
  if (cryptoObj?.getRandomValues) {
    const buf = new Uint32Array(len);
    cryptoObj.getRandomValues(buf);
    for (let i = 0; i < len; i++) out += charset[buf[i] % charset.length];
    return out;
  }
  for (let i = 0; i < len; i++) out += charset[Math.floor(Math.random() * charset.length)];
  return out;
};

const AddUser = ({ handleModalClose, type, defaultData = {}, callback }) => {
  const isCreate = type === "create";

  const [data, setData] = useState({
    first_name: defaultData.first_name || "",
    last_name: defaultData.last_name || "",
    email: defaultData.email || "",
    password: isCreate ? generateTempPassword() : "",
    role_id: defaultData.role_id || defaultData?.role?.id || "",
    is_active: typeof defaultData.is_active === "boolean" ? defaultData.is_active : true,
  });

  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);

  const { axiosRequest, isLoading } = useAxios();
  const { validateForm, validated } = useValidation();


  const handleChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({ ...prev, [name]: value }));
  };

  const handleActiveChange = (e) => {
    setData((prev) => ({ ...prev, is_active: e.target.checked }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    const basePayload = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      role_id: data.role_id,
      center_ids: data.center_ids || [],
      is_active: data.is_active,
    };

    try {
      if (isCreate) {
        const payload = { ...basePayload, password: data.password };
        await axiosRequest("/users", "post", payload, handleModalClose);
      } else {
        await axiosRequest(`/users/${defaultData.id}`, "put", basePayload, handleModalClose);
      }
      callback();
    } catch (error) {
      console.error("User save error:", error);
    }
  };

   const fetchRolesAndCenters = async () => {
    try {
      const [{ data: rolesData }] = await Promise.all([
        axiosRequest("/user-roles/all", "get"),
      ]);
      setRoles(rolesData || []);
   
    } catch (error) {
      console.error("Failed to fetch roles:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRolesAndCenters();
  }, []);

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="AddUserModal"
    >
 
        <>
          <CModalHeader>
            <CModalTitle id="AddUserModal">
              {isCreate ? "Add User" : "Edit User"}
            </CModalTitle>
          </CModalHeader>

          <CForm onSubmit={handleSubmit} noValidate validated={validated}>
            <CModalBody>
              <CFormInput
                type="text"
                name="first_name"
                value={data.first_name}
                onChange={handleChange}
                floatingLabel="First Name"
                required
                className="mt-2"
              />
              <CFormInput
                type="text"
                name="last_name"
                value={data.last_name}
                onChange={handleChange}
                floatingLabel="Last Name"
                required
                className="mt-2"
              />
              <CFormInput
                type="email"
                name="email"
                value={data.email}
                onChange={handleChange}
                floatingLabel="Email"
                required
                className="mt-2"
                disabled={!isCreate} // email usually immutable on edit
              />

              {isCreate && (
                <CFormInput
                  type="text"
                  name="password"
                  value={data.password}
                  onChange={() => {}}
                  floatingLabel="Temporary Password (auto-generated)"
                  className="mt-2"
                  disabled
                />
              )}

              <CFormSelect
                name="role_id"
                value={data.role_id || ""}
                onChange={handleChange}
                floatingLabel="Select Role"
                required
                className="mt-2"
              >
                <option value="" disabled hidden>
                  Select a role
                </option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </CFormSelect>

              {/* Active switch */}
              <div className="mt-3">
                <CFormSwitch
                  id="is_active"
                  label={data.is_active ? "Active" : "Inactive"}
                  checked={!!data.is_active}
                  onChange={handleActiveChange}
                />
              </div>

             
            </CModalBody>

            <CModalFooter>
              <CustomButton
                type="button"
                actionType="secondary"
                onClick={handleModalClose}
              >
                Close
              </CustomButton>
              <CustomButton
                type="submit"
                actionType="save"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <CSpinner size="sm" /> Saving...
                  </>
                ) : (
                  "Save"
                )}
              </CustomButton>
            </CModalFooter>
          </CForm>
        </>
    </CModal>
  );
};

AddUser.propTypes = {
  handleModalClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["create", "edit"]).isRequired,
  defaultData: PropTypes.object,
  callback: PropTypes.func.isRequired,
};

export default AddUser;
