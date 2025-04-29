import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import { store } from './redux/store'
import { HandleModals, ToastContainer } from './_helpers'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <ToastContainer>
      <HandleModals>
        <App />
      </HandleModals>
    </ToastContainer>
  </Provider>,
)
