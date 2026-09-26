import { useDispatch, useSelector } from 'react-redux'
import { useLocation } from 'react-router-dom'
import { CContainer, CHeader, CHeaderToggler } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilMenu } from '@coreui/icons'
import { setSidebarShow } from '../redux/actions/uiActions'
import { useAuthSelector } from '../redux/selectors/authSelectors'
import navigation from '../navigation'

const AppHeader = () => {
  const dispatch = useDispatch()
  const visible = useSelector((state) => state.ui.sidebarShow)
  const { pathname } = useLocation()
  const { userData } = useAuthSelector()
  const title = navigation.find((route) => route.to === pathname)?.title || 'Dashboard'
  return (
    <CHeader position="sticky" className="hm-header">
      <CContainer fluid>
        <div className="d-flex align-items-center gap-3">
          <CHeaderToggler
            aria-label="Toggle navigation"
            onClick={() => dispatch(setSidebarShow(!visible))}
          >
            <CIcon icon={cilMenu} />
          </CHeaderToggler>
          <span className="hm-header-title">{title}</span>
        </div>
        <div className="hm-header-account">
          <span className="hm-status-dot" />
          <span>Admin workspace</span>
          <span className="hm-avatar">{userData?.firstName?.[0] || 'A'}</span>
        </div>
      </CContainer>
    </CHeader>
  )
}
export default AppHeader
