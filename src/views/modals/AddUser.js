import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CButton,
  CForm,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CSpinner,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { useToast, useValidation } from '../../_helpers'
import { CustomButton } from '../../components'

const AddUser = ({ message, handleModalClose, type, defaultData }) => {
  const [loading, setLoading] = useState(true)
  const [genders, setGenders] = useState([])
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [role, setRole] = useState({})
  const [profilePicFile, setProfilePicFile] = useState(null); // For image file
  const [data, setData] = useState(
    defaultData || {
      first_name: '',
      last_name: '',
      dob: '',
      country_id: '',
      username: '',
      email: '',
      profile_pic: '',
      gender_id: '',
      city_id: '',
      role_id: '',
      active: true,
      personal_identification_number: '',
      phone_number: '',
      birth_place: '',
      backup_email: ''
    }
  )
  const { validateForm, validated } = useValidation();  // Use the validation hook
  const { showToast } = useToast()

  const handleChange = (e) => {
    const { value, name, type: inputType, checked, files } = e.target
    if (name === 'profile_pic' && files && files.length > 0) {
      const file = files[0];
      const reader = new FileReader();

      reader.onload = function (event) {
        const img = new Image();
        img.onload = function () {
          if (img.width > 250 || img.height > 250) {
            showToast('Error', 'Image must be 250x250 pixels.');
            setProfilePicFile(null);
          } else {
            setProfilePicFile(file);
          }
        };
        img.src = event.target.result;
      };

      reader.readAsDataURL(file);
    } else {
      setData((prevState) => ({
        ...prevState,
        [name]: inputType === 'checkbox' ? checked : value,
      }))
    }
  }

  const { axiosRequest, isLoading } = useAxios()
  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target;
    if (!validateForm(form)) {
      e.stopPropagation()
      return
    }

    const formData = new FormData()
    Object.keys(data).forEach((key) => {
      if (data[key]) {
        formData.append(key, data[key])
      }
    })
    if (profilePicFile) {
      formData.append('profile_pic', profilePicFile)
    }
    defaultData.roleType == "professor" && formData.append('role_id', "dbbd57be-35c3-478d-9d6d-7a4c0e31f7f3")
    const url = type === 'edit' ? `users/${data.id}` : 'users' + `/${role.name?.toLowerCase() || defaultData?.roleType?.toLowerCase() || ""}`
    const method = type === 'edit' ? 'put' : 'post'
    await axiosRequest(url, method, formData, handleModalClose, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  }

  const getNeededData = async () => {
    try {
      setLoading(true)
      const [gendersData, rolesData, countriesData] = await Promise.all([
        axiosRequest('genders/all', 'get'),
        axiosRequest('user-roles/allowed/all', 'get'),
        axiosRequest('countries/all', 'get'),
      ])
      const modalRole = rolesData.data
      setRole(modalRole)
      setGenders(gendersData.data)
      setCountries(countriesData.data)
    } catch (error) {
      console.error("Error fetching data: ", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    getNeededData()
  }, [])

  useEffect(() => {
    const fetchCities = async () => {
      try {
        const citiesData = await axiosRequest(`cities/all/${data?.country_id}`, 'get');
        setCities(citiesData.data);
      } catch (error) {
        console.error("Error fetching cities:", error);
      }
    };

    if (data?.country_id) {
      fetchCities();
    }
  }, [countries, data?.country_id]);

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      {loading ?
        <div className="text-center py-5">
          <CSpinner />
        </div>
        :
        <>
          <CModalHeader>
            <CModalTitle id="StaticBackdropExampleLabel">
              {role?.name ? (type === 'edit' ? `Edit ${role.name}` : `Add ${role.name}`) : `Add ${defaultData.roleType}`}
            </CModalTitle>
          </CModalHeader>
          <CForm onSubmit={handleSubmit} noValidate validated={validated}>
            <CModalBody>
              {console.log("defaultData.roleType", defaultData.roleType)}
              {(!defaultData.roleType == "professor" || defaultData.roleType == "user") &&
                <CFormSelect
                  name="role_id"
                  onChange={handleChange}
                  floatingLabel="Select Role"
                  placeholder="Select Role"
                  defaultValue={data.role_id || ""} // Setting the default value
                  className="mt-2"
                  disabled={!(type !== "edit")}
                  required
                >
                  <option value="" hidden disabled>
                    Select Role
                  </option>
                  {role?.map((el) => (
                    <option key={el.id} value={el.id}>
                      {el.name}
                    </option>
                  ))}
                </CFormSelect>
              }

              <CFormInput
                type="text"
                onChange={handleChange}
                name="first_name"
                value={data.first_name}
                id="first_name"
                floatingLabel="First Name"
                placeholder="First Name"
                aria-label="default input example"
                className="mt-2"
                required
              />

              <CFormInput
                type="text"
                onChange={handleChange}
                name="last_name"
                value={data.last_name}
                id="last_name"
                floatingLabel="Last Name"
                placeholder="Last Name"
                aria-label="default input example"
                className="mt-2"
                required
              />
              {defaultData.roleType == "professor" &&
                <CFormInput
                  type="text"
                  onChange={handleChange}
                  name="title"
                  value={data.title}
                  id="title"
                  floatingLabel="Titulli"
                  placeholder="Titulli"
                  aria-label="default input example"
                  className="mt-2"
                  required
                />


              }
              <CFormInput
                type="file"
                onChange={handleChange}
                name="profile_pic"
                id="profile_pic"
                aria-label="photo input example"
                className="mt-2"
              />

              <CFormInput
                type="date"
                onChange={handleChange}
                name="dob"
                id="dob"
                floatingLabel="Select Birth Date"
                placeholder="Select Birth Date"
                aria-label="date input example"
                className="mt-2"
                required
              />

              <CFormInput
                type="text"
                onChange={handleChange}
                name="birth_place"
                value={data.birth_place}
                id="birth_place"
                floatingLabel="Birth Place"
                placeholder="Birth Place"
                aria-label="default input example"
                className="mt-2"
                required
              />

              <CFormSelect
                name="gender_id"
                onChange={handleChange}
                floatingLabel="Gjinia"
                placeholder="Gjinia"
                value={data.gender_id}
                className="mt-2"
                required
              >
                <option value="" selected hidden disabled>
                  Gjinia
                </option>
                {genders?.map((el, index) => (
                  <option key={index} value={el.id}>
                    {el.name}
                  </option>
                ))}
              </CFormSelect>

              <CFormSelect
                name="country_id"
                onChange={handleChange}
                floatingLabel="Shtetësia"
                placeholder="Shtetësia"
                value={data.country_id}
                className="mt-2"
                required
              >
                <option value="" selected hidden disabled>
                  Select Country
                </option>
                {countries?.map((country) => (
                  <option key={country.id} value={country.id}>
                    {country.name}
                  </option>
                ))}
              </CFormSelect>

              <CFormSelect
                name="city_id"
                onChange={handleChange}
                floatingLabel="Qyteti"
                placeholder="Qyteti"
                value={data.city_id}
                className="mt-2"
                required
              >
                <option value="" selected hidden disabled>
                  Select City
                </option>
                {cities?.map((city) => (
                  <option key={city.id} value={city.id}>
                    {city.name}
                  </option>
                ))}
              </CFormSelect>

              <CFormInput
                type="text"
                onChange={handleChange}
                name="username"
                value={data.username}
                id="username"
                floatingLabel="Username"
                placeholder="Username"
                aria-label="default input example"
                className="mt-2"
                required
              />

              <CFormInput
                type="text"
                onChange={handleChange}
                name="personal_identification_number"
                value={data.personal_identification_number}
                id="personal_identification_number"
                floatingLabel="Personal Identification Number"
                placeholder="Personal Identification Number"
                aria-label="default input example"
                className="mt-2"
                required
              />

              <CFormInput
                type="email"
                onChange={handleChange}
                name="email"
                value={data.email}
                id="email"
                floatingLabel="Email"
                placeholder="Email"
                aria-label="default input example"
                className="mt-2"
                required
              />

              <CFormInput
                type="email"
                onChange={handleChange}
                name="backup_email"
                value={data.backup_email}
                id="backup_email"
                floatingLabel="Backup Email"
                placeholder="Backup Email"
                aria-label="default input example"
                className="mt-2"
                required
              />

              <CFormInput
                type="number"
                onChange={handleChange}
                name="phone_number"
                value={data.phone_number}
                id="phone_number"
                floatingLabel="Phone Number"
                placeholder="Phone Number"
                aria-label="default input example"
                className="mt-2"
                required
              />



            </CModalBody>
            <CModalFooter>
              <CustomButton type="button" actionType="secondary" onClick={handleModalClose}>
                Close
              </CustomButton>
              <CustomButton type="submit" actionType="save" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <CSpinner size="sm" />
                    Saving...
                  </>
                ) : (
                  'Save'
                )}
              </CustomButton>
            </CModalFooter>
          </CForm>
        </>
      }
    </CModal>
  )
}

AddUser.propTypes = {
  message: PropTypes.string,
  handleModalClose: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  defaultData: PropTypes.object.isRequired,
}

export default AddUser

