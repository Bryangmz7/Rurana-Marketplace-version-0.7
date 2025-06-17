
import React from 'react';
import { Button } from '@/components/ui/button';
import ProductCard from '@/components/ProductCard';

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

interface ProductGridProps {
  products: Product[];
  filteredProducts: Product[];
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

const ProductGrid = ({ 
  products, 
  filteredProducts, 
  filters, 
  onFiltersChange, 
  onClearFilters 
}: ProductGridProps) => {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <p className="text-sm text-gray-600">
          {filteredProducts.length} de {products.length} productos
        </p>
        <select
          value={filters.sortBy}
          onChange={(e) => onFiltersChange({ ...filters, sortBy: e.target.value })}
          className="border border-gray-300 rounded-md px-3 py-1.5 text-sm"
        >
          <option value="relevance">Relevancia</option>
          <option value="newest">Más recientes</option>
          <option value="price_asc">Precio: Menor a mayor</option>
          <option value="price_desc">Precio: Mayor a menor</option>
          <option value="rating">Mejor calificados</option>
        </select>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredProducts.map((product) => (
          <ProductCard
            key={product.id}
            id={product.id}
            name={product.name}
            description={product.description || ''}
            price={product.price}
            image_urls={product.image_urls || []}
            category={product.category || 'Sin categoría'}
            delivery_time={product.delivery_time || 7}
            stock={product.stock}
            store_id={product.store.id}
            store_name={product.store?.name || 'Tienda'}
            store_rating={product.store?.rating || 0}
          />
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500">No se encontraron productos que coincidan con tu búsqueda.</p>
          <Button onClick={onClearFilters} variant="outline" className="mt-4" size="sm">
            Limpiar filtros
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductGrid;
