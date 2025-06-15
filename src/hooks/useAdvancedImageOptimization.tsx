
import { useState, useEffect, useRef, useCallback } from 'react';

interface ImageOptimizationOptions {
  quality?: number;
  format?: 'webp' | 'jpeg' | 'png' | 'auto';
  sizes?: string;
  lazy?: boolean;
  placeholder?: 'blur' | 'empty';
}

interface OptimizedImageState {
  src: string;
  srcSet?: string;
  isLoading: boolean;
  hasError: boolean;
  isInView: boolean;
  format: string;
}

export const useAdvancedImageOptimization = (
  originalSrc: string,
  options: ImageOptimizationOptions = {}
) => {
  const {
    quality = 85,
    format = 'auto',
    sizes = '100vw',
    lazy = true,
    placeholder = 'empty'
  } = options;

  const [state, setState] = useState<OptimizedImageState>({
    src: placeholder === 'blur' ? 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjBmMGYwIi8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPkNhcmdhbmRvLi4uPC90ZXh0Pjwvc3ZnPg==' : '',
    isLoading: true,
    hasError: false,
    isInView: false,
    format: 'original'
  });

  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const detectWebPSupport = useCallback((): Promise<boolean> => {
    return new Promise((resolve) => {
      const webP = new Image();
      webP.onload = webP.onerror = () => {
        resolve(webP.height === 2);
      };
      webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
    });
  }, []);

  const optimizeImageSrc = useCallback(async (src: string): Promise<string> => {
    if (format === 'auto') {
      const supportsWebP = await detectWebPSupport();
      if (supportsWebP && !src.includes('.gif')) {
        // En un entorno real, aquí convertirías la imagen a WebP
        // Por ahora, retornamos la imagen original
        setState(prev => ({ ...prev, format: 'webp-supported' }));
        return src;
      }
    }
    
    setState(prev => ({ ...prev, format: format === 'auto' ? 'fallback' : format }));
    return src;
  }, [format]);

  const generateSrcSet = useCallback((src: string): string => {
    // En un entorno real, generarías diferentes tamaños de imagen
    const breakpoints = [640, 768, 1024, 1280, 1536];
    return breakpoints
      .map(width => `${src}?w=${width} ${width}w`)
      .join(', ');
  }, []);

  const loadImage = useCallback(async () => {
    if (!originalSrc || state.hasError) return;

    setState(prev => ({ ...prev, isLoading: true, hasError: false }));

    try {
      const optimizedSrc = await optimizeImageSrc(originalSrc);
      const srcSet = generateSrcSet(optimizedSrc);

      const img = new Image();
      
      img.onload = () => {
        setState(prev => ({
          ...prev,
          src: optimizedSrc,
          srcSet,
          isLoading: false,
          hasError: false
        }));
      };

      img.onerror = () => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          hasError: true
        }));
      };

      img.src = optimizedSrc;
    } catch (error) {
      console.error('Error optimizing image:', error);
      setState(prev => ({
        ...prev,
        isLoading: false,
        hasError: true
      }));
    }
  }, [originalSrc, optimizeImageSrc, generateSrcSet, state.hasError]);

  useEffect(() => {
    if (!lazy) {
      loadImage();
      return;
    }

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setState(prev => ({ ...prev, isInView: true }));
            loadImage();
            observerRef.current?.disconnect();
          }
        });
      },
      { rootMargin: '50px' }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      observerRef.current?.disconnect();
    };
  }, [lazy, loadImage]);

  return {
    imgRef,
    ...state,
    reload: loadImage,
    sizes
  };
};
