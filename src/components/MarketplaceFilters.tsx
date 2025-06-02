
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X } from 'lucide-react';

interface FilterState {
  category: string;
  priceRange: [number, number];
  sortBy: string;
}

interface MarketplaceFiltersProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  categories: string[];
  onClearFilters: () => void;
  resultCount: number;
}

const MarketplaceFilters = ({
  filters,
  onFiltersChange,
  categories,
  onClearFilters,
  resultCount
}: MarketplaceFiltersProps) => {
  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category });
  };

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  return (
    <Card className="p-6 h-fit">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold">Filtros</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={onClearFilters}
          className="text-gray-500 hover:text-gray-700"
        >
          <X className="h-4 w-4 mr-1" />
          Limpiar
        </Button>
      </div>

      <div className="space-y-6">
        {/* Category Filter */}
        <div>
          <h4 className="font-medium mb-3">Categoría</h4>
          <div className="space-y-2">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(category)}
                className={`w-full text-left px-3 py-2 rounded-md text-sm transition-colors ${
                  filters.category === category
                    ? 'bg-primary text-white'
                    : 'hover:bg-gray-100'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Price Range Filter */}
        <div>
          <h4 className="font-medium mb-3">Rango de precios</h4>
          <div className="px-2">
            <Slider
              value={filters.priceRange}
              onValueChange={handlePriceRangeChange}
              max={1000}
              min={0}
              step={10}
              className="w-full"
            />
            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <span>S/{filters.priceRange[0]}</span>
              <span>S/{filters.priceRange[1]}</span>
            </div>
          </div>
        </div>

        {/* Results Count */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600">
            {resultCount} {resultCount === 1 ? 'resultado' : 'resultados'}
          </p>
        </div>
      </div>
    </Card>
  );
};

export default MarketplaceFilters;
