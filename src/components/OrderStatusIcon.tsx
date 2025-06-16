
import { Clock, Package, CheckCircle, XCircle } from 'lucide-react';
import { Order } from '@/types/order';

interface OrderStatusIconProps {
  status: Order['status'];
}

const OrderStatusIcon = ({ status }: OrderStatusIconProps) => {
  switch (status) {
    case 'pending': return <Clock className="h-4 w-4" />;
    case 'confirmed': return <Package className="h-4 w-4" />;
    case 'in_progress': return <Clock className="h-4 w-4" />;
    case 'completed': return <CheckCircle className="h-4 w-4" />;
    case 'cancelled': return <XCircle className="h-4 w-4" />;
    default: return <Package className="h-4 w-4" />;
  }
};

export default OrderStatusIcon;
