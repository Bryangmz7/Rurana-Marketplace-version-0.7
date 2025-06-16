
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Trash2 } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Order } from '@/types/order';
import { getStatusColor, getStatusText } from '@/utils/orderUtils';
import OrderStatusIcon from './OrderStatusIcon';
import CustomerInfo from './CustomerInfo';
import OrderItems from './OrderItems';

interface OrderCardProps {
  order: Order;
  deletingOrder: string | null;
  onDeleteOrder: (orderId: string) => void;
  onUpdateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
}

const OrderCard = ({ order, deletingOrder, onDeleteOrder, onUpdateOrderStatus }: OrderCardProps) => {
  return (
    <Card key={order.id} className="overflow-hidden border-l-4 border-l-indigo-500">
      <CardHeader className="bg-gradient-to-r from-gray-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div>
              <CardTitle className="text-lg text-indigo-900">
                Pedido #{order.id.slice(-6)}
              </CardTitle>
              <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleString('es-PE')}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={`${getStatusColor(order.status)} border`}>
              <OrderStatusIcon status={order.status} />
              <span className="ml-1">{getStatusText(order.status)}</span>
            </Badge>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={deletingOrder === order.id}
                  className="ml-2"
                >
                  {deletingOrder === order.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Se eliminará permanentemente el pedido #{order.id.slice(-6)} 
                    y todos sus elementos asociados.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => onDeleteOrder(order.id)}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    Eliminar pedido
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="p-6 space-y-6">
        <CustomerInfo order={order} />
        <OrderItems orderItems={order.order_items} />

        {order.customer_notes && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <h4 className="font-medium mb-2 text-amber-900">Notas del cliente:</h4>
            <p className="text-amber-800 text-sm">{order.customer_notes}</p>
          </div>
        )}

        <div className="flex items-center justify-between pt-4 border-t border-gray-200">
          <div className="text-xl font-bold text-gray-900">
            Total: S/{order.total.toFixed(2)}
          </div>
          <div className="flex gap-3 items-center">
            <span className="text-sm text-gray-600">Estado:</span>
            <Select
              value={order.status}
              onValueChange={(value: Order['status']) => onUpdateOrderStatus(order.id, value)}
            >
              <SelectTrigger className="w-44">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pendiente</SelectItem>
                <SelectItem value="confirmed">Confirmado</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="completed">Completado</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderCard;
