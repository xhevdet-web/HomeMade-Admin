import React, { useState } from 'react'
import {
  CButton,
  CCard,
  CCardBody,
  CCardGroup,
  CCol,
  CContainer,
  CForm,
  CFormCheck,
  CFormInput,
  CImage,
  CInputGroup,
  CInputGroupText,
  CRow,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilLockLocked, cilUser } from '@coreui/icons'
import useAxios from '../../../utils/useAxios'
import { useModal, useValidation } from '../../../_helpers'
import sign from 'jwt-encode'
import { setUserToken } from '../../../redux/actions/authActionTypes'
import { useDispatch } from 'react-redux'
import SIMSLogo from '../../../assets/images/avatars/cacttus.png'

const Login = () => {
  const { showModal } = useModal()
  const dispatch = useDispatch()

  const [data, setData] = useState({
    email: '',
    password: '',
    rememberMe: false,
  })

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target
    setData({
      ...data,
      [name]: type === 'checkbox' ? checked : value,
    })
  }

  const { validateForm, validated } = useValidation()
  const { axiosRequest, isLoading } = useAxios()

  const handleLogin = async (event) => {
    event.preventDefault()
    const form = event.target
    if (!validateForm(form)) {
      e.stopPropagation()
      return
    }
    else {
      let secretKey = import.meta.env.VITE_SECRET_KEY
      let credentials = { email: data.email, password: data.password, rememberMe: data.rememberMe }
      let JWTdata = { token: sign(credentials, secretKey) }
      const loginResponse = await axiosRequest('/auth/login', 'post', { email: data.email, password: data.password,data})
      console.log("loginResponseloginResponse", loginResponse.access_token)
      if (loginResponse.status === 'Success') {
        dispatch(setUserToken(loginResponse.access_token))
      }
    }
  }

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={8}>
            <CCardGroup>
              <CCard className="p-4">

                <CCardBody>
                  <CForm onSubmit={handleLogin} noValidate validated={validated}>
                    <h1>Login</h1>
                    <p className="text-body-secondary">Sign In to your account</p>
                    <CInputGroup className="mb-3">
                      <CInputGroupText>
                        <CIcon icon={cilUser} />
                      </CInputGroupText>
                      <CFormInput
                        onChange={handleInputChange}
                        placeholder="Email"
                        autoComplete="username"
                        name="email"
                        type="email"
                        feedbackInvalid="Please provide a valid email."
                        required
                      />
                    </CInputGroup>
                    <CInputGroup className="mb-2">
                      <CInputGroupText>
                        <CIcon icon={cilLockLocked} />
                      </CInputGroupText>
                      <CFormInput
                        onChange={handleInputChange}
                        type="password"
                        name="password"
                        required
                        placeholder="Password"
                        feedbackInvalid="Please type your password."
                        autoComplete="current-password"
                      />
                    </CInputGroup>
            
                    <CRow className='mt-3'>
                      <CCol xs={6}>
                        <CButton
                          timeout={2000}
                          type="submit"
                          // color="primary"
                          className="px-4 bg-primary text-white"
                          disabled={isLoading}
                        >
                          Login
                        </CButton>
                      </CCol>
                      <CCol xs={6} className="text-right">
                  
                      </CCol>
                    </CRow>
                  </CForm>
                </CCardBody>
              </CCard>
              <CCard className="text-black bg-white py-5" >
                <CCardBody className="text-center d-flex align-items-center">
                  <div>
                    <CImage className="col-8 " src={SIMSLogo} alt="SIMS" />
                    <p>
                      Mirë se erdhët në Initial Project
                    </p>
                  </div>
                </CCardBody>
              </CCard>
            </CCardGroup>
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Login
