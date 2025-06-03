
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Package, Clock, CheckCircle, XCircle, User, Phone, MapPin, RefreshCw, Calendar, Mail, AlertTriangle } from 'lucide-react';

interface CustomerManagementProps {
  storeId: string;
}

interface Order {
  id: string;
  buyer_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'shipped' | 'delivered' | 'cancelled';
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
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
    email: string | null;
    address: string | null;
    avatar_url: string | null;
  };
}

const CustomerManagement = ({ storeId }: CustomerManagementProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
    
    // Configurar suscripción en tiempo real
    const channel = supabase
      .channel('customer-orders-realtime')
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
        description: "No se pudieron cargar los pedidos de clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const contactBuyer = (order: Order) => {
    // Priorizar teléfono de entrega, luego teléfono del perfil
    const phone = order.delivery_phone || order.buyer_profile?.phone;
    
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
    const orderId = order.id.slice(-6);
    const orderTotal = order.total.toFixed(2);
    const products = order.order_items.map(item => 
      `- ${item.product.name} (x${item.quantity})`
    ).join('\n');

    const message = `¡Hola ${customerName}! 👋\n\nTe contacto por tu pedido #${orderId}.\n\n📦 *Productos:*\n${products}\n\n💰 *Total:* S/${orderTotal}\n\n¿En qué puedo ayudarte?`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
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
            <p className="text-gray-500">Los pedidos confirmados aparecerán aquí para gestionar tus clientes</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6 max-h-[70vh] overflow-y-auto">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden border-l-4 border-l-blue-500">
              <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg text-blue-900">
                      Pedido #{order.id.slice(-6)}
                    </CardTitle>
                    <Badge className={`${getStatusColor(order.status)} border`}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-green-600">S/{order.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500 flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleDateString('es-PE')}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-6">
                {/* Información del Cliente Mejorada */}
                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 mb-6 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0">
                      {order.buyer_profile?.avatar_url ? (
                        <img 
                          src={order.buyer_profile.avatar_url} 
                          alt={order.buyer_profile.name || 'Cliente'}
                          className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
                        />
                      ) : (
                        <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
                          <User className="h-8 w-8 text-white" />
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
                          <User className="h-5 w-5" />
                          Información del Cliente
                        </h3>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Columna izquierda - Datos básicos */}
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center gap-2 mb-1">
                              <User className="h-4 w-4 text-blue-600" />
                              <span className="text-sm font-medium text-blue-800">Nombre:</span>
                            </div>
                            <p className="text-gray-900 font-semibold">
                              {order.buyer_profile?.name || 'No registrado'}
                            </p>
                          </div>
                          
                          {order.buyer_profile?.email && (
                            <div className="bg-white rounded-lg p-3 border border-blue-100">
                              <div className="flex items-center gap-2 mb-1">
                                <Mail className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Email:</span>
                              </div>
                              <p className="text-gray-700 text-sm">{order.buyer_profile.email}</p>
                            </div>
                          )}
                        </div>
                        
                        {/* Columna derecha - Contacto */}
                        <div className="space-y-3">
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-800">Teléfono:</span>
                              </div>
                            </div>
                            
                            {(order.delivery_phone || order.buyer_profile?.phone) ? (
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="text-gray-900 font-medium">
                                    {order.delivery_phone || order.buyer_profile?.phone}
                                  </p>
                                  {order.delivery_phone && order.buyer_profile?.phone && 
                                   order.delivery_phone !== order.buyer_profile.phone && (
                                    <p className="text-xs text-gray-500">
                                      Perfil: {order.buyer_profile.phone}
                                    </p>
                                  )}
                                </div>
                                <Button
                                  onClick={() => contactBuyer(order)}
                                  className="bg-green-600 hover:bg-green-700 text-white shadow-sm ml-2"
                                  size="sm"
                                >
                                  <MessageCircle className="h-4 w-4 mr-1" />
                                  WhatsApp
                                </Button>
                              </div>
                            ) : (
                              <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                                <AlertTriangle className="h-4 w-4 text-yellow-600" />
                                <span className="text-sm text-yellow-800 font-medium">
                                  Este cliente no tiene número de WhatsApp registrado
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {/* Direcciones */}
                      <div className="mt-4 space-y-2">
                        {order.delivery_address && (
                          <div className="bg-white rounded-lg p-3 border border-green-200">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                              <div className="flex-1">
                                <span className="text-sm font-medium text-green-800">Dirección de entrega:</span>
                                <p className="text-gray-900 mt-1">{order.delivery_address}</p>
                                {order.delivery_notes && (
                                  <p className="text-sm text-gray-600 mt-1 italic">
                                    Notas: {order.delivery_notes}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {order.buyer_profile?.address && order.delivery_address !== order.buyer_profile.address && (
                          <div className="bg-white rounded-lg p-3 border border-blue-100">
                            <div className="flex items-start gap-2">
                              <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                              <div>
                                <span className="text-sm font-medium text-blue-800">Dirección personal:</span>
                                <p className="text-gray-700 mt-1 text-sm">{order.buyer_profile.address}</p>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Productos resumidos */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h4 className="font-semibold mb-3 text-gray-900 flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    Productos ({order.order_items.length})
                  </h4>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {order.order_items.map((item) => (
                      <div key={item.id} className="flex justify-between items-center text-sm bg-white p-2 rounded border">
                        <span className="truncate font-medium">{item.product.name}</span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                    ))}
                  </div>
                  
                  {order.customer_notes && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded text-sm">
                      <strong className="text-yellow-800">Nota del cliente:</strong>
                      <p className="text-yellow-700 mt-1">{order.customer_notes}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
