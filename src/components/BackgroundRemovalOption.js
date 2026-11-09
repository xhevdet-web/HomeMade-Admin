import { useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { CFormCheck } from '@coreui/react'
import api from '../_helpers/api'

// Uploads with background removal wait for the server's worker (up to ~2.5 minutes).
export const BACKGROUND_REMOVAL_TIMEOUT = 180000

let cached = null

/**
 * The server's background-removal state: null while unknown, else { enabled, available }.
 * Fetched only while `active`, and cached once known for this page load.
 */
export const useBackgroundRemovalStatus = (active) => {
  const [status, setStatus] = useState(cached)
  useEffect(() => {
    if (!active || cached) return undefined
    const controller = new AbortController()
    api
      .get('/images/background-removal', { signal: controller.signal })
      .then(({ data }) => {
        cached = { enabled: data?.enabled === true, available: data?.available === true }
        setStatus(cached)
      })
      // Unknown status keeps the option usable; the upload itself reports a clear error.
      .catch(() => {})
    return () => controller.abort()
  }, [active])
  return status
}

/** Whether a checked option actually applies (false when the server has the feature off). */
export const removesBackground = (checked, status) => checked && status?.enabled !== false

/** Opt-in "Remove background" checkbox for a newly selected image. Off by default. */
const BackgroundRemovalOption = ({ id, checked, onChange, status, hint }) => {
  const disabled = status?.enabled === false
  return (
    <div className="mt-2">
      <CFormCheck
        id={id}
        label="Remove background"
        checked={checked && !disabled}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <small className="text-body-secondary d-block">
        {disabled
          ? 'Background removal is turned off on the server; the image is uploaded unchanged.'
          : status && !status.available
            ? 'The background-removal service is offline right now; uploads with this option will fail.'
            : hint ||
              'Optional and slower (can take a few minutes). Leave off for logos, lettering and images that are already transparent.'}
      </small>
    </div>
  )
}

BackgroundRemovalOption.propTypes = {
  id: PropTypes.string.isRequired,
  checked: PropTypes.bool.isRequired,
  onChange: PropTypes.func.isRequired,
  status: PropTypes.shape({ enabled: PropTypes.bool, available: PropTypes.bool }),
  hint: PropTypes.string,
}

export default BackgroundRemovalOption
