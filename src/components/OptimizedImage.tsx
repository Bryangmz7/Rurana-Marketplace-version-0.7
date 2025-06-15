
import React from 'react';
import { useImageOptimization } from '@/hooks/useImageOptimization';
import { cn } from '@/lib/utils';
import { ImageIcon } from 'lucide-react';

interface OptimizedImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  src: string;
  alt: string;
  placeholder?: string;
  fallback?: React.ReactNode;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  placeholder = '/placeholder.svg',
  fallback,
  className,
  ...props
}) => {
  const { imgRef, imageSrc, isLoading, hasError } = useImageOptimization({
    src,
    placeholder,
  });

  if (hasError && fallback) {
    return <>{fallback}</>;
  }

  if (hasError) {
    return (
      <div
        className={cn(
          "flex items-center justify-center bg-gray-100 text-gray-400",
          className
        )}
      >
        <ImageIcon className="h-8 w-8" />
      </div>
    );
  }

  return (
    <img
      ref={imgRef}
      src={imageSrc}
      alt={alt}
      className={cn(
        "transition-opacity duration-300",
        isLoading && "opacity-50",
        className
      )}
      {...props}
    />
  );
};
