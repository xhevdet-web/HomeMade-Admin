import { useEffect, useMemo, useState } from 'react'
import {
  CAlert,
  CButton,
  CCard,
  CFormInput,
  CSpinner,
  CTable,
  CTableHead,
  CTableBody,
  CTableRow,
  CTableHeaderCell,
  CTableDataCell,
} from '@coreui/react'
import api, { apiErrorMessage } from '../../../_helpers/api'
import EmptyState from '../../../components/EmptyState'

const Users = () => {
  const [users, setUsers] = useState([])
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError(null)
    api
      .get('/users', { signal: controller.signal })
      .then(({ data }) => {
        if (!Array.isArray(data)) throw new Error('Unexpected users response')
        setUsers(data)
      })
      .catch((error) => {
        if (!controller.signal.aborted) setError(apiErrorMessage(error))
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false)
      })
    return () => controller.abort()
  }, [attempt])
  const filtered = useMemo(
    () =>
      users.filter((user) =>
        `${user.firstName} ${user.lastName} ${user.email}`
          .toLowerCase()
          .includes(query.trim().toLowerCase()),
      ),
    [users, query],
  )

  return (
    <>
      <div className="hm-page-heading">
        <div>
          <span className="hm-eyebrow">MANAGEMENT</span>
          <h1>Users</h1>
          <p>The people who make HomeMade a community.</p>
        </div>
        <CButton
          color="primary"
          variant="outline"
          disabled={loading}
          onClick={() => setAttempt((value) => value + 1)}
        >
          Refresh users
        </CButton>
      </div>
      <CCard className="hm-panel">
        <div className="hm-panel-heading">
          <div>
            <h2>User directory</h2>
            <p>
              {loading
                ? 'Loading your community…'
                : error
                  ? 'Directory unavailable'
                  : `${filtered.length} ${filtered.length === 1 ? 'user' : 'users'}`}
            </p>
          </div>
          <CFormInput
            className="hm-search"
            type="search"
            aria-label="Search users"
            placeholder="Search name or email…"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        {loading ? (
          <div className="hm-empty" role="status">
            <CSpinner aria-hidden="true" />
            <p>Loading users…</p>
          </div>
        ) : error ? (
          <CAlert color="danger" className="m-4" role="alert">
            {error}{' '}
            <CButton color="link" onClick={() => setAttempt((value) => value + 1)}>
              Try again
            </CButton>
          </CAlert>
        ) : (
          <CTable responsive className="hm-table mb-0">
            <CTableHead>
              <CTableRow>
                {['Name', 'Email', 'Role', 'Status', 'Joined'].map((label) => (
                  <CTableHeaderCell scope="col" key={label}>
                    {label}
                  </CTableHeaderCell>
                ))}
              </CTableRow>
            </CTableHead>
            <CTableBody>
              {filtered.length ? (
                filtered.map((user) => (
                  <CTableRow key={user.id}>
                    <CTableDataCell>
                      <div className="hm-user-name">
                        <span className="hm-avatar">
                          {user.firstName?.[0]}
                          {user.lastName?.[0]}
                        </span>
                        <strong>
                          {user.firstName} {user.lastName}
                        </strong>
                      </div>
                    </CTableDataCell>
                    <CTableDataCell>{user.email}</CTableDataCell>
                    <CTableDataCell>
                      {user.role === 'ADMIN' ? 'Administrator' : 'Customer'}
                    </CTableDataCell>
                    <CTableDataCell>
                      <span className={`hm-badge ${user.isActive ? 'hm-badge-active' : ''}`}>
                        {user.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </CTableDataCell>
                    <CTableDataCell>
                      {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '—'}
                    </CTableDataCell>
                  </CTableRow>
                ))
              ) : (
                <CTableRow>
                  <CTableDataCell colSpan={5}>
                    <EmptyState
                      title={query ? 'No matching users' : 'No users yet'}
                      description={
                        query
                          ? 'Try a different name or email address.'
                          : 'Registered users will appear here.'
                      }
                    />
                  </CTableDataCell>
                </CTableRow>
              )}
            </CTableBody>
          </CTable>
        )}
      </CCard>
    </>
  )
}
export default Users
