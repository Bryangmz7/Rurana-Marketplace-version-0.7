
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Calendar, MapPin, Phone, User, Store, MessageCircle, Eye } from 'lucide-react';

interface OrderHistoryProps {
  userId: string;
}

interface Order {
  id: string;
  order_number: string;
  total: number;
  status: string;
  created_at: string;
  delivery_address: string | null;
  delivery_phone: string | null;
  customer_notes: string | null;
  store_id: string;
  buyer_id: string;
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
  store?: {
    id: string;
    name: string;
    logo_url: string | null;
  };
  buyer_profile?: {
    name: string;
    phone: string | null;
    email: string | null;
    avatar_url: string | null;
  };
  seller_profile?: {
    name: string;
    phone: string | null;
    email: string | null;
    business_name: string | null;
    avatar_url: string | null;
  };
}

const OrderHistory = ({ userId }: OrderHistoryProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchUserRoleAndOrders();
  }, [userId]);

  const fetchUserRoleAndOrders = async () => {
    try {
      setLoading(true);
      console.log('Fetching user role and orders for user:', userId);

      // Obtener el rol del usuario
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', userId)
        .single();

      if (userError) {
        console.error('Error fetching user role:', userError);
        throw userError;
      }

      const role = userData.role;
      setUserRole(role);
      console.log('User role:', role);

      // Obtener órdenes según el rol
      let ordersQuery;
      
      if (role === 'seller') {
        // Para vendedores: órdenes de sus tiendas
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', userId);

        if (!storeData || storeData.length === 0) {
          console.log('No stores found for seller');
          setOrders([]);
          return;
        }

        const storeIds = storeData.map(store => store.id);
        
        ordersQuery = supabase
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
            ),
            store:stores (
              id,
              name,
              logo_url
            )
          `)
          .in('store_id', storeIds);
      } else {
        // Para compradores: sus propias órdenes
        ordersQuery = supabase
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
            ),
            store:stores (
              id,
              name,
              logo_url
            )
          `)
          .eq('buyer_id', userId);
      }

      const { data: ordersData, error: ordersError } = await ordersQuery
        .order('created_at', { ascending: false });

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      console.log('Orders fetched:', ordersData?.length || 0);

      // Obtener información de perfiles para datos cruzados
      const ordersWithProfiles = await Promise.all(
        (ordersData || []).map(async (order) => {
          try {
            let additionalData = {};

            if (role === 'seller') {
              // Para vendedores, obtener información del comprador
              const { data: buyerProfile } = await supabase
                .from('buyer_profiles')
                .select('name, phone, email, avatar_url')
                .eq('user_id', order.buyer_id)
                .maybeSingle();

              additionalData = { buyer_profile: buyerProfile };
            } else {
              // Para compradores, obtener información del vendedor
              const { data: storeOwner } = await supabase
                .from('stores')
                .select('user_id')
                .eq('id', order.store_id)
                .single();

              if (storeOwner) {
                const { data: sellerProfile } = await supabase
                  .from('seller_profiles')
                  .select('name, phone, email, business_name, avatar_url')
                  .eq('user_id', storeOwner.user_id)
                  .maybeSingle();

                additionalData = { seller_profile: sellerProfile };
              }
            }

            return { ...order, ...additionalData };
          } catch (error) {
            console.error('Error fetching profile data for order:', order.id, error);
            return order;
          }
        })
      );

      setOrders(ordersWithProfiles);
    } catch (error: any) {
      console.error('Error in fetchUserRoleAndOrders:', error);
      toast({
        title: "Error",
        description: `No se pudieron cargar los pedidos: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-orange-100 text-orange-800';
      case 'completed': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'En Progreso';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };

  const contactPerson = (order: Order) => {
    const isSellerView = userRole === 'seller';
    const profile = isSellerView ? order.buyer_profile : order.seller_profile;
    const phone = isSellerView ? 
      (order.delivery_phone || profile?.phone) : 
      profile?.phone;
    
    if (!phone) {
      toast({
        title: "Sin número de contacto",
        description: `${isSellerView ? 'El comprador' : 'El vendedor'} no tiene número de WhatsApp registrado`,
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = phone.replace(/[^\d]/g, '');
    let whatsappNumber = cleanPhone;
    if (!whatsappNumber.startsWith('51') && whatsappNumber.length === 9) {
      whatsappNumber = '51' + whatsappNumber;
    }

    const personName = profile?.name || (isSellerView ? 'Cliente' : 'Vendedor');
    const orderId = order.order_number || order.id.slice(-6);
    const message = `Hola ${personName}! Te contacto por el pedido #${orderId}. ¿En qué puedo ayudarte?`;
    
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
          <h2 className="text-2xl font-bold text-gray-900">
            {userRole === 'seller' ? 'Pedidos Recibidos' : 'Mis Pedidos'}
          </h2>
          <p className="text-gray-600">
            {userRole === 'seller' 
              ? 'Gestiona los pedidos de tus clientes' 
              : 'Revisa el estado de tus compras'
            }
          </p>
        </div>
        <Button onClick={fetchUserRoleAndOrders} variant="outline">
          <Package className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      {orders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Package className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {userRole === 'seller' ? 'No hay pedidos recibidos' : 'No hay pedidos'}
            </h3>
            <p className="text-gray-600">
              {userRole === 'seller' 
                ? 'Los pedidos aparecerán aquí cuando los clientes realicen compras'
                : 'Tus pedidos aparecerán aquí cuando realices compras'
              }
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-lg">
                      Pedido #{order.order_number || order.id.slice(-6)}
                    </CardTitle>
                    <CardDescription className="flex items-center gap-2 mt-1">
                      <Calendar className="h-4 w-4" />
                      {new Date(order.created_at).toLocaleString('es-PE')}
                    </CardDescription>
                  </div>
                  <Badge className={getStatusColor(order.status)}>
                    {getStatusText(order.status)}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Información de la contraparte (comprador o vendedor) */}
                {userRole === 'seller' && order.buyer_profile && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                      <User className="h-4 w-4" />
                      Información del Comprador
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Nombre:</span> {order.buyer_profile.name}
                      </div>
                      {order.buyer_profile.email && (
                        <div>
                          <span className="font-medium">Email:</span> {order.buyer_profile.email}
                        </div>
                      )}
                      {(order.delivery_phone || order.buyer_profile.phone) && (
                        <div>
                          <span className="font-medium">Teléfono:</span> {order.delivery_phone || order.buyer_profile.phone}
                        </div>
                      )}
                    </div>
                    {(order.delivery_phone || order.buyer_profile.phone) && (
                      <Button
                        onClick={() => contactPerson(order)}
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contactar por WhatsApp
                      </Button>
                    )}
                  </div>
                )}

                {userRole === 'buyer' && order.seller_profile && (
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="font-medium text-green-900 mb-2 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Información del Vendedor
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="font-medium">Vendedor:</span> {order.seller_profile.name}
                      </div>
                      {order.seller_profile.business_name && (
                        <div>
                          <span className="font-medium">Negocio:</span> {order.seller_profile.business_name}
                        </div>
                      )}
                      {order.seller_profile.email && (
                        <div>
                          <span className="font-medium">Email:</span> {order.seller_profile.email}
                        </div>
                      )}
                      {order.seller_profile.phone && (
                        <div>
                          <span className="font-medium">Teléfono:</span> {order.seller_profile.phone}
                        </div>
                      )}
                    </div>
                    {order.seller_profile.phone && (
                      <Button
                        onClick={() => contactPerson(order)}
                        className="mt-3 bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        <MessageCircle className="h-4 w-4 mr-2" />
                        Contactar por WhatsApp
                      </Button>
                    )}
                  </div>
                )}

                {/* Información de la tienda */}
                {order.store && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2 flex items-center gap-2">
                      <Store className="h-4 w-4" />
                      Tienda
                    </h4>
                    <div className="flex items-center gap-3">
                      {order.store.logo_url && (
                        <img
                          src={order.store.logo_url}
                          alt={order.store.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      )}
                      <span className="font-medium">{order.store.name}</span>
                    </div>
                  </div>
                )}

                {/* Productos */}
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Productos:</h4>
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
                            {item.quantity} × S/{item.unit_price.toFixed(2)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">
                            S/{(item.quantity * item.unit_price).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Información de entrega */}
                {order.delivery_address && (
                  <div className="bg-amber-50 p-4 rounded-lg">
                    <h4 className="font-medium text-amber-900 mb-2 flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Dirección de entrega
                    </h4>
                    <p className="text-amber-800">{order.delivery_address}</p>
                    {order.delivery_phone && (
                      <p className="text-sm text-amber-700 mt-1">
                        <Phone className="h-3 w-3 inline mr-1" />
                        {order.delivery_phone}
                      </p>
                    )}
                  </div>
                )}

                {/* Notas del cliente */}
                {order.customer_notes && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="font-medium text-blue-900 mb-2">Notas del cliente:</h4>
                    <p className="text-blue-800 text-sm">{order.customer_notes}</p>
                  </div>
                )}

                {/* Total */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <span className="text-lg font-bold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    S/{order.total.toFixed(2)}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
