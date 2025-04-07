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
} from "@coreui/react";
import useAxios from "../../utils/useAxios";
import { useToast, useValidation } from "../../_helpers";
import { CustomButton, MultiSelect } from "../../components";

const EmployeesModal = ({ handleModalClose, type, defaultData, callback }) => {
  console.log("defaultData", defaultData);
  const [loading, setLoading] = useState(true);
  const [specializations, setSpecializations] = useState([]);
  const [employeeTypes, setEmployeeTypes] = useState([]);
  const [technologies, setTechnologies] = useState([]);
  const [rateTypes, setRateTypes] = useState([]);
  const [currencies, setCurrencies] = useState([]);

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
    technologies: [],
    price_range: {
      price_from: "",
      price_to: "",
      rate_type_id: "",
      currency_type_id: "",
    },
    ...(defaultData || {}),
  });

  const { validateForm, validated } = useValidation();
  const { showToast } = useToast();
  const { axiosRequest, isLoading } = useAxios();

  useEffect(() => {
    const fetchOptions = async () => {
      setLoading(true);
      try {
        const [specRes, typeRes, techRes, rateRes, currencyRes] =
          await Promise.all([
            axiosRequest("/lists/2", "get"),
            axiosRequest("/lists/1", "get"),
            axiosRequest("/lists/3", "get"),
            axiosRequest("/lists/4", "get"),
            axiosRequest("/lists/5", "get"),
          ]);

        setSpecializations(specRes.data);
        setEmployeeTypes(typeRes.data);
        setTechnologies(techRes.data);
        setRateTypes(rateRes.data);
        setCurrencies(currencyRes.data);

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
          }));
        }
      } catch (err) {
        console.error("❌ Error loading options:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchOptions();
  }, []);

  const handleChange = (e) => {
    const { name, value, type: inputType, checked } = e.target;
    const parsedValue = value === "" ? null : value;
    setData((prev) => ({
      ...prev,
      [name]: inputType === "checkbox" ? checked : parsedValue,
    }));
  };

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
    const form = e.target;
    if (!validateForm(form)) {
      e.stopPropagation();
      return;
    }
    const formData = new FormData();
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
    };
    formData.append("employeeData", JSON.stringify(employeeData));
    formData.append(
      "technologyIds",
      JSON.stringify(
        data.technologies.map((t) => ({ id: t.value, name: t.label }))
      )
    );
    formData.append("price_range", JSON.stringify(data.price_range));

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
              <h5 className="mb-3">1. Personal Information</h5>
              <div className="row">
                <div className="col-md-6">
                  <CFormInput
                    name="first_name"
                    value={data?.first_name}
                    onChange={handleChange}
                    floatingLabel="First Name"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <CFormInput
                    name="last_name"
                    value={data?.last_name}
                    onChange={handleChange}
                    floatingLabel="Last Name"
                    required
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <CFormInput
                    name="email"
                    value={data?.email}
                    onChange={handleChange}
                    floatingLabel="Email"
                    type="email"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <CFormInput
                    name="phone_number"
                    value={data?.phone_number}
                    onChange={handleChange}
                    floatingLabel="Phone Number"
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <CFormInput
                    name="birthdate"
                    value={data?.birthdate}
                    onChange={handleChange}
                    floatingLabel="Birthdate"
                    type="date"
                    required
                  />
                </div>
                <div className="col-md-6">
                  <CFormInput
                    name="joining_date"
                    value={data?.joining_date}
                    onChange={handleChange}
                    floatingLabel="Joining Date"
                    type="date"
                    required
                  />
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-6">
                  <CFormInput
                    name="years_exp"
                    value={data?.years_exp}
                    onChange={handleChange}
                    floatingLabel="Years of Experience"
                    type="number"
                  />
                </div>
              </div>

              <h5 className="mt-5 mb-3">2. Specialization & Technologies</h5>
              <div className="row">
                <div className="col-md-6">
                  <CFormSelect
                    name="employee_type_id"
                    value={data?.employee_type_id}
                    onChange={handleChange}
                    floatingLabel="Employee Type"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Type
                    </option>
                    {employeeTypes.map((item) => (
                      <option key={item?.id} value={item?.id}>
                        {item?.name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="col-md-6">
                  <CFormSelect
                    name="specialization_id"
                    value={data?.specialization_id}
                    onChange={handleChange}
                    floatingLabel="Specialization"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Specialization
                    </option>
                    {specializations.map((item) => {
                      return (
                        <option key={item?.id} value={item?.id}>
                          {item?.name}
                        </option>
                      );
                    })}
                  </CFormSelect>
                </div>
              </div>
              <div className="row mt-3">
                <div className="col-md-12">
                  <MultiSelect
                    label="Technologies"
                    options={technologies.map((tech) => ({
                      value: tech.id,
                      label: tech.name,
                    }))}
                    value={data.technologies}
                    onChange={handleMultiSelectChange}
                  />
                </div>
              </div>

              <h5 className="mt-5 mb-3">3. Price Range</h5>
              <div className="row">
                <div className="col-md-3">
                  <CFormInput
                    name="price_from"
                    value={data?.price_range?.price_from}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Price From"
                    type="number"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <CFormInput
                    name="price_to"
                    value={data?.price_range?.price_to}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Price To"
                    type="number"
                    required
                  />
                </div>
                <div className="col-md-3">
                  <CFormSelect
                    name="rate_type_id"
                    value={data?.price_range?.rate_type_id}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Rate Type"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Rate
                    </option>
                    {rateTypes.map((rt) => (
                      <option key={rt?.id} value={rt?.id}>
                        {rt?.name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
                <div className="col-md-3">
                  <CFormSelect
                    name="currency_type_id"
                    value={data?.price_range?.currency_type_id}
                    onChange={handlePriceRangeChange}
                    floatingLabel="Currency"
                    required
                  >
                    <option value="" disabled hidden>
                      Select Currency
                    </option>
                    {currencies.map((c) => (
                      <option key={c?.id} value={c?.id}>
                        {c?.name}
                      </option>
                    ))}
                  </CFormSelect>
                </div>
              </div>

              <h5 className="mt-5 mb-3">4. Documents</h5>
              <div className="row">
                <div className="col-md-12">
                  <label htmlFor="documents" className="form-label">
                    Upload Documents
                  </label>
                  <input
                    type="file"
                    name="documents"
                    multiple
                    className="form-control"
                  />
                </div>
              </div>
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
