import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';

// Global error handler to prevent Chrome extension errors from breaking the app
window.addEventListener('error', (event: ErrorEvent) => {
  if (event.error && event.error.message && 
      (event.error.message.includes('chrome-extension') || 
       event.error.message.includes('Cannot read properties of null'))) {
    event.preventDefault();
    console.log('Ignored Chrome extension error:', event.error);
    return;
  }
});

window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
  if (event.reason && event.reason.message && 
      (event.reason.message.includes('chrome-extension') || 
       event.reason.message.includes('Cannot read properties of null'))) {
    event.preventDefault();
    console.log('Ignored Chrome extension rejection:', event.reason);
    return;
  }
});

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
); 