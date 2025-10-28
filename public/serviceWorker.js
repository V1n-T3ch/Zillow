const CACHE_NAME = 'dwella-v1.0.1'; // Update this version when you deploy
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Install event - cache resources
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('Opened cache');
        return cache.addAll(urlsToCache.map(url => new Request(url, { credentials: 'same-origin' })));
      })
      .catch((error) => {
        console.error('Failed to cache resources:', error);
      })
      .then(() => {
        // Force the waiting service worker to become the active service worker
        self.skipWaiting();
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== CACHE_NAME) {
            console.log('Deleting old cache:', cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      // Take control of all clients immediately
      self.clients.claim();
    })
  );
});

// Fetch event - improved error handling
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension and other non-http(s) requests
  if (!url.protocol.startsWith('http')) {
    return;
  }

  // Handle external resources (images, APIs, etc.) with network-first strategy
  if (url.hostname !== location.hostname) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Only cache successful responses from external sources
          if (response.ok && response.status === 200) {
            const responseClone = response.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(request, responseClone);
            });
          }
          return response;
        })
        .catch(() => {
          // Try to get from cache if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a simple error response instead of undefined
            return new Response('Network error', {
              status: 408,
              statusText: 'Network error'
            });
          });
        })
    );
    return;
  }

  // Handle API calls with network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          // Don't cache failed API responses
          if (!response.ok) {
            return response;
          }
          
          // Cache successful API responses with short TTL
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(request, responseClone);
          });
          
          return response;
        })
        .catch(() => {
          // Fallback to cache if network fails
          return caches.match(request).then(cachedResponse => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // Return a proper error response
            return new Response(JSON.stringify({ error: 'Network unavailable' }), {
              status: 503,
              statusText: 'Service Unavailable',
              headers: { 'Content-Type': 'application/json' }
            });
          });
        })
    );
    return;
  }

  // Handle static assets with cache-first strategy
  event.respondWith(
    caches.match(request)
      .then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }

        // If not in cache, fetch from network
        return fetch(request)
          .then((fetchResponse) => {
            // Don't cache non-successful responses
            if (!fetchResponse.ok) {
              return fetchResponse;
            }

            // Clone the response before caching
            const responseToCache = fetchResponse.clone();

            caches.open(CACHE_NAME)
              .then((cache) => {
                cache.put(request, responseToCache);
              })
              .catch((error) => {
                console.warn('Failed to cache response:', error);
              });

            return fetchResponse;
          })
          .catch((error) => {
            console.warn('Fetch failed:', error);
            // Return a proper error response instead of undefined
            return new Response('Resource not available', {
              status: 404,
              statusText: 'Not Found'
            });
          });
      })
      .catch((error) => {
        console.warn('Cache match failed:', error);
        // Return a proper error response
        return new Response('Cache error', {
          status: 500,
          statusText: 'Internal Server Error'
        });
      })
  );
});

// Handle skip waiting message
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Handle errors
self.addEventListener('error', (event) => {
  console.error('Service Worker error:', event.error);
});

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker unhandled rejection:', event.reason);
  event.preventDefault();
});