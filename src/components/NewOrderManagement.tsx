
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { 
  MessageCircle, 
  Package, 
  Clock, 
  CheckCircle, 
  XCircle, 
  User, 
  Phone, 
  MapPin, 
  Calendar,
  Truck,
  Eye,
  Edit2,
  Trash2,
  RefreshCw
} from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  buyer_id: string;
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
  order_items: OrderItem[];
  buyer_profile?: BuyerProfile;
}

interface OrderItem {
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
}

interface BuyerProfile {
  name: string;
  phone: string | null;
  email: string | null;
  address: string | null;
  avatar_url: string | null;
}

interface NewOrderManagementProps {
  storeId: string;
}

const NewOrderManagement = ({ storeId }: NewOrderManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [isEditing, setIsEditing] = useState(false);
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
          fetchOrders();
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
            *,
            product:products (
              id,
              name,
              image_urls,
              is_customizable
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

      // Obtener información de los compradores
      const ordersWithBuyers = await Promise.all(
        (data || []).map(async (order) => {
          try {
            let { data: buyerProfile } = await supabase
              .from('buyer_profiles')
              .select('name, phone, email, address, avatar_url')
              .eq('user_id', order.buyer_id)
              .maybeSingle();

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
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'confirmed') {
        updateData.confirmed_at = new Date().toISOString();
      } else if (newStatus === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (newStatus === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('orders')
        .update(updateData)
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus, ...updateData } : order
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

  const updateTrackingNumber = async (orderId: string, trackingNumber: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_number: trackingNumber })
        .eq('id', orderId);

      if (error) throw error;

      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, tracking_number: trackingNumber } : order
      ));

      toast({
        title: "Número de seguimiento actualizado",
        description: "El número de seguimiento se ha guardado correctamente",
      });
    } catch (error) {
      console.error('Error updating tracking number:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el número de seguimiento",
        variant: "destructive",
      });
    }
  };

  const deleteOrder = async (orderId: string) => {
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
    const phone = order.buyer_profile?.phone || order.delivery_phone;
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
    const orderNumber = order.order_number;
    const orderTotal = order.total.toFixed(2);
    const products = order.order_items.map(item => 
      `- ${item.product.name} (x${item.quantity})`
    ).join('\n');

    const message = `¡Hola ${customerName}! 👋\n\nTe contacto por tu pedido ${orderNumber}.\n\n📦 *Productos:*\n${products}\n\n💰 *Total:* S/${orderTotal}\n\n¿En qué puedo ayudarte?`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
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
          <p className="text-gray-600">Sistema mejorado de gestión de pedidos con personalización</p>
        </div>
        <Button onClick={fetchOrders} variant="outline">
          <RefreshCw className="h-4 w-4 mr-2" />
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
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido {order.order_number}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleString('es-PE')}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1">{getStatusText(order.status)}</span>
                    </Badge>
                    <Button
                      onClick={() => setSelectedOrder(selectedOrder?.id === order.id ? null : order)}
                      variant="outline"
                      size="sm"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => deleteOrder(order.id)}
                      variant="destructive"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              
              {selectedOrder?.id === order.id && (
                <CardContent className="p-6 space-y-6">
                  {/* Información del cliente */}
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-5">
                    <div className="flex items-start gap-4">
                      {order.buyer_profile?.avatar_url ? (
                        <img 
                          src={order.buyer_profile.avatar_url} 
                          alt={order.buyer_profile.name || 'Cliente'}
                          className="w-12 h-12 rounded-full object-cover border-2 border-blue-200"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-blue-200 rounded-full flex items-center justify-center">
                          <User className="h-6 w-6 text-blue-600" />
                        </div>
                      )}
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-3">
                          <h4 className="font-semibold text-blue-900 text-lg">Información del Cliente</h4>
                          {(order.buyer_profile?.phone || order.delivery_phone) && (
                            <Button
                              onClick={() => contactBuyer(order)}
                              className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                              size="sm"
                            >
                              <MessageCircle className="h-4 w-4 mr-2" />
                              WhatsApp
                            </Button>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div className="space-y-2">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Nombre:</span>
                              <span className="text-gray-700">{order.buyer_profile?.name || 'No disponible'}</span>
                            </div>
                            
                            {order.buyer_profile?.email && (
                              <div className="flex items-center gap-2">
                                <span className="font-medium">Email:</span>
                                <span className="text-gray-700">{order.buyer_profile.email}</span>
                              </div>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            {(order.buyer_profile?.phone || order.delivery_phone) ? (
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <span className="font-medium">Teléfono:</span>
                                <span className="text-gray-700">{order.buyer_profile?.phone || order.delivery_phone}</span>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 text-gray-500">
                                <Phone className="h-4 w-4" />
                                <span className="font-medium">Teléfono:</span>
                                <span className="italic">No registrado</span>
                              </div>
                            )}
                          </div>
                        </div>
                        
                        {order.delivery_address && (
                          <div className="mt-4 p-3 bg-white rounded border border-blue-200">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                              <div>
                                <span className="font-medium text-green-800">Dirección de entrega:</span>
                                <p className="text-gray-700 mt-1">{order.delivery_address}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Productos con personalización */}
                  <div>
                    <h4 className="font-semibold mb-3 text-gray-900">Productos del pedido:</h4>
                    <div className="space-y-3">
                      {order.order_items.map((item) => (
                        <div key={item.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-lg border">
                          {item.product.image_urls && item.product.image_urls[0] && (
                            <img
                              src={item.product.image_urls[0]}
                              alt={item.product.name}
                              className="w-20 h-20 object-cover rounded-lg border"
                            />
                          )}
                          <div className="flex-1">
                            <div className="flex items-start justify-between">
                              <div>
                                <p className="font-medium text-gray-900">{item.product.name}</p>
                                <p className="text-sm text-gray-600">
                                  Cantidad: {item.quantity} × S/{item.unit_price.toFixed(2)}
                                </p>
                                {item.product.is_customizable && item.customization_details && (
                                  <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded text-xs">
                                    <strong>Personalización:</strong>
                                    <pre className="whitespace-pre-wrap mt-1">
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
                                <p className="font-semibold text-lg text-gray-900">
                                  S/{item.total_price.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Información de envío */}
                  <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                    <h4 className="font-medium mb-3 text-purple-900">Información de Envío</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Número de seguimiento
                        </label>
                        <div className="flex gap-2">
                          <Input
                            value={order.tracking_number || ''}
                            onChange={(e) => {
                              const updatedOrder = { ...order, tracking_number: e.target.value };
                              setOrders(prev => prev.map(o => o.id === order.id ? updatedOrder : o));
                            }}
                            placeholder="Ingresa número de tracking"
                            className="flex-1"
                          />
                          <Button
                            onClick={() => updateTrackingNumber(order.id, order.tracking_number || '')}
                            size="sm"
                          >
                            Guardar
                          </Button>
                        </div>
                      </div>
                      
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Fecha estimada de entrega
                        </label>
                        <p className="text-gray-600">{order.estimated_delivery_date || 'No especificada'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Notas del cliente */}
                  {(order.customer_notes || order.delivery_notes) && (
                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                      <h4 className="font-medium mb-2 text-amber-900">Notas del cliente:</h4>
                      {order.customer_notes && (
                        <p className="text-amber-800 text-sm mb-2">
                          <strong>Notas del pedido:</strong> {order.customer_notes}
                        </p>
                      )}
                      {order.delivery_notes && (
                        <p className="text-amber-800 text-sm">
                          <strong>Notas de entrega:</strong> {order.delivery_notes}
                        </p>
                      )}
                    </div>
                  )}

                  {/* Totales y acciones */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                    <div className="space-y-1">
                      <p className="text-sm text-gray-600">Subtotal: S/{order.subtotal.toFixed(2)}</p>
                      <p className="text-sm text-gray-600">Envío: S/{order.shipping_cost.toFixed(2)}</p>
                      <p className="text-xl font-bold text-gray-900">Total: S/{order.total.toFixed(2)}</p>
                    </div>
                    <div className="flex gap-3 items-center">
                      <span className="text-sm text-gray-600">Estado:</span>
                      <Select
                        value={order.status}
                        onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
                      >
                        <SelectTrigger className="w-44">
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
                </CardContent>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewOrderManagement;
