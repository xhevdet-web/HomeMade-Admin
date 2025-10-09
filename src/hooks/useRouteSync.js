import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { setCurrentView } from '../redux/actions/sidebarActionTypes'
import { useSidebarSelector } from '../redux/selectors/sidebarSelector'

export const useRouteSync = () => {
  const location = useLocation()
  const dispatch = useDispatch()
  const { sidebarData } = useSidebarSelector()

  useEffect(() => {
    if (sidebarData && sidebarData.length > 0) {
      // Find the route that matches the current pathname
      const currentRoute = sidebarData.find(route => route.to === location.pathname)
      
      if (currentRoute && currentRoute.id) {
        dispatch(setCurrentView(currentRoute.id))
      }
    }
  }, [location.pathname, sidebarData, dispatch])
}