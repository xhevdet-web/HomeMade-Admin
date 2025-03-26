import React, { useState, useEffect } from 'react'
import PropTypes from 'prop-types'
import {
  CForm,
  CFormCheck,
  CFormInput,
  CFormSelect,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
  CTableDataCell,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { useSidebarSelector } from '../../redux/selectors/sidebarSelector'
import { useValidation } from '../../_helpers'
import icons from '../../assets/icons.json' // Importing JSON data
import { CustomButton } from '../../components'

const AddActionFunction = ({ handleModalClose, type, defaultData }) => {
  console.log('defaultData', type)

  const [data, setData] = useState(
    defaultData || {
      component: '',
      name: '',
      to: '/',
      icon_name: '',
      parent: '',
      is_nav: false,
      is_child: false,
    },
  )

  const componentMapping = [
    { value: 'CNavItem', label: 'Nav Item' },
    { value: 'CNavTitle', label: 'Nav Title' },
    { value: 'CNavGroup', label: 'Nav Group' },
  ]

  const [iconOptions, setIconOptions] = useState([])
  const { sidebarData } = useSidebarSelector()
  const { validateForm, validated } = useValidation()
  const { axiosRequest, isLoading } = useAxios()

  useEffect(() => {
    // Fetch icons from JSON data
    setIconOptions(icons.map((icon) => icon.name))
  }, [])

  useEffect(() => {
    if (defaultData) {
      setData(defaultData)
    }
  }, [defaultData])

  const handleChange = (e) => {
    const { value, name, checked, type } = e.target
    setData((prevState) => ({
      ...prevState,
      [name]: type === 'checkbox' ? checked : value,
    }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const form = e.target;  // e.target should be the form element
    if (!validateForm(form)) {
      e.stopPropagation()
      return
    }
    if (form.checkValidity()) {
      let url = '/nav' // Default endpoint
      let method = 'post' // Default method

      if (type === 'delete') {
        url = `/nav/${data.id}` // DELETE request with ID parameter
        method = 'delete'
      }
      if (type === 'edit') {
        url = `/nav/update`
        method = 'put'
      }
      if (type === 'create') {
        url = `/nav`
        method = 'post'
      }

      await axiosRequest(url, method, data, handleModalClose)
    }
  }

  return (
    <CModal
      backdrop="static"
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">
          {type === 'delete' ? 'Delete Action' : 'Add/Edit Action'}
        </CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit} noValidate validated={validated}>
        <CModalBody>
          <CFormSelect
            className="mb-2"
            name="component"
            value={data.component}
            onChange={handleChange}
          >
            <option selected hidden disabled value="">
              Select an option
            </option>
            {componentMapping.map((el) => (
              <option key={el.value} value={el.value}>
                {el.label}
              </option>
            ))}
          </CFormSelect>
          {data.component === 'CNavTitle' && (
            <CFormInput
              disabled={type === 'delete'}
              name="name"
              type="text"
              className="mt-2"
              floatingLabel="Title Name"
              placeholder="Title Name"
              value={data.name}
              onChange={handleChange}
              feedbackInvalid="Please provide a valid Title Name."
              required
            />
          )}
          {data.component === 'CNavItem' && (
            <>
              <CFormSelect
                className="mt-2"
                disabled={type === 'delete'}
                floatingLabel="Icon"
                name="icon_name"
                value={data.icon_name}
                onChange={handleChange}
              >
                <option value="" hidden disabled>
                  Select an Icon
                </option>
                {iconOptions.map((icon, index) => (
                  <option key={index} value={icon}>
                    {icon}
                  </option>
                ))}
              </CFormSelect>
              <CFormInput
                disabled={type === 'delete'}
                name="title"
                type="text"
                className="mt-2"
                floatingLabel="Title"
                placeholder="Title"
                value={data.title}
                onChange={handleChange}
                feedbackInvalid="Please provide a valid Name."
                required
              />
              <CFormInput
                disabled={type === 'delete'}
                name="name"
                type="text"
                className="mt-2"
                floatingLabel="Name"
                placeholder="Name"
                value={data.name}
                onChange={handleChange}
                feedbackInvalid="Please provide a valid Name."
                required
              />
              <CFormInput
                disabled={type === 'delete'}
                name="to"
                type="text"
                className="mt-2"
                floatingLabel="URL"
                placeholder="URL"
                value={data.to}
                onChange={handleChange}
                feedbackInvalid="Please provide a valid URL."
                required
              />
              <CTableDataCell className="d-flex text-center">
                <p className="mb-0 me-2">Is Navigation:</p>
                <CFormCheck
                  id="flexCheckChecked"
                  checked={data?.is_nav || false}
                  name="is_nav"
                  onChange={(e) =>
                    setData((prevState) => ({
                      ...prevState,
                      is_nav: e.target.checked,
                    }))
                  }
                  disabled={type === 'delete'}
                />
              </CTableDataCell>
              <CTableDataCell className="d-flex text-center">
                <p className="mb-0 me-2">Is Child:</p>
                <CFormCheck
                  id="flexCheckChecked"
                  checked={data.is_child || false}
                  name="is_child"
                  onChange={(e) =>
                    setData((prevState) => ({
                      ...prevState,
                      is_child: e.target.checked,
                    }))
                  }
                  disabled={type === 'delete'}
                />
              </CTableDataCell>
              {data?.is_child && (
                <CFormSelect
                  disabled={type === 'delete'}
                  name="parent"
                  value={data.parent}
                  onChange={handleChange}
                >
                  <option value="" hidden disabled>
                    None
                  </option>
                  {sidebarData.map((element, index) => (
                    <option key={index} value={element.to}>
                      {element.to}
                    </option>
                  ))}
                </CFormSelect>
              )}
            </>
          )}
          {data.component === 'CNavGroup' && (
            <>
              <CFormInput
                disabled={type === 'delete'}
                name="name"
                type="text"
                className="mt-2"
                floatingLabel="Group Name"
                placeholder="Group Name"
                value={data.name}
                onChange={handleChange}
                feedbackInvalid="Please provide a valid Group Name."
                required
              />
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <div className="d-flex gap-3">
            <CustomButton
              type="submit"
              disabled={isLoading}
              actionType={type === 'delete' ? 'delete' : ''}
            >
              {type === 'delete' ? 'Delete' : 'Submit'}
            </CustomButton>
            <CustomButton disabled={isLoading} onClick={handleModalClose} actionType="cancel">
              Cancel
            </CustomButton>
          </div>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

AddActionFunction.propTypes = {
  type: PropTypes.string.isRequired, // 'add' or 'delete'
  defaultData: PropTypes.object,
  handleModalClose: PropTypes.func.isRequired,
}

export default AddActionFunction
