
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { MessageCircle, Calendar, Users, Package, TrendingUp, Clock } from 'lucide-react';
import CRMChat from './CRMChat';
import OrderCalendar from './OrderCalendar';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  avatar_url: string | null;
  order_count: number;
  total_spent: number;
  last_order_date: string | null;
}

interface CRMDashboardProps {
  userId: string;
  userRole: 'buyer' | 'seller';
}

const CRMDashboard = ({ userId, userRole }: CRMDashboardProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    totalRevenue: 0,
    pendingOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (userRole === 'seller') {
      fetchCustomers();
      fetchStats();
    } else {
      // Para compradores, cargar sus propios datos
      fetchBuyerData();
    }
  }, [userId, userRole]);

  const fetchCustomers = async () => {
    try {
      // Obtener la tienda del vendedor
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (storeError) throw storeError;

      // Obtener clientes que han comprado en la tienda
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          buyer_id,
          total,
          created_at,
          buyer_profiles:buyer_id (
            name,
            email,
            phone,
            avatar_url
          )
        `)
        .eq('store_id', storeData.id);

      if (ordersError) throw ordersError;

      // Agrupar por cliente y calcular estadísticas
      const customerMap = new Map();
      
      ordersData?.forEach(order => {
        const customerId = order.buyer_id;
        const profile = order.buyer_profiles;
        
        if (!customerMap.has(customerId)) {
          customerMap.set(customerId, {
            id: customerId,
            name: profile?.name || 'Cliente',
            email: profile?.email || '',
            phone: profile?.phone || null,
            avatar_url: profile?.avatar_url || null,
            order_count: 0,
            total_spent: 0,
            last_order_date: null
          });
        }
        
        const customer = customerMap.get(customerId);
        customer.order_count += 1;
        customer.total_spent += Number(order.total);
        
        if (!customer.last_order_date || order.created_at > customer.last_order_date) {
          customer.last_order_date = order.created_at;
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error fetching customers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const { data: storeData } = await supabase
        .from('stores')
        .select('id')
        .eq('user_id', userId)
        .single();

      if (!storeData) return;

      const { data: orders, error } = await supabase
        .from('orders')
        .select('total, status')
        .eq('store_id', storeData.id);

      if (error) throw error;

      const totalOrders = orders?.length || 0;
      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const pendingOrders = orders?.filter(order => order.status === 'pending').length || 0;
      const uniqueCustomers = new Set(orders?.map(order => order.buyer_id)).size;

      setStats({
        totalCustomers: uniqueCustomers,
        totalOrders,
        totalRevenue,
        pendingOrders
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchBuyerData = async () => {
    try {
      // Para compradores, obtener sus propios pedidos y vendedores
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          stores:store_id (
            name,
            user_id,
            seller_profiles:user_id (
              name,
              email,
              phone,
              avatar_url
            )
          )
        `)
        .eq('buyer_id', userId);

      if (error) throw error;

      // Crear lista de vendedores con los que ha interactuado
      const sellerMap = new Map();
      
      orders?.forEach(order => {
        const store = order.stores;
        const sellerId = store?.user_id;
        const sellerProfile = store?.seller_profiles;
        
        if (!sellerMap.has(sellerId)) {
          sellerMap.set(sellerId, {
            id: sellerId,
            name: sellerProfile?.name || store?.name || 'Vendedor',
            email: sellerProfile?.email || '',
            phone: sellerProfile?.phone || null,
            avatar_url: sellerProfile?.avatar_url || null,
            order_count: 0,
            total_spent: 0,
            last_order_date: null
          });
        }
        
        const seller = sellerMap.get(sellerId);
        seller.order_count += 1;
        seller.total_spent += Number(order.total);
        
        if (!seller.last_order_date || order.created_at > seller.last_order_date) {
          seller.last_order_date = order.created_at;
        }
      });

      setCustomers(Array.from(sellerMap.values()));
      
      setStats({
        totalCustomers: sellerMap.size,
        totalOrders: orders?.length || 0,
        totalRevenue: orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0,
        pendingOrders: orders?.filter(order => order.status === 'pending').length || 0
      });
    } catch (error) {
      console.error('Error fetching buyer data:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los datos",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">
          {userRole === 'seller' ? 'CRM - Gestión de Clientes' : 'Mis Vendedores'}
        </h1>
        <p className="text-gray-600">
          {userRole === 'seller' 
            ? 'Administra la comunicación con tus clientes y planifica entregas'
            : 'Comunícate con tus vendedores y revisa el estado de tus pedidos'
          }
        </p>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'seller' ? 'Total Clientes' : 'Vendedores'}
                </p>
                <p className="text-2xl font-bold">{stats.totalCustomers}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <Package className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Total Pedidos</p>
                <p className="text-2xl font-bold">{stats.totalOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <TrendingUp className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {userRole === 'seller' ? 'Ingresos Totales' : 'Total Gastado'}
                </p>
                <p className="text-2xl font-bold">S/{stats.totalRevenue.toFixed(2)}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Pedidos Pendientes</p>
                <p className="text-2xl font-bold">{stats.pendingOrders}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs principales */}
      <Tabs defaultValue="chat" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="chat" className="flex items-center gap-2">
            <MessageCircle className="h-4 w-4" />
            Chat CRM
          </TabsTrigger>
          <TabsTrigger value="calendar" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            Calendario
          </TabsTrigger>
        </TabsList>

        <TabsContent value="chat" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Lista de contactos */}
            <Card>
              <CardHeader>
                <CardTitle>
                  {userRole === 'seller' ? 'Clientes' : 'Vendedores'}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <div className="max-h-96 overflow-y-auto">
                  {customers.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No hay contactos aún</p>
                    </div>
                  ) : (
                    customers.map((customer) => (
                      <div
                        key={customer.id}
                        className={`p-4 border-b cursor-pointer hover:bg-muted/50 ${
                          selectedCustomer?.id === customer.id ? 'bg-muted' : ''
                        }`}
                        onClick={() => setSelectedCustomer(customer)}
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-primary">
                              {getInitials(customer.name)}
                            </span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium truncate">{customer.name}</h4>
                            <p className="text-sm text-muted-foreground truncate">
                              {customer.email}
                            </p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {customer.order_count} pedidos
                              </Badge>
                              <span className="text-xs text-muted-foreground">
                                S/{customer.total_spent.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Chat */}
            <div className="lg:col-span-2">
              {selectedCustomer ? (
                <CRMChat
                  userId={userId}
                  contactId={selectedCustomer.id}
                  contactName={selectedCustomer.name}
                />
              ) : (
                <Card className="h-96">
                  <CardContent className="flex items-center justify-center h-full">
                    <div className="text-center text-muted-foreground">
                      <MessageCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>Selecciona un contacto para chatear</p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="calendar">
          <OrderCalendar userId={userId} userRole={userRole} />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default CRMDashboard;
