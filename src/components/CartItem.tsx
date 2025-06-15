import { Plus, Minus, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CartItem as CartItemType } from '@/types/cart';

interface CartItemProps {
  item: CartItemType;
  onQuantityChange: (productId: string, newQuantity: number) => void;
  onRemove: (productId: string) => void;
}

const CartItem = ({ item, onQuantityChange, onRemove }: CartItemProps) => {
  return (
    <div className="flex gap-3 p-3 border rounded-lg">
      {item.product.image_urls && item.product.image_urls[0] && (
        <img
          src={item.product.image_urls[0]}
          alt={item.product.name}
          className="w-16 h-16 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <h3 className="font-medium text-sm">{item.product.name}</h3>
        <p className="text-primary font-semibold">S/{item.product.price}</p>
        <div className="flex items-center gap-2 mt-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.product.id, item.quantity - 1)}
            className="h-8 w-8 p-0"
          >
            <Minus className="h-3 w-3" />
          </Button>
          <span className="w-8 text-center text-sm">{item.quantity}</span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onQuantityChange(item.product.id, item.quantity + 1)}
            className="h-8 w-8 p-0"
            disabled={item.quantity >= item.product.stock}
          >
            <Plus className="h-3 w-3" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(item.product.id)}
            className="text-red-600 hover:text-red-700 ml-auto"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartItem;
