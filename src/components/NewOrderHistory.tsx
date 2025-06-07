import React, { useState, useEffect } from 'react';
import { supabase, notifySupabaseMissing } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Package, Clock, CheckCircle, XCircle, RefreshCw, ShoppingBag, Calendar } from 'lucide-react';

interface Order {
  id: string;
  order_number: string;
  store_id: string;
  total: number;
  subtotal: number;
  shipping_cost: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'cancelled' | 'shipped' | 'delivered';
  delivery_address: string | null;
  customer_notes: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    total_price: number;
    product: {
      id: string;
      name: string;
      image_urls: string[] | null;
    };
  }>;
  store?: {
    name: string;
    logo_url: string | null;
  };
}

const NewOrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all');
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    if (!supabase) {
      notifySupabaseMissing();
      setLoading(false);
      return;
    }
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        console.log('No user found');
        setLoading(false);
        return;
      }

      console.log('Fetching orders for user:', user.id);

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
          ),
          store:stores (
            name,
            logo_url
          )
        `)
        .eq('buyer_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching orders:', error);
        throw error;
      }

      console.log('Orders fetched successfully:', data?.length || 0);

      const ordersWithCorrectTypes = (data || []).map(order => ({
        ...order,
        status: order.status as Order['status'],
        store: Array.isArray(order.store) ? order.store[0] : order.store
      }));

      setOrders(ordersWithCorrectTypes);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar tus pedidos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const filteredOrders = filter === 'all'
    ? orders
    : orders.filter(order => {
        if (filter === 'pending') return order.status === 'pending';
        if (filter === 'confirmed') return order.status === 'confirmed';
        if (filter === 'completed') return order.status === 'delivered' || order.status === 'cancelled';
        return true;
      });

  const getStatusColor = (status: Order['status']) => {
    switch (status) {
      case 'pending': return 'bg-gray-100 text-gray-800';
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
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'confirmed': return <ShoppingBag className="h-4 w-4" />;
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
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Historial de Pedidos</h2>
          <p className="text-gray-600">Revisa el estado de tus pedidos y detalles</p>
        </div>
        <Button onClick={fetchOrders} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Actualizar
        </Button>
      </div>

      <div className="flex items-center space-x-4">
        <Button variant={filter === 'all' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('all')}>
          Todos
        </Button>
        <Button variant={filter === 'pending' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('pending')}>
          Pendientes
        </Button>
        <Button variant={filter === 'confirmed' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('confirmed')}>
          Confirmados
        </Button>
        <Button variant={filter === 'completed' ? 'default' : 'outline'} size="sm" onClick={() => setFilter('completed')}>
          Completados
        </Button>
      </div>

      {filteredOrders.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <ShoppingBag className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No has realizado ningún pedido</h3>
            <p className="text-gray-500">Explora los productos y realiza tu primera compra</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredOrders.map((order) => (
            <Card key={order.id} className="overflow-hidden">
              <CardHeader className="bg-gray-50 border-b">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-lg">
                      Pedido #{order.order_number}
                    </CardTitle>
                    <Badge className={getStatusColor(order.status)}>
                      {getStatusIcon(order.status)}
                      <span className="ml-1 capitalize">{order.status}</span>
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-2xl font-bold text-green-600">S/{order.total.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">
                      <Calendar className="h-3 w-3 inline-block mr-1" />
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
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default NewOrderHistory;
