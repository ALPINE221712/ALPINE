import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { InventoryProvider } from './store/inventoryStore';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <BrowserRouter>
      <InventoryProvider>
        <App />
      </InventoryProvider>
    </BrowserRouter>
  </React.StrictMode>
);
