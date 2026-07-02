import { useState, useEffect, useRef, useCallback } from 'react';

interface UseInfiniteScrollOptions {
  /** Whether there are more items to load */
  hasNextPage: boolean;
  /** Whether a fetch is in progress */
  isFetchingNextPage: boolean;
  /** Function to fetch the next page */
  fetchNextPage: () => void;
  /** Root margin for intersection observer (px from viewport) */
  rootMargin?: string;
  /** Threshold for intersection observer (0 to 1) */
  threshold?: number;
  /** Whether infinite scroll is enabled */
  enabled?: boolean;
}

export function useInfiniteScroll({
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  rootMargin = '200px',
  threshold = 0.1,
  enabled = true,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const [sentinelRef, setSentinelRef] = useState<HTMLElement | null>(null);

  const sentinelCallback = useCallback(
    (node: HTMLElement | null) => {
      setSentinelRef(node);
    },
    []
  );

  useEffect(() => {
    if (!enabled || !sentinelRef) return;

    // Disconnect previous observer
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin, threshold }
    );

    observerRef.current.observe(sentinelRef);

    return () => {
      observerRef.current?.disconnect();
    };
  }, [sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin, threshold, enabled]);

  return { sentinelRef: sentinelCallback };
}
