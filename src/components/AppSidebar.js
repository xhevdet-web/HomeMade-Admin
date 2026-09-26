import { useDispatch, useSelector } from 'react-redux'
import { NavLink } from 'react-router-dom'
import {
  CButton,
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
} from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilAccountLogout } from '@coreui/icons'
import { AppSidebarNav } from './AppSidebarNav'
import { setSidebarShow } from '../redux/actions/uiActions'
import { useSidebarSelector } from '../redux/selectors/sidebarSelector'
import { useAuthSelector } from '../redux/selectors/authSelectors'
import useLogout from '../_helpers/HandleLogOut'

const AppSidebar = () => {
  const dispatch = useDispatch()
  const visible = useSelector((state) => state.ui.sidebarShow)
  const { filteredSidebarData } = useSidebarSelector()
  const { userData } = useAuthSelector()
  const { handleLogout } = useLogout()
  const initials = `${userData?.firstName?.[0] || ''}${userData?.lastName?.[0] || ''}` || 'A'
  return (
    <CSidebar
      className="hm-sidebar"
      position="fixed"
      visible={visible}
      onVisibleChange={(value) => dispatch(setSidebarShow(value))}
    >
      <CSidebarHeader>
        <CSidebarBrand as={NavLink} to="/dashboard" className="hm-wordmark">
          <span className="hm-monogram">h.</span>
          <span>
            HomeMade<small>ADMIN STUDIO</small>
          </span>
        </CSidebarBrand>
        <CCloseButton
          className="d-lg-none"
          white
          aria-label="Close navigation"
          onClick={() => dispatch(setSidebarShow(false))}
        />
      </CSidebarHeader>
      <AppSidebarNav items={filteredSidebarData} />
      <CSidebarFooter className="hm-sidebar-footer">
        <div className="hm-admin">
          <span className="hm-avatar">{initials}</span>
          <div>
            <strong>
              {userData?.firstName} {userData?.lastName}
            </strong>
            <small title={userData?.email}>{userData?.email}</small>
            <span className="hm-admin-role">Administrator</span>
          </div>
        </div>
        <CButton className="hm-logout" onClick={handleLogout}>
          <CIcon icon={cilAccountLogout} />
          Sign out
        </CButton>
      </CSidebarFooter>
    </CSidebar>
  )
}
export default AppSidebar
