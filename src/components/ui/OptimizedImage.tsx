import { useState, useRef, useEffect, memo, ImgHTMLAttributes } from 'react';
import { cn } from '@/utils';

export interface OptimizedImageProps extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'onLoad' | 'onError'> {
  src: string;
  alt: string;
  fallback?: string;
  blurPlaceholder?: string;
  aspectRatio?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none';
  lazy?: boolean;
}

export const OptimizedImage = memo(function OptimizedImage({
  src,
  alt,
  fallback,
  blurPlaceholder,
  aspectRatio,
  objectFit = 'cover',
  lazy = true,
  className,
  ...props
}: OptimizedImageProps) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  const [inView, setInView] = useState(!lazy);
  const imgRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!lazy || !imgRef.current) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(imgRef.current);
    return () => observer.disconnect();
  }, [lazy]);

  const handleLoad = () => setLoaded(true);
  const handleError = () => {
    setError(true);
    setLoaded(true);
  };

  const objectFitClass = {
    cover: 'object-cover',
    contain: 'object-contain',
    fill: 'object-fill',
    none: 'object-none',
  };

  return (
    <div
      ref={imgRef}
      className={cn(
        'relative overflow-hidden bg-secondary-100 dark:bg-secondary-800',
        className
      )}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {blurPlaceholder && !loaded && (
        <img
          src={blurPlaceholder}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover blur-lg scale-110"
        />
      )}

      {/* Skeleton placeholder */}
      {!loaded && !blurPlaceholder && (
        <div className="absolute inset-0 animate-pulse bg-secondary-200 dark:bg-secondary-700" />
      )}

      {/* Actual image */}
      {inView && (
        <img
          src={error && fallback ? fallback : src}
          alt={alt}
          loading={lazy ? 'lazy' : 'eager'}
          decoding="async"
          onLoad={handleLoad}
          onError={handleError}
          className={cn(
            'w-full h-full transition-opacity duration-300',
            objectFitClass[objectFit],
            loaded ? 'opacity-100' : 'opacity-0'
          )}
          {...props}
        />
      )}
    </div>
  );
});
