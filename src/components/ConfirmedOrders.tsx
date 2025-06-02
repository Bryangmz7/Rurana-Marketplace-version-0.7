
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Package, Clock, CheckCircle, XCircle, User, Phone, MapPin } from 'lucide-react';

interface Order {
  id: string;
  buyer_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  delivery_address: string | null;
  notes: string | null;
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
        .in('status', ['confirmed', 'in_progress', 'completed'])
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
              buyer_profile: buyerProfile || { name: 'Usuario', phone: null }
            };
          } catch (error) {
            console.error('Error fetching buyer profile:', error);
            return {
              ...order,
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
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

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
    }
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Pedidos Confirmados</h2>
        <Button onClick={fetchOrders} variant="outline">
          Actualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-8">
            <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No hay pedidos confirmados</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {orders.map((order) => (
            <Card key={order.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">
                    Pedido #{order.id.slice(-6)}
                  </CardTitle>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1 capitalize">{order.status}</span>
                  </Badge>
                </div>
                <div className="text-sm text-gray-600">
                  {new Date(order.created_at).toLocaleString('es-PE')}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Información del comprador */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <h4 className="font-medium text-blue-900">Información del Comprador</h4>
                  </div>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <span className="font-medium">Nombre:</span>
                      <span>{order.buyer_profile?.name || 'No disponible'}</span>
                    </div>
                    {order.buyer_profile?.phone && (
                      <div className="flex items-center gap-2">
                        <Phone className="h-4 w-4 text-gray-500" />
                        <span>{order.buyer_profile.phone}</span>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => contactBuyer(order)}
                          className="text-green-600 border-green-600 hover:bg-green-50 ml-auto"
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Contactar por WhatsApp
                        </Button>
                      </div>
                    )}
                    {order.delivery_address && (
                      <div className="flex items-start gap-2">
                        <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                        <div>
                          <span className="font-medium">Dirección:</span>
                          <p className="text-gray-600">{order.delivery_address}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <h4 className="font-medium mb-2">Productos:</h4>
                  <div className="space-y-2">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded">
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
                            Cantidad: {item.quantity} × S/{item.unit_price}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">S/{(item.quantity * item.unit_price).toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div>
                    <h4 className="font-medium mb-1">Notas:</h4>
                    <p className="text-gray-600 text-sm bg-gray-50 p-2 rounded">{order.notes}</p>
                  </div>
                )}

                <div className="flex items-center justify-between pt-4 border-t">
                  <div className="text-lg font-bold">
                    Total: S/{order.total.toFixed(2)}
                  </div>
                  <div className="flex gap-2">
                    <Select
                      value={order.status}
                      onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                    >
                      <SelectTrigger className="w-40">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
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
          ))}
        </div>
      )}
    </div>
  );
};

export default ConfirmedOrders;
