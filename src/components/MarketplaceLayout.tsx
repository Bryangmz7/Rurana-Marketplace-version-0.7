
import React from 'react';
import MarketplaceFilters from '@/components/MarketplaceFilters';
import ProductGrid from '@/components/ProductGrid';

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

interface MarketplaceLayoutProps {
  products: Product[];
  filteredProducts: Product[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  onClearFilters: () => void;
}

const MarketplaceLayout = ({
  products,
  filteredProducts,
  filters,
  onFiltersChange,
  categories,
  onClearFilters
}: MarketplaceLayoutProps) => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="lg:w-1/4">
          <MarketplaceFilters
            filters={filters}
            onFiltersChange={onFiltersChange}
            categories={categories}
            onClearFilters={onClearFilters}
            resultCount={filteredProducts.length}
          />
        </div>

        {/* Main Content */}
        <ProductGrid
          products={products}
          filteredProducts={filteredProducts}
          filters={filters}
          onFiltersChange={onFiltersChange}
          onClearFilters={onClearFilters}
        />
      </div>
    </div>
  );
};

export default MarketplaceLayout;
