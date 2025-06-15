import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Package, Clock, CheckCircle, XCircle, User, Phone, MapPin, RefreshCw } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Order {
  id: string;
  buyer_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string | null;
  customer_notes: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    product: {
      id: string;
      name: string;
      image_urls: string[] | null;
    };
  }>;
  buyer_profile?: {
    name: string;
    phone: string | null;
  };
}

const ConfirmedOrders = ({ storeId }: { storeId: string }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [orderToCancel, setOrderToCancel] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, [storeId]);

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            product:products (
              id,
              name,
              image_urls
            )
          )
        `)
        .eq('store_id', storeId)
        .in('status', ['confirmed', 'in_progress', 'shipped', 'delivered'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener información de los compradores
      const ordersWithBuyers = await Promise.all(
        (data || []).map(async (order) => {
          try {
            // Primero intentar obtener buyer_profile
            let { data: buyerProfile } = await supabase
              .from('buyer_profiles')
              .select('name, phone')
              .eq('user_id', order.buyer_id)
              .maybeSingle();

            // Si no hay buyer_profile, intentar seller_profile
            if (!buyerProfile) {
              const { data: sellerProfile } = await supabase
                .from('seller_profiles')
                .select('name, phone')
                .eq('user_id', order.buyer_id)
                .maybeSingle();
              
              buyerProfile = sellerProfile;
            }

            // Si tampoco hay seller_profile, obtener de users
            if (!buyerProfile) {
              const { data: userData } = await supabase
                .from('users')
                .select('name')
                .eq('id', order.buyer_id)
                .maybeSingle();
              
              if (userData) {
                buyerProfile = { name: userData.name, phone: null };
              }
            }

            return {
              ...order,
              status: order.status as Order['status'],
              buyer_profile: buyerProfile || { name: 'Usuario', phone: null }
            };
          } catch (error) {
            console.error('Error fetching buyer profile:', error);
            return {
              ...order,
              status: order.status as Order['status'],
              buyer_profile: { name: 'Usuario', phone: null }
            };
          }
        })
      );

      setOrders(ordersWithBuyers);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    setUpdatingOrder(orderId);
    try {
      const { data, error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId)
        .select();

      if (error) {
        console.error('Supabase error updating order status:', error);
        throw error;
      }
      
      console.log('Order status updated successfully in DB:', data);

      if (newStatus === 'cancelled') {
        setOrders(prev => prev.filter(order => order.id !== orderId));
      } else {
        setOrders(prev => prev.map(order => 
          order.id === orderId ? { ...order, status: newStatus } : order
        ));
      }

      toast({
        title: "Estado actualizado",
        description: "El estado del pedido se ha actualizado correctamente",
      });
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el estado del pedido",
        variant: "destructive",
      });
    } finally {
      setUpdatingOrder(null);
    }
  };

  const handleCancelOrder = () => {
    if (orderToCancel) {
      updateOrderStatus(orderToCancel, 'cancelled');
      setOrderToCancel(null);
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'shipped': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'En Progreso';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const contactBuyer = (order: Order) => {
    if (!order.buyer_profile?.phone) {
      toast({
        title: "Sin número de contacto",
        description: "Este comprador no tiene número de WhatsApp registrado",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = order.buyer_profile.phone.replace(/[^\d]/g, '');
    let whatsappNumber = cleanPhone;
    if (!whatsappNumber.startsWith('51') && whatsappNumber.length === 9) {
      whatsappNumber = '51' + whatsappNumber;
    }

    const message = `Hola ${order.buyer_profile.name}, te contacto por tu pedido #${order.id.slice(-6)} por S/${order.total}. ¿En qué puedo ayudarte?`;
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Clientes</h2>
          <p className="text-gray-600">Administra los pedidos confirmados y comunícate con tus clientes</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos confirmados</h3>
            <p className="text-gray-500">Los pedidos confirmados aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      Pedido #{order.id.slice(-6)}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">S/{order.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      {new Date(order.created_at).toLocaleDateString('es-PE', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="p-6">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Información del cliente */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-5 w-5 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Cliente</h4>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium">{order.buyer_profile?.name || 'Usuario'}</div>
                      {order.buyer_profile?.phone && (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-4 w-4 text-gray-500" />
                            <span>{order.buyer_profile.phone}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => contactBuyer(order)}
                            className="text-green-600 border-green-600 hover:bg-green-50"
                          >
                            <MessageCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                      {order.delivery_address && (
                        <div className="flex items-start gap-2 text-sm">
                          <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                          <span className="text-gray-600">{order.delivery_address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productos */}
                  <div className="lg:col-span-2">
                    <h4 className="font-medium mb-3">Productos</h4>
                    <div className="space-y-2">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                          {item.product.image_urls && item.product.image_urls[0] && (
                            <img
                              src={item.product.image_urls[0]}
                              alt={item.product.name}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                          <div className="flex-1">
                            <p className="font-medium">{item.product.name}</p>
                            <p className="text-sm text-gray-600">
                              {item.quantity} × S/{item.unit_price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">S/{(item.quantity * item.unit_price).toFixed(2)}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {order.customer_notes && (
                      <div className="mt-4">
                        <h5 className="font-medium mb-1">Notas del pedido:</h5>
                        <p className="text-sm text-gray-600 bg-yellow-50 p-2 rounded border">{order.customer_notes}</p>
                      </div>
                    )}

                    <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t flex-wrap">
                      {updatingOrder === order.id && <p className="text-sm text-gray-500">Actualizando...</p>}
                      {order.status === 'confirmed' && (
                          <>
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'in_progress')} disabled={!!updatingOrder}>Marcar como "En Progreso"</Button>
                              <Button size="sm" variant="destructive" onClick={() => setOrderToCancel(order.id)} disabled={!!updatingOrder}>Cancelar Pedido</Button>
                          </>
                      )}
                      {order.status === 'in_progress' && (
                          <>
                              <Button size="sm" onClick={() => updateOrderStatus(order.id, 'shipped')} disabled={!!updatingOrder}>Marcar como "Enviado"</Button>
                              <Button size="sm" variant="destructive" onClick={() => setOrderToCancel(order.id)} disabled={!!updatingOrder}>Cancelar Pedido</Button>
                          </>
                      )}
                      {order.status === 'shipped' && (
                          <Button size="sm" onClick={() => updateOrderStatus(order.id, 'delivered')} disabled={!!updatingOrder}>Marcar como "Entregado"</Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      <AlertDialog open={!!orderToCancel} onOpenChange={(open) => !open && setOrderToCancel(null)}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>¿Estás seguro de cancelar este pedido?</AlertDialogTitle>
                <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto cancelará permanentemente el pedido para el cliente.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setOrderToCancel(null)}>No, mantener pedido</AlertDialogCancel>
                <AlertDialogAction onClick={handleCancelOrder} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Sí, cancelar pedido</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ConfirmedOrders;
