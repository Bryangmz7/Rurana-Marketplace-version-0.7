
import React from 'react';
import ConfirmedOrders from './ConfirmedOrders';

interface CustomerManagementProps {
  storeId: string;
}

const CustomerManagement = ({ storeId }: CustomerManagementProps) => {
  return (
    <div className="space-y-6">
      <ConfirmedOrders storeId={storeId} />
    </div>
  );
};

export default CustomerManagement;
