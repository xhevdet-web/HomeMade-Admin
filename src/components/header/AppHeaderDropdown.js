import { CDropdown, CDropdownItem, CDropdownMenu, CDropdownToggle } from '@coreui/react'
import { useAuthSelector } from '../../redux/selectors/authSelectors'
import useLogout from '../../_helpers/HandleLogOut'

const AppHeaderDropdown = () => {
  const { userData } = useAuthSelector()
  const { handleLogout } = useLogout()
  return (
    <CDropdown variant="nav-item">
      <CDropdownToggle>{userData?.firstName || 'Administrator'}</CDropdownToggle>
      <CDropdownMenu>
        <CDropdownItem as="button" onClick={handleLogout}>
          Sign out
        </CDropdownItem>
      </CDropdownMenu>
    </CDropdown>
  )
}
export default AppHeaderDropdown
