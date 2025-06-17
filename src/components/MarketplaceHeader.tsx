
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
    <div className="bg-gray-50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <form onSubmit={onSearch} className="max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-gray-400" />
            </div>
            <Input
              type="text"
              placeholder="Buscar productos..."
              className="pl-10 pr-20"
              value={searchQuery}
              onChange={(e) => onSearchQueryChange(e.target.value)}
            />
            <Button 
              type="submit" 
              size="sm"
              className="absolute inset-y-0 right-0 px-4 m-1"
            >
              Buscar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default MarketplaceHeader;
