
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Store, Package, Users, BarChart3 } from 'lucide-react';

interface StoreNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  storeName: string;
}

const StoreNavigation = ({ activeTab, onTabChange, storeName }: StoreNavigationProps) => {
  const tabs = [
    { id: 'overview', label: 'Resumen', icon: BarChart3 },
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'store', label: 'Mi Tienda', icon: Store },
    { id: 'customers', label: 'Clientes', icon: Users },
  ];

  return (
    <div className="bg-white border-b border-gray-200 sticky top-16 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{storeName}</h1>
            <p className="text-sm text-gray-600">Panel de vendedor</p>
          </div>
          <div className="flex space-x-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <Button
                  key={tab.id}
                  variant={activeTab === tab.id ? "default" : "ghost"}
                  size="sm"
                  onClick={() => onTabChange(tab.id)}
                  className="flex items-center gap-2"
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StoreNavigation;
