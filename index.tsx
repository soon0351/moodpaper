import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// CRITICAL: This file must NOT access localStorage or any browser APIs that might be blocked.
// All initialization logic must happen inside useEffect within App.tsx or other components.

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);