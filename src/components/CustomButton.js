import React from 'react'
import { CButton } from '@coreui/react'
import CIcon from '@coreui/icons-react'
import { cilPlus } from '@coreui/icons'
import { Link } from 'react-router-dom'
import PropTypes from 'prop-types'

const CustomButton = ({ actionType, onClick, to, state, children, disabled, type, active, className }) => {
  let color = ''
  let icon = null
  let additionalProps = {}
  let classNames = 'text-white'
  let buttonStyle = {} // New object to handle inline styles

  switch (actionType) {
    case 'create':
      // buttonStyle = { backgroundColor: '#002f6c', borderColor: '#002f6c' } 
      color='info'
      break
    case 'view':
      color = 'info'
      break
    case 'edit':
      color = 'warning'
      break
    case 'delete':
      color = 'danger'
      break
    case 'save':
      color = 'success'
      break
    case 'cancel':
      color = 'danger'
      break
    case 'modify':
      color = 'info'
      break
    case 'profile':
      // color = 'none'
      break
    default:
      color = 'primary'
      break
  }

  switch (actionType) {
    case 'create':
      classNames += ' text-bold px-4'
      additionalProps = {
        size: 'sm',
      }
      icon = <CIcon icon={cilPlus} />
      break
    case 'delete':
      classNames += ' text-bold'
      additionalProps = {
        size: 'sm',
      }
      break
    case 'view':
      additionalProps = {
        size: 'sm',
        as: Link,
        to: to,
        state: state,
      }
      break
    case 'modify':
      classNames += ' text-bold'
      additionalProps = {
        size: 'sm',
        as: Link,
        to: to,
        state: state,
      }
      break
    default:
      break
  }

  if (actionType === 'profile') {
    if (active) {
      classNames += ' border-bottom border-2 rounded-0'
      if (children === 'Profile') {
        classNames += ' border-bottom-info'
      } else if (children === 'Edit Profile') {
        classNames += ' border-bottom-warning'
      } else if (children === 'Reset Password') {
        classNames += ' border-bottom-danger'
      }
    }
  }

  return (
    <CButton
      size='sm'
      type={type}
      disabled={disabled}
      color={color}
      onClick={onClick}
      {...additionalProps}
      className={classNames + ' ' + className}
      style={{
        ...buttonStyle, // Apply the custom color styles
        border: 'none',
        transition: actionType === 'profile' && active ? 'none' : '',
      }}
    >
      {icon} {children}
    </CButton>
  )
}

CustomButton.propTypes = {
  actionType: PropTypes.oneOf(['create', 'view', 'edit', 'delete', 'save', 'cancel', 'modify']),
  onClick: PropTypes.func,
  to: PropTypes.string,
  state: PropTypes.object,
  children: PropTypes.node.isRequired,
  disabled: PropTypes.bool,
  type: PropTypes.string,
  className: PropTypes.string,
}

export default CustomButton
