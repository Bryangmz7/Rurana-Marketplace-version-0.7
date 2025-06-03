
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Package, Clock, CheckCircle, XCircle, User, Phone, MapPin, RefreshCw, calendar, trash2 } from 'lucide-react';

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product: {
    id: string;
    name: string;
    image_urls: string[] | null;
  };
}

interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'shipped' | 'delivered';
  delivery_address: string | null;
  customer_notes: string | null;
  created_at: string;
  order_items: OrderItem[];
  buyer_profile?: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    avatar_url: string | null;
  };
}

interface NewOrderManagementProps {
  storeId: string;
}

const NewOrderManagement = ({ storeId }: NewOrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingOrder, setUpdatingOrder] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'active'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Configurar suscripción en tiempo real
    const channel = supabase
      .channel('new-orders-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
          filter: `store_id=eq.${storeId}`
        },
        (payload) => {
          console.log('Order change detected:', payload);
          fetchOrders(); // Recargar pedidos cuando hay cambios
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [storeId]);

  const fetchOrders = async () => {
    try {
      console.log('Fetching orders for store:', storeId);
      
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            id,
            quantity,
            unit_price,
            total_price,
            product:products (
              id,
              name,
              image_urls
            )
          )
        `)
        .eq('store_id', storeId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched:', data?.length || 0);

      // Obtener información completa de los compradores
      const ordersWithBuyers = await Promise.all(
        (data || []).map(async (order) => {
          try {
            // Intentar obtener buyer_profile primero
            let { data: buyerProfile } = await supabase
              .from('buyer_profiles')
              .select('name, phone, email, address, avatar_url')
              .eq('user_id', order.buyer_id)
              .maybeSingle();

            // Si no hay buyer_profile, intentar seller_profile
            if (!buyerProfile) {
              const { data: sellerProfile } = await supabase
                .from('seller_profiles')
                .select('name, phone, email, business_name, avatar_url')
                .eq('user_id', order.buyer_id)
                .maybeSingle();
              
              if (sellerProfile) {
                buyerProfile = {
                  name: sellerProfile.name,
                  phone: sellerProfile.phone,
                  email: sellerProfile.email,
                  address: sellerProfile.business_name,
                  avatar_url: sellerProfile.avatar_url
                };
              }
            }

            // Si no hay perfil, obtener datos básicos del usuario
            if (!buyerProfile) {
              const { data: userData } = await supabase
                .from('users')
                .select('name, email')
                .eq('id', order.buyer_id)
                .maybeSingle();
              
              if (userData) {
                buyerProfile = { 
                  name: userData.name, 
                  phone: null, 
                  email: userData.email,
                  address: null,
                  avatar_url: null
                };
              }
            }

            return {
              ...order,
              status: order.status as Order['status'],
              buyer_profile: buyerProfile || { 
                name: 'Usuario', 
                phone: null, 
                email: null,
                address: null,
                avatar_url: null
              }
            };
          } catch (error) {
            console.error('Error fetching buyer profile for order:', order.id, error);
            return {
              ...order,
              status: order.status as Order['status'],
              buyer_profile: { 
                name: 'Usuario', 
                phone: null, 
                email: null,
                address: null,
                avatar_url: null
              }
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
    } finally {
      setUpdatingOrder(null);
    }
  };

  const deleteOrder = async (orderId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este pedido?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('orders')
        .delete()
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.filter(order => order.id !== orderId));

      toast({
        title: "Pedido eliminado",
        description: "El pedido ha sido eliminado correctamente",
      });
    } catch (error) {
      console.error('Error deleting order:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el pedido",
        variant: "destructive",
      });
    }
  };

  const contactBuyer = (order: Order) => {
    const phone = order.buyer_profile?.phone;
    if (!phone) {
      toast({
        title: "Sin número de contacto",
        description: "Este cliente no tiene número de WhatsApp registrado",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    let whatsappNumber = cleanPhone;
    if (!whatsappNumber.startsWith('51') && whatsappNumber.length === 9) {
      whatsappNumber = '51' + whatsappNumber;
    }

    const customerName = order.buyer_profile?.name || 'Cliente';
    const orderId = order.order_number || order.id.slice(-6);
    const orderTotal = order.total.toFixed(2);
    const products = order.order_items.map(item => 
      `- ${item.product.name} (x${item.quantity})`
    ).join('\n');

    const message = `¡Hola ${customerName}! 👋\n\nTe contacto por tu pedido #${orderId}.\n\n📦 *Productos:*\n${products}\n\n💰 *Total:* S/${orderTotal}\n\n¿En qué puedo ayudarte?`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => {
        if (filter === 'pending') return order.status === 'pending';
        if (filter === 'confirmed') return order.status === 'confirmed';
        if (filter === 'active') return ['confirmed', 'in_progress', 'shipped'].includes(order.status);
        return true;
      });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
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
      case 'shipped': return <Package className="h-4 w-4" />;
      case 'delivered': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
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
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
          <p className="text-gray-600">Administra todos los pedidos de tu tienda</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          Todos ({orders.length})
        </Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>
          Pendientes ({orders.filter(o => o.status === 'pending').length})
        </Button>
        <Button variant={filter === 'confirmed' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('confirmed')}>
          Confirmados ({orders.filter(o => o.status === 'confirmed').length})
        </Button>
        <Button variant={filter === 'active' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('active')}>
          Activos ({orders.filter(o => ['confirmed', 'in_progress', 'shipped'].includes(o.status)).length})
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay pedidos</h3>
            <p className="text-gray-500">Los nuevos pedidos aparecerán aquí</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 max-h-[70vh] overflow-y-auto">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="w-full">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      Pedido #{order.order_number || order.id.slice(-6)}
                    </CardTitle>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">S/{order.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <calendar className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString('es-PE')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Información del cliente */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <User className="h-4 w-4 text-blue-600" />
                      <h4 className="font-medium text-blue-900">Cliente</h4>
                      <Button
                        onClick={() => deleteOrder(order.id)}
                        variant="ghost"
                        size="sm"
                        className="ml-auto text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="space-y-2">
                      <div className="font-medium">{order.buyer_profile?.name || 'Usuario'}</div>
                      
                      {order.buyer_profile?.email && (
                        <div className="text-sm text-gray-600">{order.buyer_profile.email}</div>
                      )}
                      
                      {order.buyer_profile?.phone ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm">
                            <Phone className="h-3 w-3 text-gray-500" />
                            <span>{order.buyer_profile.phone}</span>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => contactBuyer(order)}
                            className="text-green-600 border-green-600 hover:bg-green-50 h-7 px-2"
                          >
                            <MessageCircle className="h-3 w-3" />
                          </Button>
                        </div>
                      ) : (
                        <div className="text-sm text-gray-500">Sin WhatsApp</div>
                      )}
                      
                      {order.delivery_address && (
                        <div className="flex items-start gap-2 text-sm mt-2">
                          <MapPin className="h-3 w-3 text-gray-500 mt-0.5" />
                          <span className="text-gray-600">{order.delivery_address}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Productos y estado */}
                  <div>
                    <h4 className="font-medium mb-2">Productos ({order.order_items.length})</h4>
                    <div className="space-y-1 max-h-24 overflow-y-auto mb-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex justify-between text-sm">
                          <span className="truncate">{item.product.name}</span>
                          <span className="text-gray-600">x{item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    
                    {order.customer_notes && (
                      <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
                        <strong>Nota:</strong> {order.customer_notes}
                      </div>
                    )}

                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Estado:</span>
                      <Select
                        value={order.status}
                        onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                        disabled={updatingOrder === order.id}
                      >
                        <SelectTrigger className="w-32 h-8">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pendiente</SelectItem>
                          <SelectItem value="confirmed">Confirmado</SelectItem>
                          <SelectItem value="in_progress">En Progreso</SelectItem>
                          <SelectItem value="shipped">Enviado</SelectItem>
                          <SelectItem value="delivered">Entregado</SelectItem>
                          <SelectItem value="cancelled">Cancelado</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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

export default NewOrderManagement;
