import React, { useEffect } from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components'
import { useDispatch } from 'react-redux'
import useAxios from '../utils/useAxios'
import { setSidebarData } from '../redux/actions/sidebarActionTypes'
import { useAuthSelector } from '../redux/selectors/authSelectors'

const DefaultLayout = () => {

  const { axiosRequest } = useAxios()
  const dispatch = useDispatch()
  const { userData } = useAuthSelector()
  // console.log('userData', userData)
  const getNavData = async () => {
    const { data } = await axiosRequest(`/nav/in-role/${userData.role_id}`, 'get',)
    // console.log('sidebar data', data)
    dispatch(setSidebarData(data))
  }

  useEffect(() => {
    if (userData) { 
      getNavData()
    }
  }, [userData])

  return (
    <div>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <div className="body flex-grow-1">
          <AppContent />
        </div>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
