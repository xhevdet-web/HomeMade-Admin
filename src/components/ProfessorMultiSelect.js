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

const ProfessorMultiSelect = ({ options, onChange }) => {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedOptions, setSelectedOptions] = useState([])
  const [inputValues, setInputValues] = useState({})
  const dropdownRef = useRef(null)

  const toggleDropdown = (e) => {
    e.stopPropagation()
    setIsOpen(!isOpen)
  }

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

  const handleRemoveSelectedOption = (optionId) => {
    const updatedSelectedOptions = selectedOptions.filter((item) => item !== optionId)
    setSelectedOptions(updatedSelectedOptions)
    setInputValues((prev) => {
      const newValues = { ...prev }
      delete newValues[optionId]
      return newValues
    })
    onChange(updatedSelectedOptions)
  }

  const handleInputChange = (e) => {
    const { name, value } = e.target
    setInputValues((prev) => ({
      ...prev,
      [name]: value,
    }))
  }

  console.log('input', inputValues)
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

  return (
    <div className="professor-multi-select-container mt-2" ref={dropdownRef}>
      <div className="multi-select-input-container" onClick={toggleDropdown}>
        {selectedOptions.map((optionId) => {
          const option = options.find((opt) => opt.id === optionId)
          const inputs = inputValues[optionId] || {}
          return (
            <CBadge key={optionId} className="multi-select-badge">
              <div className="professor-name">
                {option.first_name} {option.last_name}
                <CButton
                  size="sm"
                  className="multi-select-remove-btn"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleRemoveSelectedOption(optionId)
                  }}
                >
                  &times;
                </CButton>
              </div>
              <div className="multi-select-inputs">
                <label>
                  Finals:
                  <input
                    type="number"
                    name="finals_percentage"
                    className="multi-select-input-field"
                    value={inputs.finals || ''}
                    onChange={(e) => handleInputChange(e, optionId, 'finals')}
                  />
                </label>
                <label>
                  Lectures:
                  <input
                    type="number"
                    className="multi-select-input-field"
                    name="lectures_percentage"
                    value={inputs.lectures || ''}
                    onChange={(e) => handleInputChange(e, optionId, 'lectures')}
                  />
                </label>
                <label>
                  Homework:
                  <input
                    type="number"
                    name="homework_percentage"
                    className="multi-select-input-field"
                    value={inputs.homework || ''}
                    onChange={(e) => handleInputChange(e, optionId, 'homework')}
                  />
                </label>
              </div>
            </CBadge>
          )
        })}
        <input
          type="text"
          className="multi-select-input"
          value=""
          placeholder={selectedOptions.length ? '' : 'Select options'}
          readOnly
        />
      </div>
      {isOpen && (
        <CDropdown className="multi-select-dropdown">
          <CDropdownToggle caret className="multi-select-dropdown-toggle" />
          <CDropdownMenu className={`multi-select-options ${isOpen ? 'show' : ''}`}>
            {options.map((option) => (
              <CDropdownItem
                key={option.id}
                className="multi-select-option"
                onClick={() => handleOptionClick(option.id)}
              >
                <CFormCheck
                  id={option.id}
                  label={`${option.first_name} ${option.last_name}`}
                  checked={selectedOptions.includes(option.id)}
                  onChange={() => handleOptionClick(option.id)}
                />
              </CDropdownItem>
            ))}
          </CDropdownMenu>
        </CDropdown>
      )}
    </div>
  )
}

ProfessorMultiSelect.propTypes = {
  options: PropTypes.array.isRequired,
  onChange: PropTypes.func.isRequired,
}

export default ProfessorMultiSelect
