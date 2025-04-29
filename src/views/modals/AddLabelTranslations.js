import React, { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import {
  CForm,
  CFormInput,
  CModal,
  CModalBody,
  CModalFooter,
  CModalHeader,
  CModalTitle,
} from '@coreui/react'
import useAxios from '../../utils/useAxios'
import { CustomButton } from '../../components'

const AddLabelTranslations = ({ defaultData, type, handleModalClose, callback }) => {
  const [keyValue, setKeyValue] = useState('')
  const [values, setValues] = useState(defaultData?.allValues || [])

  const { axiosRequest, isLoading } = useAxios()

  useEffect(() => {
    if (defaultData) {
      if (type === 'put' || type === 'delete') {
        // Edit mode
        setKeyValue(defaultData.labelTranslationData?.keyname || '')
        setValues(defaultData.labelTranslationData?.allValues || [])
      } else {
        // Add mode
        if (defaultData.allLanguages) {
          const initialValues = defaultData.allLanguages.map((language) => ({
            value: '',
            lang_id: language.id,
            code: language.code,
            id: null,
          }))
          setValues(initialValues)
        }
      }
    }
  }, [defaultData, type])

  const handleInputChange = (e, language = null) => {
    if (language) {
      setValues((prevValues) => {
        const langIndex = prevValues.findIndex((item) => item.lang_id === language.id)
        const newValue = {
          value: e.target.value,
          lang_id: language.id,
          code: language.code,
          id: prevValues[langIndex]?.id || null,
        }
        if (langIndex !== -1) {
          return prevValues.map((item, index) => (index === langIndex ? newValue : item))
        } else {
          return [...prevValues, newValue]
        }
      })
    } else {
      setKeyValue(e.target.value)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const dataToSend = {
      key_name: keyValue,
      translation_values: values,
    }

    let url = ''
    let method = ''

    if (type === 'put') {
      url = `label-translations`
      method = 'put'
    } else if (type === 'post') {
      url = 'label-translations'
      method = 'post'
    } else if (type === 'delete') {
      url = `label-translations/${defaultData?.labelTranslationData?.keyname}`
      method = 'delete'
    }

    try {
      await axiosRequest(url, method, dataToSend, handleModalClose)
      callback()
      const successMessage =
        type === 'put' ? 'Ruaj ndryshimet!' : 'Të dhënat janë ruajtur me sukses!'
      console.log(successMessage)
    } catch (err) {
      console.error(err)
    }
  }

  // const actionType = type === 'put' ? 'edit' : type === 'delete' ? 'delete' : ''

  return (
    <CModal
      backdrop={true}
      visible
      alignment="center"
      onClose={handleModalClose}
      aria-labelledby="StaticBackdropExampleLabel"
    >
      <CModalHeader>
        <CModalTitle id="StaticBackdropExampleLabel">Shto një gjuhë!</CModalTitle>
      </CModalHeader>
      <CForm onSubmit={handleSubmit}>
        <CModalBody>
          <label className="fw-bold">Key name</label>
          <CFormInput
            type="text"
            onChange={handleInputChange}
            name="key_name"
            id="key_name"
            floatingLabel="Key Name"
            placeholder="Key Name"
            value={keyValue}
            className="mb-2"
            required
            disabled={type === 'put' || type === 'delete'}
          />
          {defaultData.allLanguages?.map((language) => (
            <div key={language.id}>
              <label
                className="fw-bold"
                htmlFor={`value-${language.code}`}
              >{`Value (${language.code})`}</label>
              <CFormInput
                type="text"
                id={`value-${language.code}`}
                onChange={(e) => handleInputChange(e, language)}
                className="mb-2"
                disabled={type === 'delete'}
                defaultValue={
                  type === 'put' || type === 'delete'
                    ? values.find((v) => v.lang_id === language.id)?.value || ''
                    : ''
                }
              />
            </div>
          ))}
        </CModalBody>
        <CModalFooter>
          <CustomButton
            type="submit"
            disabled={isLoading}
            actionType={type === 'put' ? 'edit' : type === 'delete' ? 'delete' : 'save'}
          >
            {type === 'put' ? 'Ruaj ndryshimet' : type === 'delete' ? 'Fshij' : 'Shto'}
          </CustomButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}

AddLabelTranslations.propTypes = {
  message: PropTypes.string,
  defaultData: PropTypes.object,
  handleModalClose: PropTypes.func.isRequired,
  type: PropTypes.string.isRequired,
  callback: PropTypes.func,
}

export default AddLabelTranslations
