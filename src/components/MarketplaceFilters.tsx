
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { X, Filter } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useState } from 'react';

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
  const [isOpen, setIsOpen] = useState(false);

  const handleCategoryChange = (category: string) => {
    onFiltersChange({ ...filters, category });
  };

  const handlePriceRangeChange = (value: number[]) => {
    onFiltersChange({ ...filters, priceRange: [value[0], value[1]] });
  };

  return (
    <Card className="p-4">
      <Collapsible open={isOpen} onOpenChange={setIsOpen}>
        <div className="flex items-center justify-between">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="p-0 h-auto">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <span className="font-medium">Filtros</span>
              </div>
            </Button>
          </CollapsibleTrigger>
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">
              {resultCount} productos
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearFilters}
              className="text-gray-500 hover:text-gray-700 h-auto p-1"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>
        </div>

        <CollapsibleContent className="space-y-4 mt-4">
          {/* Category Filter */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Categoría</h4>
            <div className="flex flex-wrap gap-1">
              {categories.map((category) => (
                <Button
                  key={category}
                  onClick={() => handleCategoryChange(category)}
                  variant={filters.category === category ? "default" : "outline"}
                  size="sm"
                  className="text-xs h-7"
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>

          {/* Price Range Filter */}
          <div>
            <h4 className="font-medium mb-2 text-sm">Precio</h4>
            <div className="px-2">
              <Slider
                value={filters.priceRange}
                onValueChange={handlePriceRangeChange}
                max={1000}
                min={0}
                step={10}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>S/{filters.priceRange[0]}</span>
                <span>S/{filters.priceRange[1]}</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
};

export default MarketplaceFilters;
