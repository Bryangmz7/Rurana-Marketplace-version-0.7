
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Package, Clock, CheckCircle, XCircle, User, Phone, MapPin, Calendar } from 'lucide-react';

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
    email: string | null;
    address: string | null;
    avatar_url: string | null;
  };
}

const OrdersList = ({ storeId }: { storeId: string }) => {
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
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener información completa de los compradores
      const ordersWithBuyers = await Promise.all(
        (data || []).map(async (order) => {
          try {
            // Primero intentar obtener buyer_profile
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

            // Si tampoco hay seller_profile, obtener de users
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
            console.error('Error fetching buyer profile:', error);
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
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'completed': return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: Order['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <Package className="h-4 w-4" />;
      case 'in_progress': return <Clock className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <Package className="h-4 w-4" />;
    }
  };

  const getStatusText = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const contactBuyer = (order: Order) => {
    const phone = order.buyer_profile?.phone;
    if (!phone) {
      toast({
        title: "Sin número de contacto",
        description: "Este comprador no tiene número de WhatsApp registrado",
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
    const orderId = order.id.slice(-6);
    const orderTotal = order.total.toFixed(2);
    const orderDate = new Date(order.created_at).toLocaleDateString('es-PE');
    const products = order.order_items.map(item => 
      `- ${item.product.name} (x${item.quantity})`
    ).join('\n');

    const message = `¡Hola ${customerName}! 👋\n\nTe contacto por tu pedido #${orderId} realizado el ${orderDate}.\n\n📦 *Productos:*\n${products}\n\n💰 *Total:* S/${orderTotal}\n\n¿En qué puedo ayudarte con tu pedido?`;
    
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
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Gestión de Pedidos</h2>
          <p className="text-gray-600">Administra todos los pedidos de tu tienda</p>
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
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <CardTitle className="text-lg">
                        Pedido #{order.id.slice(-6)}
                      </CardTitle>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <Calendar className="h-4 w-4" />
                        {new Date(order.created_at).toLocaleString('es-PE')}
                      </div>
                    </div>
                  </div>
                  <Badge className={`${getStatusColor(order.status)} border`}>
                    {getStatusIcon(order.status)}
                    <span className="ml-1">{getStatusText(order.status)}</span>
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-6">
                {/* Información del cliente mejorada */}
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
                      <div className="flex items-center gap-2 mb-3">
                        <h4 className="font-semibold text-blue-900 text-lg">Información del Cliente</h4>
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
                          {order.buyer_profile?.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-blue-600" />
                              <span className="font-medium">Teléfono:</span>
                              <span className="text-gray-700">{order.buyer_profile.phone}</span>
                            </div>
                          )}
                          
                          {order.buyer_profile?.address && (
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <span className="font-medium">Dirección personal:</span>
                                <p className="text-gray-700">{order.buyer_profile.address}</p>
                              </div>
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
                      
                      {order.buyer_profile?.phone && (
                        <div className="mt-4">
                          <Button
                            onClick={() => contactBuyer(order)}
                            className="bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            size="sm"
                          >
                            <MessageCircle className="h-4 w-4 mr-2" />
                            Contactar por WhatsApp
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Productos */}
                <div>
                  <h4 className="font-semibold mb-3 text-gray-900">Productos del pedido:</h4>
                  <div className="space-y-3">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
                        {item.product.image_urls && item.product.image_urls[0] && (
                          <img
                            src={item.product.image_urls[0]}
                            alt={item.product.name}
                            className="w-16 h-16 object-cover rounded-lg border"
                          />
                        )}
                        <div className="flex-1">
                          <p className="font-medium text-gray-900">{item.product.name}</p>
                          <p className="text-sm text-gray-600">
                            Cantidad: {item.quantity} × S/{item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-lg text-gray-900">
                            S/{(item.quantity * item.unit_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {order.notes && (
                  <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                    <h4 className="font-medium mb-2 text-amber-900">Notas del cliente:</h4>
                    <p className="text-amber-800 text-sm">{order.notes}</p>
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
                      onValueChange={(value: Order['status']) => updateOrderStatus(order.id, value)}
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
          ))}
        </div>
      )}
    </div>
  );
};

export default OrdersList;
