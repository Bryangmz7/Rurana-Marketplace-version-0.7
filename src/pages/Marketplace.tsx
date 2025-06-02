
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import StoreCard from '@/components/StoreCard';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';

interface Store {
  id: string;
  name: string;
  description: string;
  rating: number;
  logo_url?: string;
  user_id: string;
}

const Marketplace = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [loading, setLoading] = useState(true);

  const categories = ['Todos', 'Peluches', 'Arte Digital', 'Cerámica', 'Textil', 'Bordados'];

  useEffect(() => {
    fetchStores();
  }, []);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select('*');
      
      if (error) throw error;
      setStores(data || []);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredStores = stores.filter(store => {
    if (selectedCategory === 'Todos') return true;
    // For now, we'll show all stores regardless of category
    // In the future, you can add category filtering based on store products
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Marketplace
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Descubre emprendedores verificados que crean productos únicos y personalizados
            </p>
            
            {/* Category Filter */}
            <div className="flex flex-wrap justify-center gap-4 mb-12">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant={selectedCategory === category ? "default" : "outline"}
                  className="rounded-full"
                  onClick={() => setSelectedCategory(category)}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
            {filteredStores.map((store) => (
              <StoreCard
                key={store.id}
                id={store.id}
                name={store.name}
                description={store.description || ''}
                rating={Number(store.rating) || 0}
                reviewCount={127} // Mock data for now
                location="Perú" // Mock data for now
                productCount={45} // Mock data for now
                imageUrl="/placeholder-store.jpg"
                category="Artesanía" // Mock data for now
              />
            ))}
          </div>
          
          {filteredStores.length === 0 && (
            <div className="text-center py-12">
              <p className="text-gray-500 text-lg">No se encontraron tiendas para esta categoría.</p>
            </div>
          )}
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Marketplace;
