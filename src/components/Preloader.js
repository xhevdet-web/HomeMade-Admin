import React from 'react'

const Preloader = () => {
  const storedTheme = window.localStorage.getItem('sims-template-theme')
  return (
    <div
      className="preloader"
      style={{
        backgroundColor:
          storedTheme === 'dark' || storedTheme === 'auto'
            ? 'rgba(0, 0, 0, 0.7)'
            : 'rgba(230, 230, 230, 0.7)',
      }}
    >
      <div className="preloader-container">
        <span className="animated-preloader"></span>
      </div>
    </div>
  )
}
export default Preloader
