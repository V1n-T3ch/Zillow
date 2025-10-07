const CACHE_NAME = 'dwella-v3';
const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json', // Updated filename
  '/favicon.ico',
  '/android-chrome-192x192.png',
  '/android-chrome-512x512.png'
];

// Installation
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened');
        return cache.addAll(urlsToCache);
      })
      .catch(error => {
        console.error('Service worker installation failed:', error);
      })
  );
  // Force activation
  self.skipWaiting();
});

// Cache and return requests with better error handling
self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => {
        if (response) {
          return response; // Cache hit
        }

        // Clone the request
        const fetchRequest = event.request.clone();
        
        return fetch(fetchRequest)
          .then(response => {
            // Check if response is valid
            if(!response || response.status !== 200 || response.type !== 'basic') {
              return response;
            }

            // Clone the response
            const responseToCache = response.clone();
            
            caches.open(CACHE_NAME)
              .then(cache => {
                // Don't cache if method isn't GET
                if(event.request.method === 'GET') {
                  cache.put(event.request, responseToCache);
                }
              })
              .catch(err => console.error('Error caching new resource:', err));

            return response;
          })
          .catch(error => {
            console.error('Fetch failed:', error);
            // Return a fallback response if we have one
            return caches.match('/offline.html');
          });
      })
  );
});

// Activate and clean up old caches
self.addEventListener('activate', event => {
  const cacheWhitelist = [CACHE_NAME];
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if(cacheWhitelist.indexOf(cacheName) === -1) {
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        // Take control of all clients immediately
        return self.clients.claim();
      })
  );
});