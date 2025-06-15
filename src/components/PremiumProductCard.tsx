
import React, { memo, useState, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAdvancedImageOptimization } from '@/hooks/useAdvancedImageOptimization';
import { useIntelligentCache } from '@/hooks/useIntelligentCache';
import { 
  Heart, 
  Share2, 
  Star, 
  ShoppingCart, 
  Eye, 
  Bookmark,
  Zap,
  Award,
  TrendingUp
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  rating?: number;
  reviews_count?: number;
  is_premium?: boolean;
  is_trending?: boolean;
  discount_percentage?: number;
  store: {
    id: string;
    name: string;
    verified?: boolean;
    rating?: number;
  };
}

interface PremiumProductCardProps {
  product: Product;
  onAddToCart?: (productId: string) => void;
  onToggleFavorite?: (productId: string) => void;
  onShare?: (productId: string) => void;
  onView?: (productId: string) => void;
  className?: string;
  priority?: boolean;
}

export const PremiumProductCard = memo<PremiumProductCardProps>(({
  product,
  onAddToCart,
  onToggleFavorite,
  onShare,
  onView,
  className,
  priority = false
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const cache = useIntelligentCache<boolean>();
  
  const mainImage = product.image_urls?.[currentImageIndex] || product.image_urls?.[0] || '';
  
  const { 
    imgRef, 
    src, 
    srcSet, 
    isLoading, 
    hasError, 
    format,
    sizes 
  } = useAdvancedImageOptimization(mainImage, {
    quality: priority ? 95 : 85,
    format: 'auto',
    lazy: !priority,
    placeholder: 'blur'
  });

  const handleAddToCart = useCallback(() => {
    onAddToCart?.(product.id);
    // Cache la acción para analytics
    cache.set(`cart_action_${product.id}`, true, 60000);
  }, [onAddToCart, product.id, cache]);

  const handleToggleFavorite = useCallback(() => {
    setIsFavorited(prev => !prev);
    onToggleFavorite?.(product.id);
    cache.set(`favorite_${product.id}`, !isFavorited, 300000);
  }, [onToggleFavorite, product.id, isFavorited, cache]);

  const handleShare = useCallback(() => {
    onShare?.(product.id);
    cache.set(`share_${product.id}`, true, 60000);
  }, [onShare, product.id, cache]);

  const handleView = useCallback(() => {
    onView?.(product.id);
    cache.set(`view_${product.id}`, true, 300000);
  }, [onView, product.id, cache]);

  const discountedPrice = product.discount_percentage 
    ? product.price * (1 - product.discount_percentage / 100)
    : product.price;

  const handleImageError = useCallback(() => {
    if (currentImageIndex < product.image_urls.length - 1) {
      setCurrentImageIndex(prev => prev + 1);
    }
  }, [currentImageIndex, product.image_urls.length]);

  return (
    <Card 
      className={cn(
        "group relative overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1",
        "bg-white border border-gray-200 hover:border-primary/20",
        isHovered && "shadow-2xl border-primary/30",
        className
      )}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-gray-100">
        {/* Loading State */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        )}

        {/* Main Image */}
        <img
          ref={imgRef}
          src={src}
          srcSet={srcSet}
          sizes={sizes}
          alt={product.name}
          className={cn(
            "object-cover w-full h-full transition-all duration-500",
            "group-hover:scale-110",
            isLoading && "opacity-0",
            !isLoading && !hasError && "opacity-100"
          )}
          onError={handleImageError}
          loading={priority ? "eager" : "lazy"}
          onClick={handleView}
        />

        {/* Image Overlay */}
        <div 
          className={cn(
            "absolute inset-0 bg-black/0 transition-all duration-300",
            isHovered && "bg-black/20"
          )}
        />

        {/* Top Badges */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {product.is_premium && (
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg">
              <Award className="h-3 w-3 mr-1" />
              Premium
            </Badge>
          )}
          {product.is_trending && (
            <Badge className="bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg">
              <TrendingUp className="h-3 w-3 mr-1" />
              Trending
            </Badge>
          )}
          {product.discount_percentage && (
            <Badge variant="destructive" className="shadow-lg">
              -{product.discount_percentage}%
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        <div className={cn(
          "absolute top-2 right-2 flex flex-col gap-2 opacity-0 transition-all duration-300",
          isHovered && "opacity-100"
        )}>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
            onClick={handleToggleFavorite}
          >
            <Heart 
              className={cn(
                "h-4 w-4 transition-colors",
                isFavorited ? "fill-red-500 text-red-500" : "text-gray-600"
              )} 
            />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
            onClick={handleShare}
          >
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
          <Button
            size="sm"
            variant="secondary"
            className="h-8 w-8 p-0 bg-white/90 hover:bg-white shadow-lg"
            onClick={handleView}
          >
            <Eye className="h-4 w-4 text-gray-600" />
          </Button>
        </div>

        {/* Image Navigation */}
        {product.image_urls.length > 1 && (
          <div className="absolute bottom-2 left-1/2 transform -translate-x-1/2 flex gap-1">
            {product.image_urls.map((_, index) => (
              <button
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === currentImageIndex ? "bg-white" : "bg-white/50"
                )}
                onClick={() => setCurrentImageIndex(index)}
              />
            ))}
          </div>
        )}

        {/* Format Indicator */}
        {format !== 'original' && (
          <div className="absolute bottom-2 right-2">
            <Badge variant="secondary" className="text-xs bg-black/50 text-white">
              {format === 'webp-supported' ? 'WebP' : format.toUpperCase()}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Store Info */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">{product.store.name}</span>
            {product.store.verified && (
              <Badge variant="secondary" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                Verificado
              </Badge>
            )}
          </div>
          {product.store.rating && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span className="text-xs text-gray-600">{product.store.rating}</span>
            </div>
          )}
        </div>

        {/* Product Name */}
        <h3 
          className="font-semibold text-gray-900 line-clamp-2 cursor-pointer hover:text-primary transition-colors"
          onClick={handleView}
        >
          {product.name}
        </h3>

        {/* Description */}
        <p className="text-sm text-gray-600 line-clamp-2">
          {product.description}
        </p>

        {/* Rating & Reviews */}
        {product.rating && (
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={cn(
                    "h-3 w-3",
                    i < Math.floor(product.rating!) 
                      ? "fill-yellow-400 text-yellow-400" 
                      : "text-gray-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm text-gray-600">
              ({product.reviews_count || 0})
            </span>
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg font-bold text-primary">
              S/{discountedPrice.toFixed(2)}
            </span>
            {product.discount_percentage && (
              <span className="text-sm text-gray-500 line-through">
                S/{product.price.toFixed(2)}
              </span>
            )}
          </div>
          <Badge variant="outline" className="text-xs">
            {product.category}
          </Badge>
        </div>

        {/* Add to Cart Button */}
        <Button 
          onClick={handleAddToCart}
          className="w-full transition-all duration-300 hover:shadow-lg"
          size="sm"
        >
          <ShoppingCart className="h-4 w-4 mr-2" />
          Agregar al Carrito
        </Button>
      </div>

      {/* Premium Gradient Border */}
      {product.is_premium && (
        <div className="absolute inset-0 rounded-lg p-[1px] bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500 pointer-events-none">
          <div className="w-full h-full rounded-lg bg-white"></div>
        </div>
      )}
    </Card>
  );
});

PremiumProductCard.displayName = "PremiumProductCard";
