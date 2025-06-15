
import React, { memo, useCallback } from 'react';
import { Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface CartItemProps {
  item: {
    id: string;
    product_id: string;
    quantity: number;
    product: {
      id: string;
      name: string;
      price: number;
      image_urls: string[];
      store: {
        name: string;
      };
    };
  };
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
}

export const OptimizedCartItem = memo<CartItemProps>(({ item, onQuantityChange, onRemove }) => {
  const handleIncrease = useCallback(() => {
    onQuantityChange(item.product_id, item.quantity + 1);
  }, [item.product_id, item.quantity, onQuantityChange]);

  const handleDecrease = useCallback(() => {
    onQuantityChange(item.product_id, Math.max(0, item.quantity - 1));
  }, [item.product_id, item.quantity, onQuantityChange]);

  const handleRemove = useCallback(() => {
    onRemove(item.product_id);
  }, [item.product_id, onRemove]);

  const imageUrl = item.product.image_urls?.[0];
  const total = item.product.price * item.quantity;

  return (
    <Card className="p-4 transition-all hover:shadow-md">
      <div className="flex gap-4">
        {imageUrl && (
          <div className="flex-shrink-0">
            <img
              src={imageUrl}
              alt={item.product.name}
              className="w-16 h-16 object-cover rounded-md"
              loading="lazy"
            />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className="font-medium text-sm truncate" title={item.product.name}>
            {item.product.name}
          </h3>
          
          <p className="text-xs text-gray-500 mb-1">
            Por: {item.product.store.name}
          </p>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleDecrease}
                className="h-8 w-8 p-0"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              
              <span className="w-8 text-center text-sm font-medium">
                {item.quantity}
              </span>
              
              <Button
                variant="outline"
                size="sm"
                onClick={handleIncrease}
                className="h-8 w-8 p-0"
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>

            <div className="text-right">
              <p className="text-sm font-semibold text-primary">
                S/{total.toFixed(2)}
              </p>
              <p className="text-xs text-gray-500">
                S/{item.product.price.toFixed(2)} c/u
              </p>
            </div>
          </div>
        </div>

        <Button
          variant="ghost"
          size="sm"
          onClick={handleRemove}
          className="text-red-600 hover:text-red-700 hover:bg-red-50 self-start"
        >
          <X className="h-4 w-4" />
        </Button>
      </div>
    </Card>
  );
});

OptimizedCartItem.displayName = "OptimizedCartItem";
