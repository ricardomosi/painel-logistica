import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { SoundProvider } from './contexts/SoundContext';
import { LogisticsProvider } from './contexts/LogisticsContext';
import './styles/index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <SoundProvider>
        <LogisticsProvider>
          <App />
        </LogisticsProvider>
      </SoundProvider>
    </AuthProvider>
  </React.StrictMode>
);
