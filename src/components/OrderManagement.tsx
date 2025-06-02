
import React from 'react';
import OrdersList from './OrdersList';

interface OrderManagementProps {
  storeId: string;
}

const OrderManagement = ({ storeId }: OrderManagementProps) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Pedidos</h2>
        <p className="text-gray-600">
          Administra todos los pedidos de tu tienda y comunícate con tus clientes
        </p>
      </div>
      
      <OrdersList storeId={storeId} />
    </div>
  );
};

export default OrderManagement;
