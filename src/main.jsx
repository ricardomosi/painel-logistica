import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import { LogisticsProvider } from './contexts/LogisticsContext';
import ErrorBoundary from './components/common/ErrorBoundary';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ErrorBoundary>
      <AuthProvider>
        <SoundProvider>
          <LogisticsProvider>
            <App />
          </LogisticsProvider>
        </SoundProvider>
      </AuthProvider>
    </ErrorBoundary>
  </React.StrictMode>
);

// Register service worker for mobile notifications & PWA
if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((err) => {
      console.warn('SW registration failed:', err);
    });
  });
}

