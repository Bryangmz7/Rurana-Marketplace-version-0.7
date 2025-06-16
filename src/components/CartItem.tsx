
import { Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem = ({ item, onQuantityChange, onRemove }: CartItemProps) => {
  return (
    <div className="flex gap-4 p-4 border rounded-lg bg-white">
      {item.product.image_urls && item.product.image_urls[0] && (
        <img
          src={item.product.image_urls[0]}
          alt={item.product.name}
          className="w-20 h-20 object-cover rounded-lg border"
        />
      )}
      <div className="flex-1">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h3 className="font-semibold text-gray-900">{item.product.name}</h3>
            {item.product.store?.name && (
              <Badge variant="secondary" className="mt-1 text-xs">
                {item.product.store.name}
              </Badge>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.product.id)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border rounded-md">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuantityChange(item.product.id, item.quantity - 1)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                disabled={item.quantity <= 1}
              >
                <Minus className="h-3 w-3" />
              </Button>
              <span className="w-8 text-center text-sm font-medium">{item.quantity}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
                className="h-8 w-8 p-0 hover:bg-gray-100"
                disabled={item.quantity >= item.product.stock}
              >
                <Plus className="h-3 w-3" />
              </Button>
            </div>
            <span className="text-sm text-gray-500">
              Stock: {item.product.stock}
            </span>
          </div>
          
          <div className="text-right">
            <p className="text-lg font-semibold text-primary">
              S/{(item.product.price * item.quantity).toFixed(2)}
            </p>
            <p className="text-sm text-gray-500">
              S/{item.product.price.toFixed(2)} c/u
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
