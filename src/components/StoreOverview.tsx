
import { useState, useEffect } from 'react';
import { supabase, notifySupabaseMissing } from '@/integrations/supabase/client';
import { Card } from '@/components/ui/card';
import { Package, DollarSign, Users, TrendingUp } from 'lucide-react';

interface StoreOverviewProps {
  storeId: string;
}

interface Stats {
  totalProducts: number;
  totalRevenue: number;
  totalCustomers: number;
  averageRating: number;
}

const StoreOverview = ({ storeId }: StoreOverviewProps) => {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    averageRating: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [storeId]);

  const fetchStats = async () => {
    if (!supabase) {
      notifySupabaseMissing();
      setLoading(false);
      return;
    }
    try {
      // Obtener total de productos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id')
        .eq('store_id', storeId);

      if (productsError) throw productsError;

      // Obtener órdenes completadas para calcular ingresos y clientes
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('total, buyer_id')
        .eq('store_id', storeId)
        .eq('status', 'completed');

      if (ordersError) throw ordersError;

      const totalRevenue = orders?.reduce((sum, order) => sum + Number(order.total), 0) || 0;
      const uniqueCustomers = new Set(orders?.map(order => order.buyer_id) || []).size;

      setStats({
        totalProducts: products?.length || 0,
        totalRevenue,
        totalCustomers: uniqueCustomers,
        averageRating: 4.8 // Por ahora fijo, se puede calcular cuando tengamos reseñas
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const statCards = [
    {
      title: 'Total Productos',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50'
    },
    {
      title: 'Ingresos Totales',
      value: `S/${stats.totalRevenue.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50'
    },
    {
      title: 'Clientes',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50'
    },
    {
      title: 'Calificación',
      value: stats.averageRating.toFixed(1),
      icon: TrendingUp,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50'
    }
  ];

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.bgColor} p-3 rounded-full`}>
                  <Icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Resumen de la tienda</h3>
        <div className="text-gray-600">
          <p className="mb-2">• Tu tienda está activa y visible en el marketplace</p>
          <p className="mb-2">• Productos más vendidos aparecerán aquí próximamente</p>
          <p>• Gestiona tus productos desde la pestaña "Productos"</p>
        </div>
      </Card>
    </div>
  );
};

export default StoreOverview;
