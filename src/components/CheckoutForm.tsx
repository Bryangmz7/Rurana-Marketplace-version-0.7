
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreditCard } from 'lucide-react';

interface CheckoutFormProps {
  total: number;
  onCheckout: (data: { delivery_address: string; notes: string }) => void;
  isProcessing: boolean;
}

const CheckoutForm = ({ total, onCheckout, isProcessing }: CheckoutFormProps) => {
  const [checkoutData, setCheckoutData] = useState({
    delivery_address: '',
    notes: ''
  });

  const handleSubmit = () => {
    onCheckout(checkoutData);
  };

  return (
    <div className="border-t p-4 space-y-4">
      <div className="flex justify-between items-center text-lg font-semibold">
        <span>Total:</span>
        <span className="text-primary">S/{total.toFixed(2)}</span>
      </div>

      <div className="space-y-3">
        <div>
          <Label htmlFor="delivery_address">Dirección de entrega *</Label>
          <Input
            id="delivery_address"
            placeholder="Ingresa tu dirección completa"
            value={checkoutData.delivery_address}
            onChange={(e) => setCheckoutData(prev => ({ ...prev, delivery_address: e.target.value }))}
          />
        </div>

        <div>
          <Label htmlFor="notes">Notas adicionales</Label>
          <Textarea
            id="notes"
            placeholder="Instrucciones especiales (opcional)"
            value={checkoutData.notes}
            onChange={(e) => setCheckoutData(prev => ({ ...prev, notes: e.target.value }))}
            rows={2}
          />
        </div>
      </div>

      <Button 
        onClick={handleSubmit} 
        className="w-full" 
        disabled={isProcessing}
      >
        <CreditCard className="h-4 w-4 mr-2" />
        {isProcessing ? 'Procesando...' : 'Realizar Pedido'}
      </Button>
    </div>
  );
};

export default CheckoutForm;
