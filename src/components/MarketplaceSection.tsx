
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import ImprovedStoreCard from './ImprovedStoreCard';
import { Button } from '@/components/ui/button';
import { Store } from '@/types/store';
import { Skeleton } from '@/components/ui/skeleton';

const MarketplaceSection = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStores = async () => {
      setLoading(true);
      const { data, error } = await supabase
        .from('stores')
        .select('*, products(count)')
        .order('rating', { ascending: false })
        .limit(3);

      if (error) {
        console.error('Error fetching featured stores:', error);
        setStores([]);
      } else if (data) {
        const storesWithCount = data.map((store: any) => ({
          ...store,
          product_count: store.products[0]?.count ?? 0,
          // Supabase returns an array for the count relation
          products: undefined, 
        }));
        setStores(storesWithCount);
      }
      setLoading(false);
    };

    fetchStores();
  }, []);

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Tiendas Destacadas
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubre emprendedores verificados que crean productos únicos y personalizados
          </p>
          
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button variant="default" className="rounded-full">Todos</Button>
            <Button variant="outline" className="rounded-full">Peluches</Button>
            <Button variant="outline" className="rounded-full">Arte Digital</Button>
            <Button variant="outline" className="rounded-full">Cerámica</Button>
            <Button variant="outline" className="rounded-full">Textil</Button>
            <Button variant="outline" className="rounded-full">Bordados</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {loading ? (
            Array.from({ length: 3 }).map((_, index) => (
              <CardSkeleton key={index} />
            ))
          ) : stores.length > 0 ? (
            stores.map((store) => (
              <ImprovedStoreCard key={store.id} store={store} />
            ))
          ) : (
            <p className="col-span-3 text-center text-gray-500">No se encontraron tiendas destacadas.</p>
          )}
        </div>
        
        <div className="text-center">
          <Button size="lg" variant="outline" className="rounded-xl">
            Ver todas las tiendas
          </Button>
        </div>
      </div>
    </section>
  );
};

const CardSkeleton = () => (
  <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
    <Skeleton className="h-48 w-full" />
    <div className="p-6 space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-32" />
            <Skeleton className="h-4 w-16" />
          </div>
        </div>
        <Skeleton className="h-6 w-20 rounded-full" />
      </div>
      <div className="space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
      </div>
      <div className="flex gap-2 pt-2">
        <Skeleton className="h-9 w-1/2" />
        <Skeleton className="h-9 w-1/2" />
      </div>
    </div>
  </div>
);

export default MarketplaceSection;
