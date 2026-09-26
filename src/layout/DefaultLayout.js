import React from 'react'
import { AppContent, AppSidebar, AppFooter, AppHeader } from '../components'
import { useRouteSync } from '../hooks/useRouteSync'

const DefaultLayout = () => {
  useRouteSync()

  return (
    <div className="hm-app">
      <a
        className="hm-skip-link"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('main-content')?.focus()
        }}
      >
        Skip to content
      </a>
      <AppSidebar />
      <div className="wrapper d-flex flex-column min-vh-100">
        <AppHeader />
        <main id="main-content" tabIndex={-1} className="body flex-grow-1">
          <AppContent />
        </main>
        <AppFooter />
      </div>
    </div>
  )
}

export default DefaultLayout
