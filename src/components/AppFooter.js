import { CFooter } from '@coreui/react'
const AppFooter = () => (
  <CFooter className="hm-footer">
    <span>
      HomeMade <span aria-hidden="true">&middot;</span> Made with care.
    </span>
    <span>Admin studio &copy; {new Date().getFullYear()}</span>
  </CFooter>
)
export default AppFooter
