import React from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CCol,
  CContainer,
  CRow,
} from '@coreui/react'
import { useLocation } from 'react-router-dom'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'

const Page500 = () => {
  const ProjectEnv = import.meta.env.VITE_ENV
  const location = useLocation()

  const transformPathname = (pathname) => {
    const pathWithoutSlash = pathname.replace(/^\//, '')
    return pathWithoutSlash.charAt(0).toUpperCase() + pathWithoutSlash.slice(1)
  }
  const { sidebarData } = useSidebarSelector()

  const { name } = sidebarData.find((route) => route.to === location.pathname)
  
  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={6}>
            <span className="clearfix">
              <h1 className="float-start display-3 me-4">500</h1>
              <h4 className="pt-3">Houston, we have a problem!</h4>
              <p className="text-body-secondary float-start">
                The page you are looking for is temporarily unavailable.
              </p>
            </span>
            {ProjectEnv === 'development' && (
              <CAccordion activeItemKey={2}>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>I am a Developer!</CAccordionHeader>
                  <CAccordionBody>
                    <strong>If you are seeing this page</strong>, and you need something else to
                    render in stead of <code>404</code> than you need to go to{' '}
                    <code>src/components/AppContent.js</code>
                    &nbsp;make the needed imports of your <code>component</code> in the array of{' '}
                    <br /> <br />
                    <code>
                      componentMap =<br />
                      &#160;&#160;&#160;&#160;&#160;[{transformPathname(name)}: React.lazy(() =&gt;
                      import(`../views/base/.../{name}`))]
                    </code>
                    <br /> <br /> needs to be here, and you should be all set to go on with your
                    work!
                  </CAccordionBody>
                </CAccordionItem>
              </CAccordion>
            )}
          </CCol>
        </CRow>
      </CContainer>
    </div>
  )
}

export default Page500
