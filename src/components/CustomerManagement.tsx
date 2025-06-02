
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Search, User } from 'lucide-react';

interface Customer {
  id: string;
  name: string;
  email: string;
  totalOrders: number;
  totalSpent: number;
  lastOrderDate?: string;
}

interface CustomerManagementProps {
  storeId: string;
}

const CustomerManagement = ({ storeId }: CustomerManagementProps) => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCustomers();
  }, [storeId]);

  useEffect(() => {
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredCustomers(filtered);
  }, [customers, searchQuery]);

  const fetchCustomers = async () => {
    try {
      // Obtener órdenes de la tienda con información del comprador
      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          buyer_id,
          total,
          created_at,
          users!inner(id, name, email)
        `)
        .eq('store_id', storeId);

      if (error) throw error;

      // Agrupar por cliente y calcular estadísticas
      const customerMap = new Map<string, Customer>();
      
      orders?.forEach(order => {
        const buyerId = order.buyer_id;
        const user = order.users as any;
        
        if (!customerMap.has(buyerId)) {
          customerMap.set(buyerId, {
            id: buyerId,
            name: user.name || 'Usuario',
            email: user.email,
            totalOrders: 0,
            totalSpent: 0,
            lastOrderDate: order.created_at
          });
        }
        
        const customer = customerMap.get(buyerId)!;
        customer.totalOrders += 1;
        customer.totalSpent += Number(order.total);
        
        // Actualizar fecha de última orden si es más reciente
        if (new Date(order.created_at) > new Date(customer.lastOrderDate || '')) {
          customer.lastOrderDate = order.created_at;
        }
      });

      setCustomers(Array.from(customerMap.values()));
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Clientes de tu tienda</h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Buscar clientes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {filteredCustomers.length === 0 ? (
        <Card className="p-8 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {customers.length === 0 ? 'Aún no tienes clientes' : 'No se encontraron clientes'}
          </h3>
          <p className="text-gray-600">
            {customers.length === 0 
              ? 'Cuando alguien compre en tu tienda, aparecerá aquí.'
              : 'Intenta con otros términos de búsqueda.'
            }
          </p>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredCustomers.map((customer) => (
            <Card key={customer.id} className="p-6">
              <div className="flex justify-between items-start">
                <div>
                  <h4 className="font-semibold text-gray-900">{customer.name}</h4>
                  <p className="text-gray-600 text-sm">{customer.email}</p>
                  {customer.lastOrderDate && (
                    <p className="text-gray-500 text-xs mt-1">
                      Última compra: {new Date(customer.lastOrderDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-gray-600">Órdenes</p>
                      <p className="font-semibold">{customer.totalOrders}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Total gastado</p>
                      <p className="font-semibold text-green-600">S/{customer.totalSpent.toFixed(2)}</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
