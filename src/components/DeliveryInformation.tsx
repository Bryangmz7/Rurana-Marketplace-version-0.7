
import React from 'react';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';
import { Label } from './ui/label';

interface DeliveryInformationProps {
  deliveryData: {
    address: string;
    phone: string;
    notes: string;
  };
  setDeliveryData: React.Dispatch<React.SetStateAction<{
    address: string;
    phone: string;
    notes: string;
  }>>;
  orderNotes: string;
  setOrderNotes: React.Dispatch<React.SetStateAction<string>>;
}

const DeliveryInformation = ({
  deliveryData,
  setDeliveryData,
  orderNotes,
  setOrderNotes,
}: DeliveryInformationProps) => {
  return (
    <div className="space-y-4 mb-4">
      <h3 className="text-lg font-semibold">Información de entrega</h3>
      <div className="space-y-3">
        <div className="space-y-1">
          <Label htmlFor="delivery-address">Dirección de entrega *</Label>
          <Textarea
            id="delivery-address"
            placeholder="Ingresa tu dirección completa, distrito, y referencias..."
            value={deliveryData.address}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, address: e.target.value }))}
            rows={3}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="delivery-phone">Teléfono de contacto</Label>
          <Input
            id="delivery-phone"
            type="tel"
            placeholder="Número de WhatsApp preferible"
            value={deliveryData.phone}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, phone: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="delivery-notes">Notas de entrega</Label>
          <Input
            id="delivery-notes"
            placeholder="Referencias adicionales..."
            value={deliveryData.notes}
            onChange={(e) => setDeliveryData(prev => ({ ...prev, notes: e.target.value }))}
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="order-notes">Notas del pedido</Label>
          <Input
            id="order-notes"
            placeholder="Comentarios especiales..."
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />
        </div>
      </div>
    </div>
  );
};

export default DeliveryInformation;
