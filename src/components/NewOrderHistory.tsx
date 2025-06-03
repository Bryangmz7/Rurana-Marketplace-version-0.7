
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, CheckCircle, XCircle, Calendar, Store, MapPin, Truck, Eye } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  store_id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled';
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  customer_notes: string | null;
  estimated_delivery_date: string | null;
  tracking_number: string | null;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  shipped_at: string | null;
  delivered_at: string | null;
  store: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    customization_details: any;
    special_instructions: string | null;
    product: {
      id: string;
      name: string;
      image_urls: string[] | null;
      is_customizable: boolean;
    };
  }>;
}

interface NewOrderHistoryProps {
  userId: string;
}

const NewOrderHistory = ({ userId }: NewOrderHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrderHistory();
    
    // Configurar suscripción en tiempo real para actualizaciones de estado
    const channel = supabase
      .channel('buyer-new-orders-updates')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `buyer_id=eq.${userId}`
        },
        (payload) => {
          console.log('Order status updated for buyer:', payload);
          // Actualizar el estado local cuando el seller cambie el estado
          setOrders(prev => prev.map(order => 
            order.id === payload.new.id 
              ? { ...order, ...payload.new }
              : order
          ));
          
          // Mostrar notificación al comprador cuando cambie el estado
          const statusTexts = {
            'pending': 'Pendiente',
            'confirmed': 'Confirmado',
            'in_progress': 'En Progreso',
            'shipped': 'Enviado',
            'delivered': 'Entregado',
            'cancelled': 'Cancelado'
          };
          
          toast({
            title: "Estado del pedido actualizado",
            description: `Tu pedido ${payload.new.order_number} ahora está: ${statusTexts[payload.new.status as keyof typeof statusTexts]}`,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, toast]);

  const fetchOrderHistory = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          store:stores (
            id,
            name,
            logo_url
          ),
          order_items (
            *,
            product:products (
              id,
              name,
              image_urls,
              is_customizable
            )
          )
        `)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Error fetching order history:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el historial de pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'shipped': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'delivered': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'shipped': return <Truck className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'En Progreso';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const getStatusDescription = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Tu pedido está siendo revisado por el vendedor';
      case 'confirmed': return 'El vendedor ha confirmado tu pedido y lo está preparando';
      case 'in_progress': return 'Tu pedido está siendo preparado';
      case 'shipped': return 'Tu pedido ha sido enviado y está en camino';
      case 'delivered': return 'Tu pedido ha sido entregado exitosamente';
      case 'cancelled': return 'Este pedido fue cancelado';
      default: return '';
    }
  };

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
          <h2 className="text-2xl font-bold text-gray-900">Mis Pedidos</h2>
          <p className="text-gray-600">Historial completo de tus compras • Sistema mejorado con seguimiento</p>
        </div>
        <Button onClick={fetchOrderHistory} variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No tienes pedidos</h3>
            <p className="text-gray-600">Cuando realices compras, aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-3">
                      {order.store.logo_url ? (
                        <img 
                          src={order.store.logo_url} 
                          alt={order.store.name}
                          className="w-10 h-10 rounded-full object-cover border"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                          <Store className="h-5 w-5 text-gray-500" />
                        </div>
                      )}
                      <div>
                        <CardTitle className="text-lg">
                          Pedido {order.order_number}
                        </CardTitle>
                        <p className="text-sm text-gray-600">de {order.store.name}</p>
                        <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                          <Calendar className="h-4 w-4" />
                          {new Date(order.created_at).toLocaleString('es-PE')}
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <Badge className={`${getStatusColor(order.status)} border mb-2`}>
                        {getStatusIcon(order.status)}
                        <span className="ml-1">{getStatusText(order.status)}</span>
                      </Badge>
                      <p className="text-sm text-gray-600 max-w-48 text-right">{getStatusDescription(order.status)}</p>
                    </div>
                    <Button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {selectedOrder?.id === order.id && (
                <CardContent className="p-6 space-y-4">
                  {/* Seguimiento */}
                  {order.tracking_number && (
                    <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                      <div className="flex items-center gap-2">
                        <Truck className="h-4 w-4 text-purple-600" />
                        <div>
                          <h4 className="font-medium text-purple-900 mb-1">Número de seguimiento</h4>
                          <p className="text-purple-800 font-mono text-sm">{order.tracking_number}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Productos con personalización */}
                  <div>
                    <h4 className="font-medium mb-3 text-gray-900">Productos:</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-3 bg-gray-50 rounded-lg">
                          {item.product.image_urls && item.product.image_urls[0] && (
                            <img
                              src={item.product.image_urls[0]}
                              alt={item.product.name}
                              className="w-16 h-16 object-cover rounded border"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              Cantidad: {item.quantity} × S/{item.unit_price.toFixed(2)}
                            </p>
                            {item.product.is_customizable && item.customization_details && (
                              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                <strong>Personalización aplicada:</strong>
                                <pre className="whitespace-pre-wrap mt-1 text-blue-800">
                                  {JSON.stringify(item.customization_details, null, 2)}
                                </pre>
                              </div>
                            )}
                            {item.special_instructions && (
                              <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                                <strong>Instrucciones especiales:</strong> {item.special_instructions}
                              </div>
                            )}
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">
                              S/{item.total_price.toFixed(2)}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Información de entrega */}
                  {order.delivery_address && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900 mb-1">Dirección de entrega</h4>
                          <p className="text-blue-800 text-sm">{order.delivery_address}</p>
                          {order.delivery_phone && (
                            <p className="text-blue-700 text-sm mt-1">Teléfono: {order.delivery_phone}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notas */}
                  {(order.customer_notes || order.delivery_notes) && (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-gray-900">Notas del pedido:</h4>
                      {order.customer_notes && (
                        <p className="text-gray-700 text-sm mb-2">
                          <strong>Notas generales:</strong> {order.customer_notes}
                        </p>
                      )}
                      {order.delivery_notes && (
                        <p className="text-gray-700 text-sm">
                          <strong>Notas de entrega:</strong> {order.delivery_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Totales */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Subtotal: S/{order.subtotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Envío: S/{order.shipping_cost.toFixed(2)}</p>
                      <p className="text-xl font-bold text-gray-900">Total: S/{order.total.toFixed(2)}</p>
                    </div>
                    <div className="text-sm text-gray-500">
                      🔄 Estado actualizado automáticamente
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewOrderHistory;
