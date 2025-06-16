
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Package } from 'lucide-react';
import { useOrders } from '@/hooks/useOrders';
import OrderCard from './OrderCard';

interface OrdersListProps {
  storeId: string;
}

const OrdersList = ({ storeId }: OrdersListProps) => {
  const {
    orders,
    loading,
    deletingOrder,
    fetchOrders,
    updateOrderStatus,
    deleteOrder
  } = useOrders(storeId);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
          <p className="text-gray-600">Administra todos los pedidos de tu tienda • Sincronización automática</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-600">Los pedidos aparecerán aquí cuando los clientes realicen compras</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <OrderCard
              key={order.id}
              order={order}
              deletingOrder={deletingOrder}
              onDeleteOrder={deleteOrder}
              onUpdateOrderStatus={updateOrderStatus}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
