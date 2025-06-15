
import React from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import CartItem from './CartItem';
import { useCart } from '@/hooks/useCart';

interface CartItemsListProps {
  items: ReturnType<typeof useCart>['items'];
  onQuantityChange: (productId: string, quantity: number) => Promise<void>;
  onRemove: (productId: string) => Promise<void>;
}

const CartItemsList = ({ items, onQuantityChange, onRemove }: CartItemsListProps) => {
  return (
    <ScrollArea className="flex-1 mb-4">
      <div className="space-y-4 pr-4">
        {items.map((item) => (
          <CartItem
            key={item.product.id}
            item={item}
            onQuantityChange={onQuantityChange}
            onRemove={onRemove}
          />
        ))}
      </div>
    </ScrollArea>
  );
};

export default CartItemsList;
