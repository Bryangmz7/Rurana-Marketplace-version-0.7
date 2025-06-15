
import { useState, useEffect, useRef } from 'react';

interface UseImageOptimizationProps {
  src: string;
  placeholder?: string;
}

export const useImageOptimization = ({ src, placeholder }: UseImageOptimizationProps) => {
  const [imageSrc, setImageSrc] = useState(placeholder || '');
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const img = new Image();
            
            img.onload = () => {
              setImageSrc(src);
              setIsLoading(false);
              setHasError(false);
            };
            
            img.onerror = () => {
              setIsLoading(false);
              setHasError(true);
            };
            
            img.src = src;
            observer.unobserve(entry.target);
          }
        });
      },
      {
        rootMargin: '50px',
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => {
      observer.disconnect();
    };
  }, [src]);

  return {
    imgRef,
    imageSrc,
    isLoading,
    hasError,
  };
};
