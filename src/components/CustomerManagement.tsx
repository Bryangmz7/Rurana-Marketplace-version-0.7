
import React from 'react';
import ConfirmedOrders from './ConfirmedOrders';

interface CustomerManagementProps {
  storeId: string;
}

const CustomerManagement = ({ storeId }: CustomerManagementProps) => {
  return (
    <div className="space-y-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
        <p className="text-gray-600">
          Administra los pedidos confirmados y comunícate con tus clientes
        </p>
      </div>
      
      <ConfirmedOrders storeId={storeId} />
    </div>
  );
};

export default CustomerManagement;
