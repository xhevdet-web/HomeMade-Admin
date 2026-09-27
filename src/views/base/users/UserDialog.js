import { useEffect, useRef, useState } from 'react'
import PropTypes from 'prop-types'
import { useDispatch } from 'react-redux'
import {
  CAlert,
  CButton,
  CCol,
  CForm,
  CFormCheck,
  CFormInput,
  CFormLabel,
  CModal,
  CModalHeader,
  CModalTitle,
  CModalBody,
  CModalFooter,
  CRow,
  CSpinner,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../../_helpers/api'
import { useAuthSelector } from '../../../redux/selectors/authSelectors'
import { clearUserPermissions, setUserData } from '../../../redux/actions/authActionTypes'

const fields = [
  ['firstName', 'First name', 100],
  ['lastName', 'Last name', 100],
  ['email', 'Email', 254],
  ['userName', 'Username', 30],
  ['phone', 'Phone', 32],
  ['country', 'Country', 100],
  ['address', 'Address', 300],
  ['postalCode', 'Postal code', 20],
]
const empty = {
  ...Object.fromEntries(fields.map(([key]) => [key, ''])),
  password: '',
  isActive: true,
}
const UserDialog = ({ action, onClose, onSaved }) => {
  const { userData } = useAuthSelector()
  const dispatch = useDispatch()
  const isAdmin = userData?.role === 'ADMIN'
  const creating = action.mode === 'create'
  const deleting = action.mode === 'delete'
  const [form, setForm] = useState(empty)
  const [record, setRecord] = useState(null)
  const [loading, setLoading] = useState(!creating)
  const [loadError, setLoadError] = useState(null)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  const [saving, setSaving] = useState(false)
  const pending = useRef(false)
  useEffect(() => {
    if (creating) return
    const controller = new AbortController()
    setLoading(true)
    setLoadError(null)
    api
      .get(`/users/${encodeURIComponent(action.id)}`, { signal: controller.signal })
      .then(({ data }) => {
        if (!data?.id) throw new Error('Invalid user response')
        if (controller.signal.aborted) return
        setRecord(data)
        setForm({
          ...empty,
          ...Object.fromEntries(fields.map(([key]) => [key, data[key] ?? ''])),
          isActive: data.isActive,
        })
      })
      .catch((error) => {
        if (!controller.signal.aborted) setLoadError(apiErrorMessage(error, 'Unable to load user.'))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [creating, action.id, attempt])
  const change = ({ target }) =>
    setForm((previous) => ({
      ...previous,
      [target.name]: target.type === 'checkbox' ? target.checked : target.value,
    }))
  const submit = async (event) => {
    event.preventDefault()
    if (pending.current || !isAdmin || loading || loadError) return
    setError(null)
    if (!deleting && (!form.firstName.trim() || !form.lastName.trim())) {
      setError('First and last name are required.')
      return
    }
    const payload = Object.fromEntries(
      fields.flatMap(([key]) => {
        const value = form[key].trim()
        return value ? [[key, value]] : creating ? [] : [[key, null]]
      }),
    )
    if (creating) payload.password = form.password
    else payload.isActive = form.isActive
    pending.current = true
    setSaving(true)
    try {
      let data
      if (deleting) await api.delete(`/users/${encodeURIComponent(action.id)}`)
      else
        ({ data } = creating
          ? await api.post('/users', payload)
          : await api.patch(`/users/${encodeURIComponent(action.id)}`, payload))
      if (action.id === userData.id) {
        if (deleting || !data.isActive)
          dispatch(clearUserPermissions('Your account was deleted or deactivated.'))
        else dispatch(setUserData(data))
      }
      onSaved(`User ${deleting ? 'deleted' : creating ? 'created' : 'updated'} successfully.`)
    } catch (error) {
      setError(apiErrorMessage(error))
    } finally {
      pending.current = false
      setSaving(false)
    }
  }
  return (
    <CModal
      visible
      size="lg"
      alignment="center"
      backdrop="static"
      keyboard={!saving}
      onClose={() => {
        if (!saving) onClose()
      }}
      className="hm-catalog-modal"
      aria-labelledby="user-dialog-title"
    >
      <CModalHeader closeButton={!saving}>
        <CModalTitle id="user-dialog-title">
          {deleting ? 'Delete User' : creating ? 'Add User' : 'Edit User'}
        </CModalTitle>
      </CModalHeader>
      <CForm onSubmit={submit}>
        <CModalBody>
          {loading ? (
            <div className="hm-empty" role="status">
              <CSpinner />
              <p>Loading user...</p>
            </div>
          ) : loadError ? (
            <CAlert color="danger" role="alert">
              {loadError}{' '}
              <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
                Try again
              </CButton>
            </CAlert>
          ) : (
            <>
              {error && (
                <CAlert color="danger" role="alert">
                  {error}
                </CAlert>
              )}
              {deleting ? (
                <>
                  <p>
                    Delete{' '}
                    <strong>
                      {record?.firstName} {record?.lastName}
                    </strong>{' '}
                    ({record?.email})?
                  </p>
                  <p>
                    This action cannot be undone. Users with linked records may need to be
                    deactivated instead.
                  </p>
                </>
              ) : (
                <fieldset disabled={saving || !isAdmin}>
                  <p>
                    {creating
                      ? 'New users are created as active Customers.'
                      : `Role: ${record?.role === 'ADMIN' ? 'Administrator' : 'Customer'}.`}
                  </p>
                  <CRow className="g-3">
                    {fields.map(([key, label, max]) => (
                      <CCol md={6} key={key}>
                        <CFormLabel htmlFor={`user-${key}`}>{label}</CFormLabel>
                        <CFormInput
                          id={`user-${key}`}
                          name={key}
                          value={form[key]}
                          onChange={change}
                          maxLength={max}
                          type={key === 'email' ? 'email' : key === 'phone' ? 'tel' : 'text'}
                          required={['firstName', 'lastName', 'email'].includes(key)}
                          minLength={key === 'userName' ? 3 : undefined}
                          pattern={key === 'userName' ? '[a-zA-Z0-9_.-]+' : undefined}
                        />
                      </CCol>
                    ))}
                    {creating && (
                      <CCol xs={12}>
                        <CFormLabel htmlFor="user-password">Password</CFormLabel>
                        <CFormInput
                          id="user-password"
                          name="password"
                          type="password"
                          autoComplete="new-password"
                          required
                          minLength={12}
                          maxLength={128}
                          value={form.password}
                          onChange={change}
                        />
                        <small>12 to 128 characters.</small>
                      </CCol>
                    )}
                    {!creating && (
                      <CCol xs={12}>
                        <CFormCheck
                          id="user-active"
                          name="isActive"
                          label="Active"
                          checked={form.isActive}
                          onChange={change}
                        />
                      </CCol>
                    )}
                  </CRow>
                </fieldset>
              )}
              {action.id === userData?.id && (deleting || !form.isActive) && (
                <CAlert color="warning" className="mt-3">
                  This is your account. Continuing will sign you out.
                </CAlert>
              )}
            </>
          )}
        </CModalBody>
        <CModalFooter>
          <CButton
            type="button"
            color="secondary"
            variant="outline"
            disabled={saving}
            onClick={onClose}
          >
            Cancel
          </CButton>
          <CButton
            type="submit"
            color={deleting ? 'danger' : 'primary'}
            disabled={saving || loading || !!loadError || !isAdmin}
          >
            {saving ? 'Saving...' : deleting ? 'Delete User' : 'Save User'}
          </CButton>
        </CModalFooter>
      </CForm>
    </CModal>
  )
}
UserDialog.propTypes = {
  action: PropTypes.shape({
    mode: PropTypes.oneOf(['create', 'edit', 'delete']).isRequired,
    id: PropTypes.string,
  }).isRequired,
  onClose: PropTypes.func.isRequired,
  onSaved: PropTypes.func.isRequired,
}
export default UserDialog
