// import React, { useState, useEffect } from 'react'
// import {
//   CButton,
//   CModal,
//   CModalBody,
//   CModalFooter,
//   CModalHeader,
//   CModalTitle,
//   CInputGroup,
//   CFormInput,
//   CInputGroupText,
//   CRow,
//   CCol,
//   CFormCheck,
//   CForm,
// } from '@coreui/react'
// import CIcon from '@coreui/icons-react'
// import { cilLockLocked } from '@coreui/icons'
// import PropTypes from 'prop-types'
// import { CustomButton } from '../../components'
// import { useToast, useValidation } from '../../_helpers'
// import useAxios from '../../utils/useAxios'
// import { useAuthSelector } from '../../redux/selectors/authSelectors'
// import { setAcceptedTC } from '../../redux/actions/authActionTypes'
// import sign from 'jwt-encode'
// import { useDispatch } from 'react-redux'

// const TermsAndConditions = ({ message, handleModalClose }) => {
//   console.log('TermsAndConditions MESSAGE: ', message)

//   const { validateForm, validated } = useValidation()
//   const { axiosRequest, isLoading } = useAxios()
//   const { userData } = useAuthSelector()
//   const { showToast } = useToast()
//   console.log('userDatat', userData)
//   const [passwordData, setPasswordData] = useState({
//     new_password: '',
//     confirmPassword: '',
//   })
//   console.log('userData?.acceptTerms', userData?.acceptTerms)
//   const dispatch = useDispatch()

//   const [passwordChanged, setPasswordChanged] = useState(false)
//   const [acceptTerms, setAcceptTerms] = useState(userData?.accepted_TC || false)

//   const handleInputChange = (e) => {
//     const { name, value } = e.target
//     setPasswordData({
//       ...passwordData,
//       [name]: value,
//     })
//   }
//   console.log('userData.accepted_TCaccepted_TC', userData)
//   const handleClose = async () => {
//     if (userData) {
//       if (userData.accepted_TC) {
//         handleModalClose()
//       } else {
//         showToast('Info', 'Ju lutem pranoni kushtet e perdorimit!')
//       }
//     } else {
//       handleModalClose()
//     }
//   }

//   const handleChangePassword = async (e) => {
//     e.preventDefault()
//     const form = e.target;  // e.target should be the form element
//     if (!validateForm(form)) {
//       e.stopPropagation()
//       return
//     }


//     if (form.checkValidity()) {
//       if (passwordData.new_password !== passwordData.confirmPassword) {
//         showToast('Info', 'Passwords do not match')
//         return
//       }

//       let secretKey = import.meta.env.VITE_SECRET_KEY
//       let credentials = passwordData.new_password
//       let JWTdata = { new_password: sign(credentials, secretKey) }

//       const passwordChangeResponse = await axiosRequest('/auth/password-reset', 'post', JWTdata)

//       if (passwordChangeResponse.status === 'Success') {
//         setPasswordChanged(true)
//       }
//     }
//   }

//   const handleAcceptTerms = async () => {
//     try {
//       if (acceptTerms) {
//         const response = await axiosRequest(`/users/TC/${userData.id}`, 'put', {
//           accepted_TC: acceptTerms,
//         })

//         if (response.status === 'Success') {
//           dispatch(setAcceptedTC(true))
//           handleModalClose()
//         }
//       } else {
//         let needPassChangedMsg =
//           'Duhet të ndryshoni passwordin dhe të i pranoni kushtet e përdorimit që të keni qasje'
//         let passChangedMsg = 'Duhet të i pranoni kushtet e përdorimit që të keni qasje'
//         showToast('Info', passwordChanged ? passChangedMsg : needPassChangedMsg)
//       }
//     } catch (error) {
//       console.error('Error updating terms and conditions:', error)
//       showToast('Error', 'Failed to update terms and conditions')
//     }
//   }

//   useEffect(() => {
//     if (userData) {
//       // dispatch(setAcceptedTC(userData.accepted_TC || false));
//     }
//   }, [userData])

//   return (
//     <CModal
//       backdrop="static"
//       scrollable
//       visible
//       size="xl"
//       onClose={handleClose}
//       aria-labelledby="ScrollingLongContentExampleLabel2"
//     >
//       <CModalHeader closeButton={false}>
//         <CModalTitle id="ScrollingLongContentExampleLabel2">Terms and conditions</CModalTitle>
//         <CButton className="btn-close" onClick={handleClose}></CButton>
//       </CModalHeader>
//       <CModalBody>
//         <p>
//           Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis
//           in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
//         </p>
//         <p>
//           Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus
//           vel augue laoreet rutrum faucibus dolor auctor.
//         </p>
//         <p>
//           Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel
//           scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus
//           auctor fringilla.
//         </p>
//         <p>
//           Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis
//           in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
//         </p>
//         <p>
//           Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus
//           vel augue laoreet rutrum faucibus dolor auctor.
//         </p>
//         <p>
//           Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel
//           scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus
//           auctor fringilla.
//         </p>
//         <p>
//           Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis
//           in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
//         </p>
//         <p>
//           Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus
//           vel augue laoreet rutrum faucibus dolor auctor.
//         </p>
//         <p>
//           Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel
//           scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus
//           auctor fringilla.
//         </p>
//         <p>
//           Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis
//           in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
//         </p>
//         <p>
//           Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus
//           vel augue laoreet rutrum faucibus dolor auctor.
//         </p>
//         <p>
//           Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel
//           scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus
//           auctor fringilla.
//         </p>
//         <p>
//           Cras mattis consectetur purus sit amet fermentum. Cras justo odio, dapibus ac facilisis
//           in, egestas eget quam. Morbi leo risus, porta ac consectetur ac, vestibulum at eros.
//         </p>
//         <p>
//           Praesent commodo cursus magna, vel scelerisque nisl consectetur et. Vivamus sagittis lacus
//           vel augue laoreet rutrum faucibus dolor auctor.
//         </p>
//         <p>
//           Aenean lacinia bibendum nulla sed consectetur. Praesent commodo cursus magna, vel
//           scelerisque nisl consectetur et. Donec sed odio dui. Donec ullamcorper nulla non metus
//           auctor fringilla.
//         </p>

//         {userData && !userData?.accepted_TC && (
//           <>
//             <CForm
//               className="mt-5 mb-4"
//               onSubmit={handleChangePassword}
//               noValidate
//               validated={validated}
//             >
//               <CRow className="align-items-center">
//                 <CCol
//                   lg
//                   md="12"
//                   className="d-flex flex-column align-items-lg-start align-items-center"
//                 >
//                   <CInputGroup className="mb-3">
//                     <CInputGroupText>
//                       <CIcon icon={cilLockLocked} />
//                     </CInputGroupText>
//                     <CFormInput
//                       type="password"
//                       floatingLabel="New Password"
//                       placeholder="New Password"
//                       feedbackInvalid="Please make sure the passwords match."
//                       name="new_password"
//                       value={passwordData.new_password}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </CInputGroup>
//                   <CInputGroup>
//                     <CInputGroupText>
//                       <CIcon icon={cilLockLocked} />
//                     </CInputGroupText>
//                     <CFormInput
//                       type="password"
//                       floatingLabel="Confirm New Password"
//                       placeholder="Confirm New Password"
//                       feedbackInvalid="Please make sure the passwords match."
//                       name="confirmPassword"
//                       value={passwordData.confirmPassword}
//                       onChange={handleInputChange}
//                       required
//                     />
//                   </CInputGroup>
//                 </CCol>
//                 <CCol lg md="12" className="mt-3 mt-lg-0 d-flex justify-content-center">
//                   <CustomButton type="submit" disabled={isLoading} actionType="edit">
//                     Change Password
//                   </CustomButton>
//                 </CCol>
//               </CRow>
//             </CForm>
//           </>
//         )}
//       </CModalBody>
//       {console.log('!!passwordChanged', !!passwordChanged)}
//       <CModalFooter>
//         {userData ? (
//           <>
//             <div className="me-auto">
//               <CFormCheck
//                 label="Unë i kam lexuar dhe i pranoj kushtet e përdorimit dhe të privatësis."
//                 id="Accept TC"
//                 disabled={!passwordChanged}
//                 checked={acceptTerms}
//                 onChange={() => setAcceptTerms(true)}
//               />
//             </div>

//             <div className="d-flex gap-2">
//               {userData.accepted_TC ? (
//                 <CustomButton onClick={handleClose} actionType="cancel">
//                   Close
//                 </CustomButton>
//               ) : (
//                 <CustomButton actionType="save" onClick={handleAcceptTerms}>
//                   Pranoj
//                 </CustomButton>
//               )}
//             </div>
//           </>
//         ) : (
//           <CustomButton onClick={handleClose} actionType="cancel">
//             Close
//           </CustomButton>
//         )}
//       </CModalFooter>
//     </CModal>
//   )
// }

// TermsAndConditions.propTypes = {
//   message: PropTypes.string.isRequired,
//   handleModalClose: PropTypes.func.isRequired,
// }
// export default TermsAndConditions


import React from 'react'

const TermsAndConditions = () => {
  return (
    <div>TermsAndConditions</div>
  )
}

export default TermsAndConditions