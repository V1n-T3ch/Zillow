export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/serviceWorker.js')
        .then((registration) => {
          console.log('SW registered: ', registration);
          
          // Check for updates every 60 seconds
          setInterval(() => {
            registration.update();
          }, 60000);
          
          // Listen for new service worker
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // New version available
                  showUpdatePrompt(registration);
                }
              });
            }
          });
          
          // Listen for messages from service worker
          navigator.serviceWorker.addEventListener('message', (event) => {
            if (event.data && event.data.type === 'SW_UPDATED') {
              console.log('Service Worker updated to version:', event.data.version);
              showUpdateNotification(event.data.version);
            }
          });
          
        })
        .catch((error) => {
          console.log('SW registration failed: ', error);
        });
    });
  }
}

// Show update prompt to user
function showUpdatePrompt(registration) {
  // Create a more sophisticated update notification
  const updateAvailable = document.createElement('div');
  updateAvailable.innerHTML = `
    <div style="position: fixed; top: 20px; right: 20px; background: #047857; color: white; padding: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; max-width: 300px;">
      <div style="font-weight: bold; margin-bottom: 8px;">🚀 New Version Available!</div>
      <div style="margin-bottom: 12px; font-size: 14px;">A new version of Dwella is ready. Refresh to get the latest features.</div>
      <div style="display: flex; gap: 8px;">
        <button id="update-btn" style="background: white; color: #047857; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-weight: bold;">Update Now</button>
        <button id="dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 8px 16px; border-radius: 4px; cursor: pointer;">Later</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(updateAvailable);
  
  // Handle update button click
  document.getElementById('update-btn').addEventListener('click', () => {
    if (registration.waiting) {
      registration.waiting.postMessage({ type: 'SKIP_WAITING' });
      window.location.reload();
    }
  });
  
  // Handle dismiss button click
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    updateAvailable.remove();
  });
  
  // Auto-dismiss after 30 seconds
  setTimeout(() => {
    if (updateAvailable.parentNode) {
      updateAvailable.remove();
    }
  }, 30000);
}

function showUpdateNotification(version) {
  // Show a subtle notification that the app has been updated
  const notification = document.createElement('div');
  notification.innerHTML = `
    <div style="position: fixed; bottom: 20px; left: 20px; background: #10b981; color: white; padding: 12px 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); z-index: 10000; font-size: 14px;">
      ✅ App updated to ${version}
    </div>
  `;
  
  document.body.appendChild(notification);
  
  // Auto-remove after 3 seconds
  setTimeout(() => {
    if (notification.parentNode) {
      notification.remove();
    }
  }, 3000);
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then((registration) => {
        registration.unregister();
      })
      .catch((error) => {
        console.error(error.message);
      });
  }
}