import { CCol, CFormInput, CFormLabel, CInputGroup, CRow } from '@coreui/react'
import React, { useState } from 'react'

const ResetPassword = () => {

  // const [newPassword, setNewPassword] = useState('')
  // const [confirmPassword, setConfirmPassword] = useState('')
  const [isResettingPassword, setIsResettingPassword] = useState(false)

    return (
        <>
            <CRow>
                <CCol md={12}>
                    <CInputGroup className="mb-1">
                        <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                            <div>Email</div>
                        </CFormLabel>
                        <CFormInput
                            type="email"
                            id="email"
                            placeholder="Email"
                            // defaultValue={data?.email}
                            // onChange={handleChange}
                            className='col-6 text-start input-group-text border-0'
                        />
                    </CInputGroup>

                    <CInputGroup className="mb-1">
                        <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                            <div>New Password</div>
                        </CFormLabel>
                        <CFormInput
                            type="password"
                            id="newPassword"
                            // placeholder="New Password"
                            name="newPassword"
                            // onChange={(e) => setNewPassword(e.target.value)}
                            className='col-6 text-start input-group-text border-0'
                        />
                    </CInputGroup>

                    <CInputGroup className="mb-1">
                        <CFormLabel className="py-3 ps-3 pe-0 col-6 d-flex justify-content-between border-0 text-muted" style={{ backgroundColor: 'var(--cui-secondary-bg)' }}>
                            <div>Confirm Password</div>
                        </CFormLabel>
                        <CFormInput
                            type="password"
                            id="confirmPassword"
                            // placeholder="Confirm Password"
                            name="confirmPassword"
                            // onChange={(e) => setConfirmPassword(e.target.value)}
                            className='col-6 text-start input-group-text border-0'
                        />
                    </CInputGroup>
                </CCol>
                {isResettingPassword && (
                    <CCol md={12} className="d-flex justify-content-end mt-1 mb-2">
                        <CButton color="success" type="submit" 
                        // onClick={(e) => handleChangePassword(e)}
                        >
                            Save
                        </CButton>
                    </CCol>
                )}
            </CRow>
        </>
    )
}

export default ResetPassword
