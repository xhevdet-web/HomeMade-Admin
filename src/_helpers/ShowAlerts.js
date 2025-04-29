import { useEffect } from 'react'
import { useAlert } from '../_helpers/HandleAlerts' // Adjust the path as necessary
import { setUnfinishedPayments } from '../redux/actions/unfinshedPaymentsActions'
import { useDispatch } from 'react-redux'

const ShowAlerts = ({ notifications }) => {
  const dispatch = useDispatch()
  const { showAlert } = useAlert()

  useEffect(() => {
    const hasUniqueId = notifications?.some(
      ({ id }) => typeof id === 'string' && id.startsWith('unique_'),
    )
    dispatch(setUnfinishedPayments(!!hasUniqueId))
    notifications?.forEach(({ id, type, title, message }) => {
      showAlert(id, type, title, message)
    })
  }, [notifications, showAlert])
}

export default ShowAlerts
