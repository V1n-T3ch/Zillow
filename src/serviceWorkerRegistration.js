export function register() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      const swUrl = `${import.meta.env.VITE_PUBLIC_URL}/serviceWorker.js`;
      console.log('Service Worker URL: ', swUrl);
      navigator.serviceWorker
        .register(swUrl)
        .then(registration => {
          console.log('Service Worker registered: ', registration);
        })
        .catch(error => {
          console.error('Error during service worker registration:', error);
        });
    });
  }
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