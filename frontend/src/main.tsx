import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Service Worker Management - Force cleanup of problematic SW
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    console.log('Cleaning up Service Workers...');
    
    // First, force cleanup by registering cleanup SW
    navigator.serviceWorker.register('/sw.js', {
      scope: '/',
      updateViaCache: 'none'
    })
    .then((registration) => {
      console.log('Cleanup SW registered, forcing update...');
      return registration.update();
    })
    .then(() => {
      // Wait a bit then unregister all
      return new Promise(resolve => setTimeout(resolve, 1000));
    })
    .then(() => {
      return navigator.serviceWorker.getRegistrations();
    })
    .then((registrations) => {
      console.log(`Found ${registrations.length} service workers to clean up`);
      return Promise.all(
        registrations.map((registration) => {
          console.log('Unregistering SW:', registration.scope);
          return registration.unregister();
        })
      );
    })
    .then(() => {
      console.log('All service workers cleaned up successfully');
      // Clear all caches
      return caches.keys();
    })
    .then((cacheNames) => {
      console.log(`Clearing ${cacheNames.length} caches...`);
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    })
    .then(() => {
      console.log('All caches cleared successfully');
    })
    .catch((error) => {
      console.warn('SW cleanup error (non-critical):', error);
    });
    
    // Listen for messages from SW
    navigator.serviceWorker.addEventListener('message', (event) => {
      if (event.data && event.data.type === 'UNREGISTER_SW') {
        console.log('SW cleanup message received:', event.data.message);
      }
    });
  });
}

createRoot(document.getElementById("root")!).render(<App />);
