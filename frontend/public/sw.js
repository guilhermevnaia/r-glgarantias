// Service Worker for GL Garantias PWA - Auto-cleanup version
const CACHE_NAME = 'gl-garantias-v1.3.0-cleanup';

// Immediately unregister this service worker and clean up
self.addEventListener('install', (event) => {
  console.log('SW: Auto-cleanup mode - removing all caches and unregistering');
  
  event.waitUntil(
    // Delete all caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          console.log('SW: Deleting cache:', cacheName);
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Skip waiting to activate immediately
      return self.skipWaiting();
    })
  );
});

// Activate and immediately unregister
self.addEventListener('activate', (event) => {
  console.log('SW: Activated - now unregistering self');
  
  event.waitUntil(
    // Clean up all caches again
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Take control of all pages
      return self.clients.claim();
    }).then(() => {
      // Get all clients (open tabs/windows)
      return self.clients.matchAll();
    }).then((clients) => {
      // Send message to all clients to unregister this SW
      clients.forEach((client) => {
        client.postMessage({
          type: 'UNREGISTER_SW',
          message: 'Service Worker cleaning up and unregistering'
        });
      });
      
      // Auto-unregister this service worker
      return self.registration.unregister();
    })
  );
});

// Don't intercept any fetch requests - let them pass through
self.addEventListener('fetch', (event) => {
  // Do nothing - let all requests pass through normally
  console.log('SW: Letting request pass through:', event.request.url);
  return;
});

// Handle messages from main thread
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'FORCE_CLEANUP') {
    console.log('SW: Force cleanup requested');
    
    // Delete all caches
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          return caches.delete(cacheName);
        })
      );
    }).then(() => {
      // Unregister self
      return self.registration.unregister();
    });
  }
});

console.log('SW: Cleanup service worker loaded - will auto-clean and unregister');