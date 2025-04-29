import React from 'react'
import {
  CAccordion,
  CAccordionBody,
  CAccordionHeader,
  CAccordionItem,
  CCol,
  CContainer,
  CLink,
  CRow,
} from '@coreui/react'
import { Link, useLocation } from 'react-router-dom'
import { useSidebarSelector } from '../../../redux/selectors/sidebarSelector'

const Page404 = () => {
  const ProjectEnv = import.meta.env.VITE_ENV
  const location = useLocation()

  const transformPathname = (pathname) => {
    const pathWithoutSlash = pathname?.replace(/^\//, '')
    return pathWithoutSlash?.charAt(0)?.toUpperCase() + pathWithoutSlash?.slice(1)
  }

  const { sidebarData } = useSidebarSelector()

  // Helper function to compare paths
  const matchRoute = (pathname, routePath) => {
    const pathnameParts = pathname.split('/');
    const routeParts = routePath.split('/');

    if (pathnameParts.length !== routeParts.length) {
      return false; // If they don't have the same number of parts, they don't match
    }

    return routeParts.every((part, index) => {
      // Ignore dynamic parts (parameters)
      return part.startsWith(':') || part === pathnameParts[index];
    });
  };

  // Find the matching route
  const { name } = sidebarData?.find((route) => matchRoute(location.pathname, route.to)) || ""

  return (
    <div className="bg-body-tertiary min-vh-100 d-flex flex-row align-items-center">
      <CContainer>
        <CRow className="justify-content-center">
          <CCol md={7}>
            <div className="clearfix">
              <h1 className="float-start display-3 me-4">404</h1>
              <h4 className="pt-3">Oops! You&apos;re lost.</h4>
              <>
                <p className="text-body-secondary float-start">
                  The page you are looking for was not found.
                </p>
                <p className="text-body-secondary float-start">
                  &nbsp;Go back to&nbsp;
                  <CLink as={Link} to={'/'}>
                    Homepage
                  </CLink>
                </p>
              </>
            </div>
            {ProjectEnv === 'development' && (
              <CAccordion activeItemKey={2}>
                <CAccordionItem itemKey={1}>
                  <CAccordionHeader>I am a Developer!</CAccordionHeader>
                  <CAccordionBody>
                    <strong>If you are seeing this page</strong>, and you need something else to
                    render instead of <code>404</code>, then you need to go to{' '}
                    <code>src/components/AppContent.js</code> and make the needed imports of your{' '}
                    <code>component</code> in the array of:
                    <br />
                    <br />
                    <code>
                      componentMap = [<br />
                        &nbsp;&nbsp;{transformPathname(name)}: React.lazy(() =&gt; import(`../views/base/.../{name}`))<br />
                      ]
                    </code>
                    <br />
                    <br />
                    This should allow you to continue with your work smoothly!
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

export default Page404
