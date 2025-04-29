import { useState } from 'react'

const useValidation = () => {
  const [validated, setValidated] = useState(false)

  const validateForm = async (event) => {
    const form = event.currentTarget
    if (form.checkValidity() === false) {
      event.preventDefault()
      event.stopPropagation()
    }
    setValidated(true)
    return form
  }

  return { validateForm, validated }
}

export default useValidation
