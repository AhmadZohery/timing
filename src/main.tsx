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

// Register Service Worker for offline-first PWA (production only)
if ('serviceWorker' in navigator) {
  if (import.meta.env.DEV) {
    // In local development, unregister any stale service workers to ensure instant Vite HMR
    navigator.serviceWorker.getRegistrations().then((registrations) => {
      for (const registration of registrations) {
        registration.unregister();
      }
    }).catch(() => {});
  } else {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((reg) => {
          console.log('Service Worker registered successfully:', reg.scope);
          // Check for newer version on load
          reg.update().catch(() => {});
          // Re-check for updates whenever user returns to the tab or app
          window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible') {
              reg.update().catch(() => {});
            }
          });
        })
        .catch((err) => {
          console.warn('Service Worker registration failed:', err);
        });
    });
  }
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
