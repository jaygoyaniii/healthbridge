import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <App />
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: '#FFFFFF',
            color: '#0C1B33',
            border: '1px solid #E5EAF2',
            boxShadow: '0 8px 24px rgba(26,60,139,0.08)',
            borderRadius: '10px',
            fontFamily: 'Inter, sans-serif',
            fontSize: '14px',
          },
          success: {
            iconTheme: { primary: '#059669', secondary: '#FFFFFF' },
          },
          error: {
            iconTheme: { primary: '#DC2626', secondary: '#FFFFFF' },
          },
        }}
      />
    </BrowserRouter>
  </React.StrictMode>
);
