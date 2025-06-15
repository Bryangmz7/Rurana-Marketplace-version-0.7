
import React from 'react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';

interface CartTotalsProps {
  items: ReturnType<typeof useCart>['items'];
  isProcessing: boolean;
  deliveryAddress: string;
  onCheckout: () => void;
}

const CartTotals = ({ items, isProcessing, deliveryAddress, onCheckout }: CartTotalsProps) => {
  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
  const storeCount = new Set(items.map(item => item.product.store_id)).size;
  const estimatedShipping = storeCount * 10; // S/10 por tienda
  const finalTotal = total + estimatedShipping;

  return (
    <div className="space-y-4">
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span>Subtotal:</span>
          <span>S/{total.toFixed(2)}</span>
        </div>
        <div className="flex justify-between">
          <span>Envío ({storeCount} tienda{storeCount > 1 ? 's' : ''}):</span>
          <span>S/{estimatedShipping.toFixed(2)}</span>
        </div>
        <div className="flex justify-between font-semibold text-lg border-t pt-2">
          <span>Total:</span>
          <span>S/{finalTotal.toFixed(2)}</span>
        </div>
      </div>
      <Button
        onClick={onCheckout}
        disabled={isProcessing || !deliveryAddress.trim()}
        className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
        size="lg"
      >
        {isProcessing ? 'Procesando...' : 'Realizar Pedido'}
      </Button>
      <p className="text-xs text-gray-500 text-center">
        Los pedidos se envían por separado desde cada tienda
      </p>
    </div>
  );
};

export default CartTotals;
