import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, User, MessageSquare, Calendar, DollarSign } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import type { Database } from '@/integrations/supabase/types';

type OrderStatus = Database['public']['Enums']['order_status'];

interface Order {
  id: string;
  buyer_id: string;
  total: number;
  status: OrderStatus;
  created_at: string;
  delivery_address: string;
  notes: string;
  buyer_profile: {
    name: string;
    email: string;
    phone: string;
  };
  order_items: {
    quantity: number;
    unit_price: number;
    products: {
      name: string;
      image_urls: string[];
    };
  }[];
}

interface ConfirmedOrdersProps {
  storeId: string;
}

const ConfirmedOrders = ({ storeId }: ConfirmedOrdersProps) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchConfirmedOrders();
  }, [storeId]);

  const fetchConfirmedOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            quantity,
            unit_price,
            products (
              name,
              image_urls
            )
          )
        `)
        .eq('store_id', storeId)
        .eq('status', 'confirmed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Obtener los perfiles de buyer por separado
      const buyerIds = data?.map(order => order.buyer_id) || [];
      const { data: buyerProfiles, error: profileError } = await supabase
        .from('buyer_profiles')
        .select('user_id, name, email, phone')
        .in('user_id', buyerIds);

      if (profileError) throw profileError;

      // Combinar los datos
      const transformedOrders = data?.map(order => ({
        ...order,
        buyer_profile: buyerProfiles?.find(profile => profile.user_id === order.buyer_id) || {
          name: 'Cliente desconocido',
          email: '',
          phone: ''
        }
      })) || [];
      
      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching confirmed orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los pedidos confirmados",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: OrderStatus) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus })
        .eq('id', orderId);

      if (error) throw error;

      await fetchConfirmedOrders();
      toast({
        title: "Estado actualizado",
        description: `El pedido se ha marcado como ${newStatus}`,
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

  const openWhatsApp = (order: Order) => {
    if (!order.buyer_profile.phone) {
      toast({
        title: "Número no disponible",
        description: "El cliente no ha proporcionado un número de teléfono",
        variant: "destructive",
      });
      return;
    }

    // Limpiar el número de teléfono (quitar espacios y caracteres especiales)
    const cleanPhone = order.buyer_profile.phone.replace(/[^\d]/g, '');
    
    // Asegurar que el número tenga el código de país peruano (+51)
    let whatsappNumber = cleanPhone;
    if (!whatsappNumber.startsWith('51') && whatsappNumber.length === 9) {
      whatsappNumber = '51' + whatsappNumber;
    }

    // Crear el mensaje para WhatsApp
    const message = `Hola ${order.buyer_profile.name}, este es el vendedor de tu pedido #${order.id.slice(0, 8)}. Tu pedido por S/${order.total} está confirmado y en proceso. ¿Hay algo específico que necesites saber sobre la entrega?`;
    
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  const getStatusColor = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: OrderStatus) => {
    switch (status) {
      case 'confirmed': return 'Confirmado';
      case 'in_progress': return 'En Proceso';
      case 'completed': return 'Completado';
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

  if (orders.length === 0) {
    return (
      <Card className="p-8 text-center">
        <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          No hay pedidos confirmados
        </h3>
        <p className="text-gray-600">
          Cuando los clientes confirmen sus compras aparecerán aquí.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Pedidos Confirmados</h3>
        <Badge variant="secondary">
          {orders.length} pedido{orders.length !== 1 ? 's' : ''}
        </Badge>
      </div>

      <div className="grid gap-6">
        {orders.map((order) => (
          <Card key={order.id} className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-gray-500" />
                <div>
                  <h4 className="font-semibold">{order.buyer_profile?.name}</h4>
                  <p className="text-sm text-gray-600">{order.buyer_profile?.email}</p>
                  {order.buyer_profile?.phone && (
                    <p className="text-sm text-gray-500">Tel: {order.buyer_profile.phone}</p>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getStatusColor(order.status)}>
                  {getStatusText(order.status)}
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => openWhatsApp(order)}
                  disabled={!order.buyer_profile.phone}
                  className="text-green-600 border-green-600 hover:bg-green-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  WhatsApp
                </Button>
              </div>
            </div>

            {!order.buyer_profile.phone && (
              <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm text-yellow-800">
                  ⚠️ El cliente no ha proporcionado un número de teléfono. No se puede contactar por WhatsApp.
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4" />
                {new Date(order.created_at).toLocaleDateString('es-ES')}
              </div>
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <DollarSign className="h-4 w-4" />
                Total: S/{order.total}
              </div>
            </div>

            {order.delivery_address && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Dirección de entrega:</p>
                <p className="text-sm text-gray-600">{order.delivery_address}</p>
              </div>
            )}

            {order.notes && (
              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700">Notas del cliente:</p>
                <p className="text-sm text-gray-600">{order.notes}</p>
              </div>
            )}

            <div className="mb-4">
              <p className="text-sm font-medium text-gray-700 mb-2">Productos:</p>
              <div className="space-y-2">
                {order.order_items?.map((item, index) => (
                  <div key={index} className="flex items-center gap-3 text-sm">
                    <span className="font-medium">{item.quantity}x</span>
                    <span>{item.products?.name}</span>
                    <span className="text-gray-500">S/{item.unit_price}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              {order.status === 'confirmed' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'in_progress')}
                  className="bg-yellow-600 hover:bg-yellow-700"
                >
                  Marcar en Proceso
                </Button>
              )}
              {order.status === 'in_progress' && (
                <Button
                  size="sm"
                  onClick={() => updateOrderStatus(order.id, 'completed')}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Marcar Completado
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConfirmedOrders;
