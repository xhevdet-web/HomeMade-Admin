import React from 'react'
import CIcon from '@coreui/icons-react'
import { cilHamburgerMenu, cilPuzzle, cilSpeedometer, cilStar } from '@coreui/icons'
import { CNavGroup, CNavItem, CNavTitle } from '@coreui/react'

let icons = [{ name: 'cilPuzzle', icon: cilPuzzle }]

const _nav = [
  {
    component: CNavItem,
    name: 'Dashboard',
    to: '/dashboard',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'danger',
      text: 'OLD',
    },
  },
  {
    component: CNavTitle,
    name: 'Access Control',
  },
  {
    component: CNavItem,
    name: 'Roles',
    to: '/roles',
    icon: <CIcon icon={cilSpeedometer} customClassName="nav-icon" />,
    badge: {
      color: 'info',
      text: 'NEW',
    },
  },
  {
    component: CNavItem,
    name: 'Sidebar',
    to: '/actions',
    icon: <CIcon icon={cilHamburgerMenu} customClassName="nav-icon" />,
  },

  {
    component: CNavTitle,
    name: 'Extras',
  },
  {
    component: CNavGroup,
    name: 'Base',
    to: '/base',
    icon: (
      <CIcon icon={icons.find((el) => el.name == 'cilPuzzle').icon} customClassName="nav-icon" />
    ),
    items: [
      {
        component: CNavItem,
        name: 'Accordion',
        to: '/base/accordion',
      },
      {
        component: CNavItem,
        name: 'Breadcrumb',
        to: '/base/breadcrumbs',
      },
    ],
  },
  {
    component: CNavGroup,
    name: 'Pages',
    icon: <CIcon icon={cilStar} customClassName="nav-icon" />,
    items: [
      {
        component: CNavItem,
        name: 'Login',
        to: '/login',
      },
      {
        component: CNavItem,
        name: 'Register',
        to: '/register',
      },
      {
        component: CNavItem,
        name: 'Error 404',
        to: '/404',
      },
      {
        component: CNavItem,
        name: 'Error 500',
        to: '/500',
      },
    ],
  },
]

export default _nav
