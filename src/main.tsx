import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import ErrorBoundary from './components/ErrorBoundry.tsx';

window.addEventListener('error', (event) => {
  console.error('Global error:', {
    message: event.message,
    source: event.filename,
    line: event.lineno,
    column: event.colno,
    error: event.error
  });
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>
);
