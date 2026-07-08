import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import App from './App';
import './index.css';
import { QueryClientProvider, queryClient } from '@/services';
import { store } from '@/store';
import { reportWebVitals } from '@/utils';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <App />
      </QueryClientProvider>
    </Provider>
  </React.StrictMode>,
);

// Report Core Web Vitals in production
if (import.meta.env.PROD) {
  reportWebVitals((metric) => {
    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        '/api/v1/metrics/web-vitals',
        JSON.stringify({
          name: metric.name,
          value: metric.value,
          rating: metric.rating,
          delta: metric.delta,
          id: metric.id,
          url: window.location.pathname,
        })
      );
    }
  });
}

// Register service worker for PWA support
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => {
        // SW registration failed silently - app still works without it
      });
  });
}
