import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";
import {
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
  CButton,
  CRow,
  CCol,
  CFormCheck,
} from "@coreui/react";
import useAxios from "../../utils/useAxios";
import { useToast, useValidation } from "../../_helpers";
import { CustomButton, MultiSelect } from "../../components";

const EmployeesModal = ({ handleModalClose, type, defaultData, callback }) => {
  console.log("defaultData", defaultData);

  // Option states
  const [specializations, setSpecializations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [rateTypes, setRateTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);
  const [diplomas, setDiplomas] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [certifications, setCertifications] = useState([]);

  // Main form data
  const [data, setData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone_number: "",
    birthdate: "",
    years_exp: "",
    joining_date: "",
    employee_type_id: "",
    specialization_id: "",
    // Start with one education row
    educations: [{ diploma_id: "", department_id: "" }],
    technologies: [],
    certifications: [],
    price_range: {
      price_from: "",
      price_to: "",
      rate_type_id: "",
      currency_type_id: "",
    },
    ...(defaultData || {}),
  });

  const [loading, setLoading] = useState(false);
  const { validateForm, validated } = useValidation();
  const { showToast } = useToast();
  const { axiosRequest, isLoading } = useAxios();

  // Fetch options from the backend
  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const [
          specRes, // Specializations
          typeRes, // Employee Types
          techRes, // Technologies
          rateRes, // Rate Types
          currencyRes, // Currencies
          certRes, // Certifications
          dipRes, // Diplomas
          depRes, // Departments
        ] = await Promise.all([
          axiosRequest("/lists/2", "get"),
          axiosRequest("/lists/1", "get"),
          axiosRequest("/lists/3", "get"),
          axiosRequest("/lists/4", "get"),
          axiosRequest("/lists/5", "get"),
          axiosRequest("/lists/6", "get"),
          axiosRequest("/lists/7", "get"),
          axiosRequest("/lists/8", "get"),
        ]);

        setSpecializations(specRes.data);
        setEmployeeTypes(typeRes.data);
        setTechnologies(techRes.data);
        setRateTypes(rateRes.data);
        setCurrencies(currencyRes.data);
        setCertifications(certRes.data);
        setDiplomas(dipRes.data);
        setDepartments(depRes.data);

        if (defaultData) {
          setData((prev) => ({
            ...prev,
            employee_type_id: defaultData.employee_type?.id || "",
            specialization_id: defaultData.specialization?.id || "",
            price_range: {
              ...prev.price_range,
              rate_type_id: defaultData.price_range?.rate_type?.id || "",
              currency_type_id:
                defaultData.price_range?.currency_type?.id || "",
            },
            technologies:
              defaultData?.technologies?.map((tech) => ({
                value: tech.id || tech.technology_id,
                label: tech.name || tech.list?.name,
              })) || [],
            educations: defaultData?.educations?.map((edu) => ({
              diploma_id: edu.diploma?.id || edu.diploma_id,
              department_id: edu.department?.name || edu.department_id, // store name here
            })),
            certifications: defaultData?.certifications
              ? defaultData.certifications.map((cert) => ({
                  value: cert.id,
                  label: cert.name,
                }))
              : [],
          }));
        }
      } catch (err) {
        console.error("❌ Error loading options:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, [defaultData]);

  // Handler for top-level field changes (Personal Info, etc.)
  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const parsedValue = value === "" ? null : value;
    setData((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : parsedValue, // Handle checkbox value
    }));
  };

  // Handler for education row changes
  const handleEducationChange = (e, index) => {
    const { name, value } = e.target;
    const updatedEducations = [...data.educations];
    updatedEducations[index][name] = value;
    setData((prev) => ({
      ...prev,
      educations: updatedEducations,
    }));
  };

  // Add a new education row
  const handleAddRow = () => {
    setData((prev) => ({
      ...prev,
      educations: [...prev.educations, { diploma_id: "", department_id: "" }],
    }));
  };

  // Remove an education row
  const handleRemoveRow = (index) => {
    const updatedEducations = data.educations.filter((_, i) => i !== index);
    setData((prev) => ({
      ...prev,
      educations: updatedEducations,
    }));
  };

  // Handler for MultiSelect changes (Technologies)
  const handleMultiSelectChange = (selectedOptions) => {
    setData((prev) => ({
      ...prev,
      technologies: selectedOptions,
    }));
  };

  const handlePriceRangeChange = (e) => {
    const { name, value } = e.target;
    setData((prev) => ({
      ...prev,
      price_range: {
        ...prev.price_range,
        [name]: value,
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const form = await validateForm(e);
    if (!form.checkValidity()) {
      // The above check might be redundant as validateForm already handles it, but you can log or handle accordingly
      return;
    }
    console.log("Submitting data:", data);

    const formData = new FormData();

    // Construct employee payload (without nested objects)
    const employeeData = {
      first_name: data.first_name,
      last_name: data.last_name,
      email: data.email,
      phone_number: data.phone_number,
      birthdate: data.birthdate,
      joining_date: data.joining_date,
      years_exp: data.years_exp,
      employee_type_id: data.employee_type_id,
      specialization_id: data.specialization_id,
      is_active: data.is_active, // Ensure this is included in the payload
    };
    formData.append("employeeData", JSON.stringify(employeeData));

    formData.append(
      "technologyIds",
      JSON.stringify(
        data.technologies.map((t) => ({ id: t.value, name: t.label }))
      )
    );
    formData.append("price_range", JSON.stringify(data.price_range));

    // Append educations array as JSON string
    formData.append("educations", JSON.stringify(data.educations));

    // Append certifications array as JSON string (similar to technologies)
    formData.append(
      "certificationIds",
      JSON.stringify(
        data.certifications.map((c) => ({ id: c.value, name: c.label }))
      )
    );

    const fileInput = form.querySelector(
      'input[type="file"][name="documents"]'
    );
    if (fileInput && fileInput.files.length > 0) {
      Array.from(fileInput.files).forEach((file) => {
        formData.append("documents", file);
      });
    }

    const url = type === "put" ? `/employees/${data.id}` : "/employees";
    const method = type === "put" ? "put" : "post";
    await axiosRequest(url, method, formData, handleModalClose);
    callback();
  };

  return (
    <CModal visible size="xl" alignment="center" onClose={handleModalClose}>
      {loading ? (
        <div className="text-center py-5">
          <CSpinner />
        </div>
      ) : (
        <>
          <CModalHeader>
            <CModalTitle>
              {type === "put" ? "Edit Employee" : "Add Employee"}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmit} noValidate validated={validated}>
            <CModalBody>
              {/* 1. Personal Information */}
              <h5 className="mb-3">1. Personal Information</h5>
              <CRow>
                <CCol md={6}>
                  <CFormInput
                    name="first_name"
                    value={data.first_name}
                    onChange={handleChange}
                    floatingLabel="First Name"
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    name="last_name"
                    value={data.last_name}
                    onChange={handleChange}
                    floatingLabel="Last Name"
                    required
                  />
                </CCol>
              </CRow>
              <CRow className="mt-3">
                <CCol md={6}>
                  <CFormInput
                    name="email"
                    value={data.email}
                    onChange={handleChange}
                    floatingLabel="Email"
                    type="email"
                    required
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    name="phone_number"
                    value={data.phone_number}
                    onChange={handleChange}
                    floatingLabel="Phone Number"
                  />
                </CCol>
              </CRow>
              <CRow className="mt-3">
                <CCol md={6}>
                  <CFormInput
                    name="birthdate"
                    value={data.birthdate}
                    onChange={handleChange}
                    floatingLabel="Birthdate"
                    type="date"
                    required={data.years_exp === ""}
                    className="form-control"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormInput
                    name="joining_date"
                    value={data.joining_date}
                    onChange={handleChange}
                    floatingLabel="Joining Date"
                    type="date"
                    required={data.joining_date === ""}
                    className="form-control"
                  />
                </CCol>
              </CRow>
              <CRow className="mt-3">
                <CCol md={6}>
                  <CFormInput
                    name="years_exp"
                    value={data.years_exp}
                    onChange={handleChange}
                    floatingLabel="Years of Experience"
                    type="number"
                  />
                </CCol>
                <CCol md={6}>
                  <CFormCheck
                    name="is_active"
                    id="is_active"
                    label="Is Currently working"
                    checked={data.is_active}
                    onChange={handleChange}
                  />
                </CCol>
              </CRow>

              {/* 2. Specialization & Technologies */}
              <h5 className="mt-5 mb-3">2. Specialization & Technologies</h5>
              <CRow>
                <CCol md={6}>
                  <CFormSelect
                    name="employee_type_id"
                    value={data.employee_type_id}
                    onChange={handleChange}
                    floatingLabel="Employee Type"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Type
                    </option>
                    {employeeTypes.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={6}>
                  <CFormSelect
                    name="specialization_id"
                    value={data.specialization_id}
                    onChange={handleChange}
                    floatingLabel="Specialization"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Specialization
                    </option>
                    {specializations.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>
              <CRow className="mt-3">
                <CCol>
                  <MultiSelect
                    label="Technologies"
                    options={technologies.map((tech) => ({
                      value: tech.id,
                      label: tech.name,
                    }))}
                    value={data.technologies}
                    onChange={(selectedOptions) =>
                      setData((prev) => ({
                        ...prev,
                        technologies: selectedOptions,
                      }))
                    }
                  />
                </CCol>
              </CRow>

              {/* 3. Educations */}
              <h5 className="mt-5 mb-3">3. Educations</h5>
              {data.educations.map((education, index) => (
                <CRow key={index} className="mb-3">
                  <CCol md={3}>
                    <CFormSelect
                      name="diploma_id"
                      value={education.diploma_id}
                      onChange={(e) => handleEducationChange(e, index)}
                      floatingLabel="Diploma"
                      required
                    >
                      <option value="" disabled hidden>
                        Select Diploma
                      </option>
                      {diplomas.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.name}
                        </option>
                      ))}
                    </CFormSelect>
                  </CCol>
                  <CCol md={6}>
                    <CFormInput
                      name="department_id"
                      value={education.department_id}
                      onChange={(e) => handleEducationChange(e, index)}
                      floatingLabel="Department"
                      list="department-options"
                      required
                    />
                    <datalist id="department-options">
                      {departments.map((dept) => (
                        <option key={dept.id} value={dept.name} />
                      ))}
                    </datalist>
                  </CCol>
                  <CCol md={1} className="mt-2 align-items-center">
                    <CButton
                      className="text-white"
                      color="danger"
                      size="sm"
                      onClick={() => handleRemoveRow(index)}
                    >
                      Remove
                    </CButton>
                  </CCol>
                </CRow>
              ))}
              <CButton color="primary" onClick={handleAddRow}>
                Add Education
              </CButton>

              {/* 4. Certifications */}
              <h5 className="mt-5 mb-3">4. Certifications</h5>
              <MultiSelect
                label="Certifications"
                options={certifications
                  .filter((cert) => cert && cert.id && cert.name)
                  .map((cert) => ({
                    value: cert.id,
                    label: cert.name,
                  }))}
                value={data.certifications}
                onChange={(selectedOptions) =>
                  setData((prev) => ({
                    ...prev,
                    certifications: selectedOptions,
                  }))
                }
              />

              {/* 5. Price Range */}
              <h5 className="mt-5 mb-3">5. Price Range</h5>
              <CRow>
                <CCol md={3}>
                  <CFormInput
                    name="price_from"
                    value={data.price_range.price_from}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Price From"
                    type="number"
                    required
                  />
                </CCol>
                <CCol md={3}>
                  <CFormInput
                    name="price_to"
                    value={data.price_range.price_to}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Price To"
                    type="number"
                    required
                  />
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    name="rate_type_id"
                    value={data.price_range.rate_type_id}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Rate Type"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Rate
                    </option>
                    {rateTypes.map((rt) => (
                      <option key={rt.id} value={rt.id}>
                        {rt.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
                <CCol md={3}>
                  <CFormSelect
                    name="currency_type_id"
                    value={data.price_range.currency_type_id}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Currency"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Currency
                    </option>
                    {currencies.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </CFormSelect>
                </CCol>
              </CRow>

              {/* 6. Documents */}
              <h5 className="mt-5 mb-3">6. Documents</h5>
              <CRow>
                <CCol md={12}>
                  <label htmlFor="documents" className="form-label">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    name="documents"
                    multiple
                    className="form-control"
                  />
                </CCol>
              </CRow>
            </CModalBody>
            <CModalFooter>
              <CustomButton
                actionType="cancel"
                type="button"
                onClick={handleModalClose}
              >
                Cancel
              </CustomButton>
              <CustomButton
                actionType="save"
                type="submit"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <CSpinner size="sm" />
                    &nbsp;Saving...
                  </>
                ) : (
                  "Save"
                )}
              </CustomButton>
            </CModalFooter>
          </CForm>
        </>
      )}
    </CModal>
  );
};

EmployeesModal.propTypes = {
  handleModalClose: PropTypes.func.isRequired,
  type: PropTypes.oneOf(["post", "put"]).isRequired,
  defaultData: PropTypes.object,
  callback: PropTypes.func.isRequired,
};

export default EmployeesModal;
