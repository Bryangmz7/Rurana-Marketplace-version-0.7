
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Phone, Mail, User, MapPin, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Customer {
  id: string;
  buyer_id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  total_orders: number;
  total_spent: number;
  last_order_date: string;
}

interface CustomerManagementProps {
  storeId: string;
}

const CustomerManagement = ({ storeId }: CustomerManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (storeId) {
      fetchCustomers();
    }
  }, [storeId]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      console.log('Fetching customers for store:', storeId);

      // Primero obtenemos los pedidos con información básica
      const { data: ordersData, error: ordersError } = await supabase
        .from('orders')
        .select(`
          buyer_id,
          total,
          created_at,
          delivery_address,
          delivery_phone
        `)
        .eq('store_id', storeId);

      if (ordersError) {
        console.error('Error fetching orders:', ordersError);
        throw ordersError;
      }

      if (!ordersData || ordersData.length === 0) {
        console.log('No orders found for this store');
        setCustomers([]);
        return;
      }

      // Agrupar por buyer_id y calcular estadísticas
      const customerStats = ordersData.reduce((acc: any, order) => {
        const buyerId = order.buyer_id;
        if (!acc[buyerId]) {
          acc[buyerId] = {
            buyer_id: buyerId,
            total_orders: 0,
            total_spent: 0,
            last_order_date: order.created_at,
            delivery_address: order.delivery_address,
            delivery_phone: order.delivery_phone
          };
        }
        
        acc[buyerId].total_orders += 1;
        acc[buyerId].total_spent += parseFloat(String(order.total || 0));
        
        // Mantener la fecha más reciente
        if (new Date(order.created_at) > new Date(acc[buyerId].last_order_date)) {
          acc[buyerId].last_order_date = order.created_at;
          acc[buyerId].delivery_address = order.delivery_address;
          acc[buyerId].delivery_phone = order.delivery_phone;
        }
        
        return acc;
      }, {});

      // Obtener información de perfiles de usuarios
      const buyerIds = Object.keys(customerStats);
      const customersList: Customer[] = [];

      for (const buyerId of buyerIds) {
        try {
          // Intentar obtener del perfil de comprador
          const { data: buyerProfile } = await supabase
            .from('buyer_profiles')
            .select('name, email, phone, address')
            .eq('user_id', buyerId)
            .single();

          // Si no encontramos perfil de comprador, intentar con users
          let userInfo = buyerProfile;
          if (!userInfo) {
            const { data: userData } = await supabase
              .from('users')
              .select('name, email')
              .eq('id', buyerId)
              .single();
            
            userInfo = {
              name: userData?.name || 'Cliente sin nombre',
              email: userData?.email || 'Email no disponible',
              phone: 'Teléfono no disponible',
              address: 'Dirección no disponible'
            };
          }

          const stats = customerStats[buyerId];
          customersList.push({
            id: `customer-${buyerId}`,
            buyer_id: buyerId,
            name: userInfo?.name || 'Cliente sin nombre',
            email: userInfo?.email || 'Email no disponible',
            phone: userInfo?.phone || stats.delivery_phone || 'Teléfono no disponible',
            address: userInfo?.address || stats.delivery_address || 'Dirección no disponible',
            total_orders: stats.total_orders,
            total_spent: stats.total_spent,
            last_order_date: stats.last_order_date
          });
        } catch (error) {
          console.error(`Error fetching profile for buyer ${buyerId}:`, error);
          // Agregar cliente con información limitada
          const stats = customerStats[buyerId];
          customersList.push({
            id: `customer-${buyerId}`,
            buyer_id: buyerId,
            name: 'Cliente sin nombre',
            email: 'Email no disponible',
            phone: stats.delivery_phone || 'Teléfono no disponible',
            address: stats.delivery_address || 'Dirección no disponible',
            total_orders: stats.total_orders,
            total_spent: stats.total_spent,
            last_order_date: stats.last_order_date
          });
        }
      }

      console.log('Customers processed:', customersList.length);
      setCustomers(customersList);

    } catch (error: any) {
      console.error('Error in fetchCustomers:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los clientes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const openWhatsApp = (phone: string, customerName: string) => {
    if (!phone || phone === 'Teléfono no disponible') {
      toast({
        title: "Teléfono no disponible",
        description: "Este cliente no tiene un número de teléfono registrado",
        variant: "destructive",
      });
      return;
    }

    // Limpiar el número de teléfono
    const cleanPhone = phone.replace(/\D/g, '');
    const message = encodeURIComponent(`Hola ${customerName}, gracias por tu compra en nuestra tienda. ¿En qué podemos ayudarte?`);
    const whatsappUrl = `https://wa.me/${cleanPhone}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Gestión de Clientes</h2>
        <div className="flex items-center justify-center h-32">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold">Gestión de Clientes</h2>
          <p className="text-gray-600 mt-1">Administra y comunícate con tus clientes</p>
        </div>
        <div className="bg-blue-50 px-4 py-2 rounded-lg">
          <span className="text-sm font-medium text-blue-700">
            Total: {customers.length} clientes
          </span>
        </div>
      </div>

      {customers.length === 0 ? (
        <Card>
          <CardContent className="p-8 text-center">
            <User className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No tienes clientes aún
            </h3>
            <p className="text-gray-500">
              Los clientes aparecerán aquí una vez que realicen pedidos en tu tienda.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer) => (
            <Card key={customer.id} className="hover:shadow-lg transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="bg-blue-100 p-2 rounded-full">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{customer.name}</CardTitle>
                      <CardDescription className="text-sm">
                        Cliente desde {new Date(customer.last_order_date).toLocaleDateString()}
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* Información del Cliente */}
                <div className="bg-gray-50 p-3 rounded-lg space-y-2">
                  <h4 className="font-medium text-gray-900 text-sm mb-2">Información del Cliente</h4>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{customer.name}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Phone className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{customer.phone}</span>
                  </div>
                  
                  <div className="flex items-center space-x-2 text-sm">
                    <Mail className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700 truncate">{customer.email}</span>
                  </div>
                  
                  {customer.address && customer.address !== 'Dirección no disponible' && (
                    <div className="flex items-start space-x-2 text-sm">
                      <MapPin className="h-4 w-4 text-gray-500 mt-0.5" />
                      <span className="text-gray-700 text-xs leading-tight">{customer.address}</span>
                    </div>
                  )}
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{customer.total_orders}</p>
                    <p className="text-xs text-green-700">Pedidos</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">S/{customer.total_spent.toFixed(2)}</p>
                    <p className="text-xs text-blue-700">Total gastado</p>
                  </div>
                </div>

                {/* Botón de WhatsApp */}
                <Button 
                  onClick={() => openWhatsApp(customer.phone, customer.name)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  disabled={!customer.phone || customer.phone === 'Teléfono no disponible'}
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Contactar por WhatsApp
                  <ExternalLink className="h-4 w-4 ml-2" />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
