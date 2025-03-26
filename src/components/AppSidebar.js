import React from 'react'
import { useSelector, useDispatch } from 'react-redux'

import {
  CCloseButton,
  CSidebar,
  CSidebarBrand,
  CSidebarFooter,
  CSidebarHeader,
  CSidebarToggler,
  CImage,
} from '@coreui/react'

import { AppSidebarNav } from './AppSidebarNav'

import avatar9 from './../assets/images/avatars/cacttus.png'
import avatar8 from './../assets/images/avatars/wh_cac.png'


// sidebar nav config
// import navigation from '../_nav'
import { setSidebarShow, setSidebarUnfoldable } from '../redux/actions/uiActions'
import { useTheme } from '../redux/selectors/uiSelector'
import { useSidebarSelector } from '../redux/selectors/sidebarSelector'

const AppSidebar = () => {
  const selectedTheme = useTheme()
  const dispatch = useDispatch()

  const { filteredSidebarData } = useSidebarSelector()

  const unfoldable = useSelector((state) => state.ui.sidebarUnfoldable)
  const sidebarShow = useSelector((state) => state.ui.sidebarShow)
  const isSystemDarkMode =
    window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches

  let themeBasedLogo
  if (selectedTheme === 'light') {
    themeBasedLogo = avatar9
  } else if (selectedTheme === 'auto') {
    themeBasedLogo = isSystemDarkMode ? avatar8 : avatar9
  } else {
    themeBasedLogo = avatar8
  }

  return (
    <CSidebar
      className="border-end"
      colorScheme="light"
      position="fixed"
      unfoldable={unfoldable}
      visible={sidebarShow}
      onVisibleChange={(visible) => {
        dispatch(setSidebarShow(visible))
      }}
    >
      <CSidebarHeader className="border-bottom">
        <CSidebarBrand to="/">
          <CImage
            className="sidebar-brand-full w-100"
            fluid
            src={themeBasedLogo}
            // width={200}
            // height={32}
          />
          {/* <CIcon customClassName="sidebar-brand-narrow" icon={sygnet} height={32} /> */}
        </CSidebarBrand>
        <CCloseButton className="d-lg-none" dark onClick={() => dispatch(setSidebarShow(false))} />
      </CSidebarHeader>
      <AppSidebarNav items={filteredSidebarData} />
      <CSidebarFooter className="border-top d-none d-lg-flex">
        <CSidebarToggler onClick={() => dispatch(setSidebarUnfoldable(!unfoldable))} />
      </CSidebarFooter>
    </CSidebar>
  )
}

export default React.memo(AppSidebar)
