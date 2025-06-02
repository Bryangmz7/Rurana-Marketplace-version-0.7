
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import StoreCard from '@/components/StoreCard';
import Footer from '@/components/Footer';
import MarketplaceFilters from '@/components/MarketplaceFilters';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  description: string;
  rating: number;
  logo_url?: string;
  user_id: string;
  product_count?: number;
}

interface FilterState {
  category: string;
  priceRange: [number, number];
  sortBy: string;
}

const Marketplace = () => {
  const [stores, setStores] = useState<Store[]>([]);
  const [filteredStores, setFilteredStores] = useState<Store[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [filters, setFilters] = useState<FilterState>({
    category: 'Todos',
    priceRange: [0, 1000],
    sortBy: 'relevance'
  });

  const categories = ['Todos', 'Peluches', 'Arte Digital', 'Cerámica', 'Textil', 'Bordados'];

  useEffect(() => {
    fetchStores();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [stores, filters, searchQuery]);

  const fetchStores = async () => {
    try {
      const { data, error } = await supabase
        .from('stores')
        .select(`
          *,
          products(count)
        `);
      
      if (error) throw error;
      
      // Add product count to each store
      const storesWithCount = data?.map(store => ({
        ...store,
        product_count: store.products?.[0]?.count || 0
      })) || [];
      
      setStores(storesWithCount);
    } catch (error) {
      console.error('Error fetching stores:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...stores];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(store =>
        store.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        store.description?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category !== 'Todos') {
      // For now, we'll show all stores since we don't have category in stores table
      // In a real implementation, you'd filter by store category or product categories
    }

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => (a.rating || 0) - (b.rating || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at || '').getTime() - new Date(a.created_at || '').getTime());
        break;
      default:
        // relevance - sort by rating
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    }

    setFilteredStores(filtered);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    applyFilters();
  };

  const clearFilters = () => {
    setFilters({
      category: 'Todos',
      priceRange: [0, 1000],
      sortBy: 'relevance'
    });
    setSearchQuery('');
  };

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
      
      <section className="py-8 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Marketplace
            </h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
              Descubre emprendedores verificados que crean productos únicos y personalizados
            </p>
            
            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-md mx-auto mb-8">
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
                </div>
                <Input
                  type="text"
                  placeholder="Buscar tiendas o productos..."
                  className="pl-10 w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Button type="submit" className="absolute inset-y-0 right-0 px-4">
                  Buscar
                </Button>
              </div>
            </form>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-1/4">
              <MarketplaceFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={categories}
                onClearFilters={clearFilters}
                resultCount={filteredStores.length}
              />
            </div>

            {/* Main Content */}
            <div className="lg:w-3/4">
              <div className="flex justify-between items-center mb-6">
                <p className="text-gray-600">
                  Mostrando {filteredStores.length} de {stores.length} tiendas
                </p>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}
                  className="border border-gray-300 rounded-md px-3 py-2"
                >
                  <option value="relevance">Relevancia</option>
                  <option value="newest">Más recientes</option>
                  <option value="price_desc">Mayor calificación</option>
                  <option value="price_asc">Menor calificación</option>
                </select>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStores.map((store) => (
                  <StoreCard
                    key={store.id}
                    id={store.id}
                    name={store.name}
                    description={store.description || ''}
                    rating={Number(store.rating) || 0}
                    reviewCount={127} // Mock data for now
                    location="Perú" // Mock data for now
                    productCount={store.product_count || 0}
                    imageUrl="/placeholder-store.jpg"
                    category="Artesanía" // Mock data for now
                  />
                ))}
              </div>
              
              {filteredStores.length === 0 && (
                <div className="text-center py-12">
                  <p className="text-gray-500 text-lg">No se encontraron tiendas que coincidan con tu búsqueda.</p>
                  <Button onClick={clearFilters} variant="outline" className="mt-4">
                    Limpiar filtros
                  </Button>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  );
};

export default Marketplace;
