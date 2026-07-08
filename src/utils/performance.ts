type MetricName = 'CLS' | 'FCP' | 'INP' | 'LCP' | 'TTFB';

interface Metric {
  name: MetricName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta: number;
  id: string;
}

type ReportHandler = (metric: Metric) => void;

/**
 * Reports Core Web Vitals metrics. Call this in main.tsx to track performance.
 * In production, you can send these to your analytics backend.
 */
export async function reportWebVitals(onReport: ReportHandler) {
  if (typeof window === 'undefined') return;

  try {
    const { onCLS, onFCP, onINP, onLCP, onTTFB } = await import('web-vitals');
    onCLS(onReport as any);
    onFCP(onReport as any);
    onINP(onReport as any);
    onLCP(onReport as any);
    onTTFB(onReport as any);
  } catch {
    // web-vitals not installed — silently skip
  }
}

/**
 * Prefetch a route chunk when the user is likely to navigate to it.
 * Call on hover/focus of navigation links for faster transitions.
 */
export function prefetchRoute(routeImport: () => Promise<any>) {
  // Use requestIdleCallback for non-critical prefetch
  const prefetch = () => {
    routeImport().catch(() => {
      // Ignore prefetch errors
    });
  };

  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(prefetch);
  } else {
    setTimeout(prefetch, 100);
  }
}

/**
 * Preloads critical resources using link preload hints.
 */
export function preloadCriticalAssets(urls: string[]) {
  urls.forEach((url) => {
    const existing = document.querySelector(`link[href="${url}"]`);
    if (existing) return;

    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = url;

    if (url.endsWith('.js') || url.endsWith('.mjs')) {
      link.as = 'script';
    } else if (url.endsWith('.css')) {
      link.as = 'style';
    } else if (/\.(woff2?|ttf|otf)$/.test(url)) {
      link.as = 'font';
      link.crossOrigin = 'anonymous';
    } else if (/\.(png|jpg|jpeg|webp|avif|svg)$/.test(url)) {
      link.as = 'image';
    }

    document.head.appendChild(link);
  });
}

/**
 * Measures component render time in development mode.
 * Usage: wrap expensive operations with measureRender('ComponentName', () => { ... })
 */
export function measureRender<T>(label: string, fn: () => T): T {
  if (import.meta.env.DEV) {
    const start = performance.now();
    const result = fn();
    const end = performance.now();
    if (end - start > 16) {
      console.warn(`[Perf] ${label} took ${(end - start).toFixed(2)}ms (> 16ms frame budget)`);
    }
    return result;
  }
  return fn();
}
