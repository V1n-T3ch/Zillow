export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${window.location.origin}/serviceWorker.js`;
      
      navigator.serviceWorker
        .register(swUrl, { 
          scope: '/',
          updateViaCache: 'none' // Force check for SW updates
        })
        .then(registration => {
          console.log('Service Worker registered with scope:', registration.scope);
          
          // Check for updates every 30 seconds
          setInterval(() => {
            registration.update();
          }, 30000);
          
          // Handle updates
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            console.log('Service Worker update found!');
            
            newWorker.addEventListener('statechange', () => {
              if (newWorker.state === 'installed') {
                if (navigator.serviceWorker.controller) {
                  // New content available - show update prompt
                  showUpdatePrompt(registration);
                } else {
                  console.log('Content is cached for offline use.');
                }
              }
            });
          });
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
        
      // Handle service worker updates
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        console.log('Controller changed - reloading page');
        window.location.reload();
      });
    });
  }
}

// Show update prompt to user
function showUpdatePrompt(registration) {
  // Create a simple update notification
  const updateDiv = document.createElement('div');
  updateDiv.id = 'update-prompt';
  updateDiv.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: #10b981;
    color: white;
    padding: 16px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    z-index: 10000;
    font-family: system-ui, -apple-system, sans-serif;
    max-width: 320px;
  `;
  
  updateDiv.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 8px;">Update Available!</div>
    <div style="font-size: 14px; margin-bottom: 12px;">A new version is ready. Click to update.</div>
    <div style="display: flex; gap: 8px;">
      <button id="update-btn" style="background: white; color: #10b981; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px; font-weight: 600;">
        Update Now
      </button>
      <button id="dismiss-btn" style="background: transparent; color: white; border: 1px solid white; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-size: 12px;">
        Later
      </button>
    </div>
  `;
  
  document.body.appendChild(updateDiv);
  
  // Handle update button click
  document.getElementById('update-btn').addEventListener('click', () => {
    const newWorker = registration.waiting;
    if (newWorker) {
      newWorker.postMessage({ type: 'SKIP_WAITING' });
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'activated') {
          window.location.reload();
        }
      });
    }
    updateDiv.remove();
  });
  
  // Handle dismiss button
  document.getElementById('dismiss-btn').addEventListener('click', () => {
    updateDiv.remove();
  });
  
  // Auto dismiss after 10 seconds
  setTimeout(() => {
    if (document.getElementById('update-prompt')) {
      updateDiv.remove();
    }
  }, 10000);
}

export function unregister() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready
      .then(registration => {
        registration.unregister();
      })
      .catch(error => {
        console.error(error.message);
      });
  }
}