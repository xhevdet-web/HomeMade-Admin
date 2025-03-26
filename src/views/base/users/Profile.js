import { CButton, CCard, CCardBody, CCardHeader, CCardTitle, CCol, CContainer, CForm, CFormInput, CFormLabel, CFormSelect, CImage, CInputGroup, CInputGroupText, CListGroup, CListGroupItem, CRow, CSpinner } from '@coreui/react'
import React, { useEffect, useState } from 'react'
import ProfilePhoto from "../../../assets/images/profile-simple.svg"
import CIcon from '@coreui/icons-react'
import { cilPencil, cilAperture } from '@coreui/icons'
import useAxios from '../../../utils/useAxios'
import "../../../scss/_custom.scss"
import { useAuthSelector } from '../../../redux/selectors/authSelectors'
import { checkUserPermissions } from '../../../_helpers/UserInRole'
import { useLocation } from 'react-router-dom'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'
import ResetPassword from './ResetPassword'
import { CustomButton } from '../../../components'

const Profile = () => {
  const { sidebarData } = useSidebarSelector()
  const location = useLocation()
  const navItem = sidebarData?.find((el) => el.to === location.pathname)
  const { userData } = useAuthSelector()
  const roleId = userData.role_id
  const { axiosRequest, isLoading } = useAxios();

  const [data, setData] = useState({
    id: "",
    first_name: '',
    last_name: '',
    name: '',
    username: '',
    email: '',
    profile_pic: '',
    country_id: '',
    city_id: '',
    gender: '',
    dob: '',
    phone_number: '',
  });

  const [isEditing, setIsEditing] = useState(false)
  const [isResettingPassword, setIsResettingPassword] = useState(false)
  const [isChanged, setIsChanged] = useState(false);

  const [genders, setGenders] = useState([])
  const [countries, setCountries] = useState([])
  const [cities, setCities] = useState([])
  const [fetchedUser, setFetchedUser] = useState(true)


  const fetchUsersData = async () => {
    const { data } = await axiosRequest('/auth/me', 'get')
    setData(data)
    setFetchedUser(false)

  }

  const getNeededData = async () => {
    try {
      const gendersDataPromise = axiosRequest('genders/all', 'get');
      const citiesDataPromise = axiosRequest('cities/all', 'get');
      const countriesDataPromise = axiosRequest('countries/all', 'get');

      // Execute all requests concurrently
      const [gendersData, citiesData, countriesData] = await Promise.all([
        gendersDataPromise,
        citiesDataPromise,
        countriesDataPromise
      ]);

      setGenders(gendersData.data);
      setCities(citiesData.data);
      setCountries(countriesData.data);
    } catch (error) {
      console.error('Error fetching needed data:', error);
    }
  };


  console.log("data", data)
  const handleSubmit = async (e) => {
    e.preventDefault();
    const url = `users/${data?.id}`;
    const method = 'put';
    const requestData = { ...data };

    try {
      await axiosRequest(url, method, requestData);
      setIsChanged(false);
    } catch (error) {
      console.error('Error submitting data:', error);
    }
  };


  const handleChange = (e) => {
    const { value, name } = e.target

    setData((prevState) => ({
      ...prevState,
      [name]: value,
    }))
    setIsChanged(true);
  }


  const handleEditClick = () => {
    getNeededData()
    setIsEditing(!isEditing)
    setIsResettingPassword(false)
  }

  const handleResetPasswordClick = () => {
    setIsResettingPassword(!isResettingPassword)
    setIsEditing(false)
  }

  const handleProfileClick = () => {
    setIsEditing(false)
    setIsResettingPassword(false)
  }

  useEffect(() => {
    fetchUsersData()
  }, [])

  console.log("isLoading", data)

  return (
    <>
      {
        fetchedUser ? (
          <div className="text-center">
            < CSpinner />
          </div >)
          :
          <CContainer fluid>
            <CCard className="shadow rounded mb-4">
              <CCardHeader>
                <CRow>
                  <CCol className='d-flex gap-2'>
                    <CustomButton
                      onClick={handleProfileClick}
                      active={!isEditing && !isResettingPassword}
                      actionType="profile"
                    >
                      Profile
                    </CustomButton>

                    {checkUserPermissions(navItem, 'update', roleId) && (
                      <CustomButton
                        onClick={handleEditClick}
                        active={isEditing}
                        actionType="profile"
                      >
                        Edit Profile
                      </CustomButton>
                    )}

                    <CustomButton
                      onClick={handleResetPasswordClick}
                      active={isResettingPassword}
                      actionType="profile"
                    >
                      Reset Password
                    </CustomButton>

                  </CCol>
                </CRow>
              </CCardHeader>

              <CCardBody className="p-0">
                <CContainer fluid className="mt-5">
                  <CForm onSubmit={handleSubmit} className="mb-4">
                    <CRow>
                      <CCol md={4} xs={12} className="mb-2">
                        <CCardBody className="border rounded">
                          <CRow className="d-flex justify-content-center align-items-center">
                            <CCol className="text-center">
                              <CImage
                                className="rounded-circle border"
                                src={import.meta.env.VITE_IMAGES_API + data?.profile_pic || ProfilePhoto}
                                alt="Profile Photo"
                                width={180}
                                height={180}
                              // type="file"
                              // onChange={handleChange}
                              // name="profile_pic"
                              // id="profile_pic"
                              // aria-label="photo input example"
                              />
                              <h2 className="mt-3 mb-0">
                                {data?.first_name} {data?.last_name}
                              </h2>
                              <h6 className="mt-1 mb-5 text-secondary">
                                {data?.users_role?.name}
                              </h6>
                            </CCol>
                          </CRow>
                        </CCardBody>
                      </CCol>
                      <CCol md={8} xs={12} className="mb-2">
                        <CListGroup flush>
                          {isResettingPassword ? (
                            <>
                              <ResetPassword />

                            </>
                          ) : (
                            <>
                              <CRow>
                                <CCol md={12}>
                                  <CInputGroup className="mb-1">
                                    <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                      <div>Email</div>
                                    </CFormLabel>
                                    <CFormInput
                                      type="email"
                                      name="email"
                                      id="email"
                                      placeholder="Email"
                                      disabled={!isEditing}
                                      defaultValue={data?.email}
                                      value={data?.email}
                                      onChange={handleChange}
                                      className='col-6 text-start input-group-text border-0'
                                    />
                                  </CInputGroup>

                                  {/* <CInputGroup className="mb-1"> */}
                                  {/* <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                <div>Drejtimi</div>
                              </CFormLabel>
                              <CFormInput
                                type="text"
                                id="drejtimi"
                                name="major"
                                placeholder="Drejtimi"
                                disabled={!isEditing}
                                defaultValue={data?.email}
                                onChange={handleChange}
                                className='col-6 text-start input-group-text border-0'
                              /> */}
                                  {/* </CInputGroup> */}

                                  <CInputGroup className="mb-1">
                                    <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                      <div>Country</div>
                                    </CFormLabel>

                                    {!isEditing ? <CFormInput
                                      type="text"
                                      name="country_id"
                                      id="country_id"
                                      placeholder="Country"
                                      disabled={!isEditing}
                                      defaultValue={data?.country.name}
                                      value={data?.country.name}
                                      onChange={handleChange}
                                      className='col-6 text-start input-group-text border-0'
                                    />
                                      :
                                      <CFormSelect
                                        name="country_id"
                                        disabled={!isEditing}
                                        defaultValue={data.country_id}
                                        value={data.country_id}
                                        onChange={handleChange}
                                        className="form-select col-6 text-start input-group-text border-0 "
                                      >
                                        <option value="" hidden disabled>
                                          Select Country
                                        </option>
                                        {countries.map((country) => (
                                          <option key={country.id} value={country.id}>
                                            {country.name}
                                          </option>
                                        ))}
                                      </CFormSelect>
                                    }
                                  </CInputGroup>

                                  <CInputGroup className="mb-1">
                                    <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                      <div>City</div>
                                    </CFormLabel>



                                    {!isEditing ? <CFormInput
                                      type="text"
                                      name="city_id"
                                      id="city_id"
                                      placeholder="City"
                                      disabled={!isEditing}
                                      defaultValue={data?.city.name}
                                      value={data?.city.name}
                                      onChange={handleChange}
                                      className='col-6 text-start input-group-text border-0'
                                    />
                                      :


                                      <CFormSelect
                                        name="city_id"
                                        defaultValue={data.city_id}
                                        value={data.city_id}
                                        disabled={!isEditing}
                                        onChange={handleChange}
                                        className="col-6 text-start input-group-text border-0 "
                                      >
                                        <option value="" hidden disabled>
                                          Select City
                                        </option>
                                        {cities.map((city) => (
                                          <option key={city.id} value={city.id}>
                                            {city.name}
                                          </option>
                                        ))}
                                      </CFormSelect>
                                    }
                                  </CInputGroup>



                                  <CInputGroup className="mb-1">
                                    <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                      <div>Gender</div>
                                    </CFormLabel>


                                    {!isEditing ? <CFormInput
                                      type="text"
                                      name="gender_id"
                                      id="gender_id"
                                      placeholder="Gender"
                                      disabled={!isEditing}
                                      defaultValue={data?.gender.name}
                                      value={data?.gender.name}
                                      onChange={handleChange}
                                      className='col-6 text-start input-group-text border-0'
                                    />
                                      :


                                      <CFormSelect
                                        name="gender_id"
                                        disabled={!isEditing}
                                        defaultValue={data.gender_id}
                                        value={data.gender_id}
                                        onChange={handleChange}
                                        className=" col-6 text-start input-group-text border-0 "
                                      >
                                        <option value="" hidden disabled>
                                          Select Gender
                                        </option>
                                        {genders.map((el, index) => (
                                          <option key={index} value={el.id}>
                                            {el.name}
                                          </option>
                                        ))}
                                      </CFormSelect>
                                    }
                                  </CInputGroup>

                                  <CInputGroup className="mb-1">
                                    <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                      <div>Date of birth</div>
                                    </CFormLabel>
                                    <CFormInput
                                      type="date"
                                      id="dob"
                                      name="dob"
                                      placeholder="Date of Birth"
                                      disabled={!isEditing}
                                      defaultValue={data?.dob?.slice(0, 10)}
                                      onChange={handleChange}
                                      className='col-6 text-start input-group-text border-0'
                                    />
                                  </CInputGroup>

                                  <CInputGroup className="mb-1">
                                    <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                                      <div>Phone Number</div>
                                    </CFormLabel>
                                    <CFormInput
                                      type="number"
                                      id="phone_number"
                                      name="phone_number"
                                      placeholder="Phone Number"
                                      disabled={!isEditing}
                                      defaultValue={data?.phone_number}
                                      onChange={handleChange}
                                      className='col-6 text-start input-group-text border-0'
                                    />
                                  </CInputGroup>
                                </CCol>
                              </CRow>
                            </>
                          )}
                          <CRow>
                            <CCol className="text-end small text-muted">
                              <span className="small">
                                {/* Created at: {data?.createdAt?.slice(0, 10)} <br /> */}
                                Last updated at: {data?.updatedAt?.slice(0, 10).replace(/-/g, '/')}, {data?.updatedAt?.slice(11, 19)}
                              </span>
                            </CCol>
                            {isEditing && (
                              <CCol md={12} className="d-flex justify-content-end mt-1 mb-2">
                                <CustomButton disabled={!isChanged} actionType="edit" type="submit">Update</CustomButton>
                              </CCol>
                            )}
                          </CRow>
                        </CListGroup>
                      </CCol>
                    </CRow>
                  </CForm>
                </CContainer>
              </CCardBody>
            </CCard>
          </CContainer>
      }
    </>

  )
}



export default Profile
