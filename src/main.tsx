import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';
import './studio.css';
import { initializeAppLifecycle } from './services/appLifecycle';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
initializeAppLifecycle();
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
