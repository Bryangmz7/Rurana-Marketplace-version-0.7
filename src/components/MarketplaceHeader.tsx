
import React from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

interface MarketplaceHeaderProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  onSearch: (e: React.FormEvent) => void;
}

const MarketplaceHeader = ({ searchQuery, onSearchQueryChange, onSearch }: MarketplaceHeaderProps) => {
  return (
    <section className="py-8 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Marketplace
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubre productos únicos y personalizados de emprendedores verificados
          </p>
          
          {/* Search Bar */}
          <form onSubmit={onSearch} className="max-w-md mx-auto mb-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar productos..."
                className="pl-10 w-full"
                value={searchQuery}
                onChange={(e) => onSearchQueryChange(e.target.value)}
              />
              <Button type="submit" className="absolute inset-y-0 right-0 px-4">
                Buscar
              </Button>
            </div>
          </form>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceHeader;
