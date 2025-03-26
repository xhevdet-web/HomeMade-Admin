import { createStore, applyMiddleware, combineReducers } from 'redux';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage';
import autoMergeLevel2 from 'redux-persist/lib/stateReconciler/autoMergeLevel2';
import authReducer from './reducers/authReducer';
import authMiddleware from './middleware/authMiddleware';
import uiReducer from './reducers/uiReducer';
import { composeWithDevTools } from '@redux-devtools/extension';
import sidebarReducer from './reducers/sidebarReducer';
import loadingReducer from './reducers/loadingReducer';

// Combine reducers
const rootReducer = combineReducers({
  ui: uiReducer,
  auth: authReducer,
  sidebar: sidebarReducer,
  loading: loadingReducer
})

const persistConfig = {
  key: '#VORAE-2',
  storage: storage,
  stateReconciler: autoMergeLevel2,
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

// Apply middleware
const middleware = [authMiddleware]

// Create the store with middleware
const store = createStore(persistedReducer, composeWithDevTools(applyMiddleware(...middleware)))

const persistor = persistStore(store)

export { store, persistor }
