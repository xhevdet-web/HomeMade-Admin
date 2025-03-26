import React from 'react'
import { CAvatar, CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { cilLockLocked } from '@coreui/icons'
import CIcon from '@coreui/icons-react'
import avatar8 from './../../assets/images/avatars/8.jpg'
import { useLogout } from '../../_helpers'

const AppHeaderDropdown = () => {
  // const { re_authenticated } = useAttendanceSelector();
  const { handleLogout } = useLogout()

  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle placement="bottom-end" className="py-0 pe-0" caret={false}>
        <CAvatar src={avatar8} size="md" />
      </CDropdownToggle>

      {/* {(re_authenticated !== null || userData.role_id !== "b263c795-18e5-46ae-a5f0-22928d24e32d") && ( */}
      <CDropdownMenu className="p-2" placement="bottom-end">
        {/* {userData.role_id !== "b263c795-18e5-46ae-a5f0-22928d24e32d" && ( */}
        <>
          {/* <CDropdownHeader className="bg-body-secondary fw-semibold my-2">Settings</CDropdownHeader> */}
          {/* <CDropdownItem role="button" onClick={(e) => HandlePaymentCheck({
                e,
                func: () => showModal('QRCode'),
                unfinishedPayments,
                showToast,
                navigate
              })}>
                <CIcon icon={cilQrCode} className="me-2" />
                Get QR Code
              </CDropdownItem> */}
          {/* <CDropdownDivider /> */}
          {/* <CDropdownItem onClick={handleClickGoToProfile}>
            <CIcon icon={cilUser} className="me-2" />
            Profile
          </CDropdownItem> */}

          {/* <CDropdownDivider /> */}
        </>
        {/* )} */}

        {/* {(re_authenticated !== null || userData.role_id !== "b263c795-18e5-46ae-a5f0-22928d24e32d") && ( */}
        <CDropdownItem className="p-2" onClick={(e) => handleLogout(e)} role="button">
          <CIcon icon={cilLockLocked} className="me-2" />
          Log out
        </CDropdownItem>
        {/* )} */}
      </CDropdownMenu>
      {/* )} */}
    </CDropdown>
  )
}

export default AppHeaderDropdown
