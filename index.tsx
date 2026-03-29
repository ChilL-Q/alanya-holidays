import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './index.css';

const rootElement = document.getElementById('root');
if (!rootElement) {
  console.error('[index.tsx] FATAL: Could not find root element to mount to');
  throw new Error("Could not find root element to mount to");
}
const root = ReactDOM.createRoot(rootElement);

// Global fix to prevent mouse wheel from changing numerical input values
document.addEventListener('wheel', (_e) => {
  if (document.activeElement?.tagName === 'INPUT' && (document.activeElement as HTMLInputElement).type === 'number') {
    (document.activeElement as HTMLElement).blur();
  }
}, { passive: false });

root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);