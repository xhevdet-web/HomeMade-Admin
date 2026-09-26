import React from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import 'core-js'

import App from './App'
import { PersistGate } from 'redux-persist/integration/react'
import { store, persistor } from './redux/store'
import { HandleModals, ToastContainer } from './_helpers'

createRoot(document.getElementById('root')).render(
  <Provider store={store}>
    <PersistGate
      loading={
        <div className="hm-session" role="status">
          Opening HomeMade…
        </div>
      }
      persistor={persistor}
    >
      <ToastContainer>
        <HandleModals>
          <App />
        </HandleModals>
      </ToastContainer>
    </PersistGate>
  </Provider>,
)
