/* eslint-disable no-unused-vars */
import React from 'react'
import { NavLink } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import PropTypes from 'prop-types'
import SimpleBar from 'simplebar-react'
import 'simplebar-react/dist/simplebar.min.css'

import { CBadge, CNavLink, CSidebarNav, CNavItem, CNavTitle, CNavGroup } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { setSidebarShow } from '../redux/actions/uiActions'
import { setCurrentView } from '../redux/actions/sidebarActionTypes'
import { useSidebarSelector } from '../redux/selectors/sidebarSelector'

import {
  cilDescription,
  cilSchool,
  cilLanguage,
  cilUser,
  cilContact,
  cilFolderOpen,
  cilGift,
  cilEnvelopeOpen,
  cilPaperclip,
  cilClipboard,
  cilPeople,
  cilHamburgerMenu,
  cilPuzzle,
  cilBell,
  cilChartPie,
  cilCursor,
  cilDrop,
  cilPencil,
  cilSpeedometer,
  cilStar,
  cilSettings,
  cilList,
  cilEnvelopeClosed,
  cilBank,
  cilSpreadsheet,
} from '@coreui/icons'

const componentMapping = {
  CBadge,
  CNavLink,
  CSidebarNav,
  CNavItem,
  CNavTitle,
  CNavGroup,
}

let icons = [
  { name: 'cilDescription', icon: cilDescription },
  { name: 'cilSpreadsheet', icon: cilSpreadsheet },
  { name: 'cilSchool', icon: cilSchool },
  { name: 'cilLanguage', icon: cilLanguage },
  { name: 'cilUser', icon: cilUser },
  { name: 'cilContact', icon: cilContact },
  { name: 'cilFolderOpen', icon: cilFolderOpen },
  { name: 'cilEnvelopeOpen', icon: cilEnvelopeOpen },
  { name: 'cilPaperclip', icon: cilPaperclip },
  { name: 'cilClipboard', icon: cilClipboard },
  { name: 'cilPeople', icon: cilPeople },
  { name: 'cilHamburgerMenu', icon: cilHamburgerMenu },
  { name: 'cilBank', icon: cilBank },
  { name: 'cilPuzzle', icon: cilPuzzle },
  { name: 'cilGift', icon: cilGift },
  { name: 'cilBell', icon: cilBell },
  { name: 'cilChartPie', icon: cilChartPie },
  { name: 'cilCursor', icon: cilCursor },
  { name: 'cilDrop', icon: cilDrop },
  { name: 'cilPencil', icon: cilPencil },
  { name: 'cilSpeedometer', icon: cilSpeedometer },
  { name: 'cilStar', icon: cilStar },
  { name: 'cilSettings', icon: cilSettings },
  { name: 'cilList', icon: cilList },
  { name: 'cilEnvelopeClosed', icon: cilEnvelopeClosed },
]

export const AppSidebarNav = ({ items }) => {
  const dispatch = useDispatch()
  const { currentView } = useSidebarSelector()

  const handleClick = (e, id) => {
    if (window.matchMedia('(max-width: 991px)').matches) dispatch(setSidebarShow(false))
    if (id) {
      dispatch(setCurrentView(id))
    }
    // Uncomment and modify this if you need payment validation
    // const isAllowed = HandlePaymentCheck({
    //   e,
    //   func: () => dispatch(setCurrentView(id)),
    //   unfinishedPayments,
    //   showToast,
    //   navigate
    // });
    // if (!isAllowed) {
    //   e.preventDefault();
    // }
  }

  const navLink = (title, icon_name, badge, indent = false) => {
    const iconObj = icons.find((icon) => icon.name === icon_name)

    return (
      <>
        {iconObj ? (
          <CIcon icon={iconObj.icon} className="nav-icon" />
        ) : (
          indent && (
            <span className="nav-icon">
              <span className="nav-icon-bullet"></span>
            </span>
          )
        )}
        {title && <span className="nav-text">{title}</span>}
        {badge && (
          <CBadge color={badge.color} className="ms-auto">
            {badge.text}
          </CBadge>
        )}
      </>
    )
  }

  const navItem = (item, index, indent = false) => {
    // console.log('itemitemitem', item)

    const { id, component, title, badge, icon_name, name, is_nav, ...rest } = item

    if (component) {
      const Component = componentMapping[component]
      if (!Component) {
        console.error(`Component "${component}" not found in componentMapping.`)
        return null
      }

      if (component === 'CNavTitle') {
        return <Component key={id || index}>{title}</Component>
      } else if (component === 'CNavGroup') {
        return (
          <Component key={id || index} toggler={navLink(title, icon_name)}>
            {item.children &&
              item.children.map((subItem, subIndex) =>
                subItem.component === 'CNavItem'
                  ? navItem(subItem, subIndex, true)
                  : navGroup(subItem, subIndex),
              )}
          </Component>
        )
      } else if (component === 'CNavItem') {
        return (
          <Component as="div" key={id || index}>
            {rest.to || rest.href ? (
              <CNavLink
                onClick={(e) => handleClick(e, id)}
                {...(rest.to && { as: NavLink })}
                {...rest}
                className={currentView === id ? 'active' : ''}
              >
                {navLink(title, icon_name, badge, indent)}
              </CNavLink>
            ) : (
              navLink(title, icon_name, badge, indent)
            )}
          </Component>
        )
      }
    }
    return null
  }

  const navGroup = (item, index) => {
    const { id, component, title, icon_name, ...rest } = item
    const Component = componentMapping[component]

    return (
      <Component key={id || index} toggler={navLink(title, icon_name)} {...rest}>
        {item.children &&
          item.children.map((subItem, subIndex) =>
            subItem.component === 'CNavItem'
              ? navItem(subItem, subIndex, true)
              : navGroup(subItem, subIndex),
          )}
      </Component>
    )
  }

  return (
    <CSidebarNav as={SimpleBar}>
      {items &&
        items.map((item, index) =>
          item.component === 'CNavGroup' ? navGroup(item, index) : navItem(item, index),
        )}
    </CSidebarNav>
  )
}

AppSidebarNav.propTypes = {
  items: PropTypes.arrayOf(PropTypes.any).isRequired,
}
