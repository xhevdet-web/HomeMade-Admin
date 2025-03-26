import PropTypes from 'prop-types'
import React, { useState, useEffect, useRef } from 'react'
import {
  CFormCheck,
  CDropdown,
  CDropdownToggle,
  CDropdownMenu,
  CDropdownItem,
  CBadge,
  CButton,
} from '@coreui/react'
import { useTheme } from '../redux/selectors/uiSelector'

const MultiSelect = ({ options, onChange, defaultSelected }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState(defaultSelected || [])
  const dropdownRef = useRef(null)
  const theme = useTheme()

  useEffect(() => {
    defaultSelected && setSelectedOptions(defaultSelected)
  }, [defaultSelected])

  const toggleDropdown = () => setIsOpen(!isOpen)

  const handleOptionClick = (optionId) => {
    let updatedSelectedOptions
    if (selectedOptions.includes(optionId)) {
      updatedSelectedOptions = selectedOptions.filter((item) => item !== optionId)
    } else {
      updatedSelectedOptions = [...selectedOptions, optionId]
    }
    setSelectedOptions(updatedSelectedOptions)
    onChange(updatedSelectedOptions)
  }

  const handleRemoveSelectedOption = (optionId, e) => {
    e.stopPropagation()
    const updatedSelectedOptions = selectedOptions.filter((item) => item !== optionId)
    setSelectedOptions(updatedSelectedOptions)
    onChange(updatedSelectedOptions)
  }

  const handleClickOutside = (event) => {
    if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
      setIsOpen(false)
    }
  }

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const badgeStyle = {
    backgroundColor: theme === 'dark' ? '#212631' : '#f0f0f0',
    color: theme === 'dark' ? '#fff' : '#000',
    border: theme === 'dark' ? '1px solid #323A49' : 'none',
  }

  const inputContainerStyle = {
    backgroundColor: theme === 'dark' ? '#212631' : '#f0f0f0',
    color: theme === 'dark' ? '#fff' : '#000',
    border: theme === 'dark' ? '1px solid #323A49' : 'none',
  }


  const inputStyle = {
    backgroundColor: theme === 'dark' ? '#212631' : '#fff',
    color: theme === 'dark' ? '#fff' : '#000',
    borderColor: theme === 'dark' ? '#555' : '#ccc',
  }

  const dropdownMenuStyle = {
    backgroundColor: theme === 'dark' ? '#333' : '#fff',
    color: theme === 'dark' ? '#fff' : '#000',
  }

  const dropdownItemStyle = {
    color: theme === 'dark' ? '#fff' : '#000',
    backgroundColor: theme === 'dark' ? '#333' : '#fff',
  };

  const dropdownItemHoverStyle = {
    backgroundColor: theme === 'dark' ? '#444' : '#e6e6e6',
  };

  return (
    <div className="multi-select-container mt-2" ref={dropdownRef}>
      <div className="selected-options-container">
        {selectedOptions.length > 0 &&
          selectedOptions.map((optionId) => {
            const option = options.find((opt) => opt.id === optionId)
            return (
              <CBadge key={optionId} style={badgeStyle} className="multi-select-badge">
                {option?.name}
                <CButton
                  size="sm"
                  className="multi-select-remove-btn"
                  onClick={(e) => handleRemoveSelectedOption(optionId, e)}
                  style={{ marginLeft: '5px', cursor: 'pointer', color: 'red' }}
                >
                  &times;
                </CButton>
              </CBadge>
            )
          })}
      </div>

      <div className="multi-select-input-container" onClick={toggleDropdown} style={inputContainerStyle}>
        <input
          type="text"
          className="multi-select-input"
          style={inputStyle}
          placeholder="Select Centers"
          readOnly
        />
      </div>

      {isOpen && (
        <CDropdown className="multi-select-dropdown">
          <CDropdownToggle caret className="multi-select-dropdown-toggle" />
          <CDropdownMenu style={dropdownMenuStyle} className={`multi-select-options ${isOpen ? 'show' : ''}`}>
            {options.map((option) => (
              <CDropdownItem
                key={option.id}
                className="multi-select-option"
                onClick={() => handleOptionClick(option.id)}
                style={dropdownItemStyle}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = dropdownItemHoverStyle.backgroundColor}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = dropdownItemStyle.backgroundColor}
              >
                <CFormCheck
                  id={option.id}
                  label={`${option.name}`}
                  checked={selectedOptions.includes(option.id)}
                  onChange={(e) => {
                    e.stopPropagation();
                    handleOptionClick(option.id);
                  }}
                  style={{ color: theme === 'dark' ? '#fff' : '#000' }}
                />
              </CDropdownItem>
            ))}
          </CDropdownMenu>
        </CDropdown>
      )}
    </div>
  )
}

MultiSelect.propTypes = {
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
  defaultSelected: PropTypes.array,
}

export default MultiSelect
