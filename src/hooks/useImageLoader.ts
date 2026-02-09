import { useState, useEffect } from 'react';

/**
 * Hook to load images from URLs that may have incorrect content-types.
 * Fetches as blob and converts to object URL for display.
 * Supports fallback URLs for sequential loading attempts.
 */
export const useImageLoader = (
  primaryUrl: string | undefined,
  fallbackUrl?: string | undefined
) => {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!primaryUrl) {
      setObjectUrl(null);
      setError(false);
      return;
    }

    let isCancelled = false;
    const controller = new AbortController();

    const tryLoadUrl = async (url: string): Promise<Blob | null> => {
      try {
        const response = await fetch(url, { 
          signal: controller.signal,
          mode: 'cors'
        });
        
        if (!response.ok) {
          return null;
        }

        return await response.blob();
      } catch {
        return null;
      }
    };

    const loadImage = async () => {
      setIsLoading(true);
      setError(false);

      // Try primary URL first
      let blob = await tryLoadUrl(primaryUrl);
      
      // If primary fails and we have a fallback, try that
      if (!blob && fallbackUrl && !isCancelled) {
        blob = await tryLoadUrl(fallbackUrl);
      }

      if (isCancelled) return;

      if (blob) {
        const url = URL.createObjectURL(blob);
        setObjectUrl(url);
        setError(false);
      } else {
        console.warn('Failed to load image from:', primaryUrl, fallbackUrl);
        setError(true);
      }
      
      setIsLoading(false);
    };

    loadImage();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [primaryUrl, fallbackUrl]);

  // Cleanup object URL on unmount or when URL changes
  useEffect(() => {
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
    };
  }, [objectUrl]);

  return { objectUrl, isLoading, error };
};
