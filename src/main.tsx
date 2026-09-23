import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';
import { initializeDatabaseSeed } from './db/db';
import { authService } from './services/authService';
import { LanguageProvider } from './i18n/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';

// Initialize zero-cloud IndexedDB seed data & master owner credentials
initializeDatabaseSeed()
  .then(() => authService.ensureDefaultOwnerAccount())
  .catch((err) => {
    console.error('Failed to initialize database seed:', err);
  });

// Register Service Worker for offline-first PWA and actionable notifications
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully:', reg.scope);
      })
      .catch((err) => {
        console.warn('Service Worker registration failed:', err);
      });
  });
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <LanguageProvider>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </LanguageProvider>
    </ThemeProvider>
  </StrictMode>
);
