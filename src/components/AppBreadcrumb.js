import React from 'react'
import { useLocation } from 'react-router-dom'
import { CBreadcrumb, CBreadcrumbItem } from '@coreui/react'
import { useSidebarSelector } from '../redux/selectors/sidebarSelector'

const AppBreadcrumb = () => {
  const currentLocation = useLocation().pathname

  const { sidebarData } = useSidebarSelector()

  const routes = sidebarData

  // Helper function to compare paths, similar to the 404 component
  const matchRoute = (pathname, routePath) => {
    const pathnameParts = pathname?.split('/')
    const routeParts = routePath?.split('/')

    if (pathnameParts?.length !== routeParts?.length) {
      return false
    }
    return routeParts?.every((part, index) => part.startsWith(':') || part === pathnameParts[index])
  }

  const getRouteName = (pathname, routes) => {
    const currentRoute = routes?.find((route) => matchRoute(pathname, route.to))
    return currentRoute ? currentRoute.title : false
  }

  const findParentRoute = (pathname, routes) => {
    const route = routes?.find((route) => matchRoute(pathname, route.to))
    return route ? route.parent : null
  }

  const getBreadcrumbs = (location) => {
    const breadcrumbs = []
    let pathname = location
    let routeName = getRouteName(pathname, routes)

    while (routeName) {
      breadcrumbs.unshift({
        pathname: pathname,
        title: routeName,
        active: location === pathname,
      })
      pathname = findParentRoute(pathname, routes)
      routeName = getRouteName(pathname, routes)
    }

    return breadcrumbs
  }

  const breadcrumbs = getBreadcrumbs(currentLocation)
  return (
    <CBreadcrumb className="my-0">
      <CBreadcrumbItem href="/">Home</CBreadcrumbItem>
      {breadcrumbs.map((breadcrumb, index) => (
        <CBreadcrumbItem
          {...(breadcrumb.active ? { active: true } : { href: '#' + breadcrumb.pathname })}
          key={index}
        >
          {breadcrumb.title}
        </CBreadcrumbItem>
      ))}
    </CBreadcrumb>
  )
}

export default React.memo(AppBreadcrumb)
