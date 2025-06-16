
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import MarketplaceHeader from '@/components/MarketplaceHeader';
import MarketplaceLayout from '@/components/MarketplaceLayout';
import ImprovedCartSidebar from '@/components/ImprovedCartSidebar';
import { Button } from '@/components/ui/button';
import { ShoppingCart } from 'lucide-react';
import { useOptimizedCart } from '@/components/OptimizedCartContext';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  delivery_time: number;
  stock: number;
  created_at: string;
  store: {
    id: string;
    name: string;
    rating: number;
  };
}

interface FilterState {
  category: string;
  priceRange: [number, number];
  sortBy: string;
}

const Marketplace = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [cartOpen, setCartOpen] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    category: 'Todos',
    priceRange: [0, 1000],
    sortBy: 'relevance'
  });
  const { itemCount } = useOptimizedCart();

  const categories = ['Todos', 'Peluches', 'Arte Digital', 'Cerámica', 'Textil', 'Bordados'];

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [products, filters, searchQuery]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          store:stores(
            id,
            name,
            rating
          )
        `)
        .gt('stock', 0);

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...products];

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filters.category !== 'Todos') {
      filtered = filtered.filter(product => product.category === filters.category);
    }

    // Apply price range filter
    filtered = filtered.filter(product => 
      product.price >= filters.priceRange[0] && product.price <= filters.priceRange[1]
    );

    // Apply sorting
    switch (filters.sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price_desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
      case 'rating':
        filtered.sort((a, b) => (b.store?.rating || 0) - (a.store?.rating || 0));
        break;
      default:
        // relevance - sort by stock and rating
        filtered.sort((a, b) => {
          const scoreA = a.stock + (a.store?.rating || 0) * 10;
          const scoreB = b.stock + (b.store?.rating || 0) * 10;
          return scoreB - scoreA;
        });
    }

    setFilteredProducts(filtered);
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
      
      {/* Floating Cart Button */}
      <Button
        onClick={() => setCartOpen(true)}
        className="fixed top-20 right-6 z-40 rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all hover:scale-110"
      >
        <ShoppingCart className="h-6 w-6" />
        {itemCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center">
            {itemCount}
          </span>
        )}
      </Button>

      <MarketplaceHeader
        searchQuery={searchQuery}
        onSearchQueryChange={setSearchQuery}
        onSearch={handleSearch}
      />

      <MarketplaceLayout
        products={products}
        filteredProducts={filteredProducts}
        filters={filters}
        onFiltersChange={setFilters}
        categories={categories}
        onClearFilters={clearFilters}
      />
      
      <ImprovedCartSidebar isOpen={cartOpen} onClose={() => setCartOpen(false)} />
      <Footer />
    </div>
  );
};

export default Marketplace;
