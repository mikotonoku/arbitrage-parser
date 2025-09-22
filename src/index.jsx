import React, { createContext } from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App.jsx';
import Global_Store from './store/store.tsx';
import { exchangeDataStore } from './store/ExchangeDataStore.ts';
const global_store = new Global_Store();

export const context = createContext({
  global_store,
  exchangeDataStore
});

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
    <context.Provider value={{ global_store, exchangeDataStore }}>
      <App/>
    </context.Provider>
);