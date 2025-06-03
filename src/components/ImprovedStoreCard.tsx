
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Star, Store, MapPin, Clock, Package, Eye, ShoppingCart } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  category?: string;
  department?: string;
  created_at: string;
  product_count?: number;
}

interface ImprovedStoreCardProps {
  store: Store;
  onAddToCart?: (storeId: string) => void;
}

const ImprovedStoreCard = ({ store, onAddToCart }: ImprovedStoreCardProps) => {
  const navigate = useNavigate();

  const handleStoreClick = () => {
    navigate(`/store/${store.id}`);
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddToCart) {
      onAddToCart(store.id);
    }
  };

  const handleViewDetails = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/store/${store.id}`);
  };

  return (
    <Card 
      className="group hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 border-2 hover:border-primary/20"
      onClick={handleStoreClick}
    >
      <CardContent className="p-6">
        <div className="space-y-4">
          {/* Header con logo y rating */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-3">
              {store.logo_url ? (
                <img
                  src={store.logo_url}
                  alt={`${store.name} logo`}
                  className="w-12 h-12 rounded-full object-cover border-2 border-gray-200 group-hover:border-primary/30 transition-colors"
                />
              ) : (
                <div className="w-12 h-12 bg-gradient-to-br from-primary/10 to-primary/20 rounded-full flex items-center justify-center border-2 border-gray-200 group-hover:border-primary/30 transition-colors">
                  <Store className="h-6 w-6 text-primary" />
                </div>
              )}
              <div>
                <h3 className="font-bold text-lg text-gray-900 group-hover:text-primary transition-colors line-clamp-1">
                  {store.name}
                </h3>
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {store.rating.toFixed(1)}
                  </span>
                </div>
              </div>
            </div>
            
            {store.category && (
              <Badge variant="secondary" className="text-xs">
                {store.category}
              </Badge>
            )}
          </div>

          {/* Descripción */}
          <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
            {store.description || 'Tienda especializada en productos únicos y de calidad.'}
          </p>

          {/* Información adicional */}
          <div className="space-y-2">
            {store.department && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin className="h-4 w-4" />
                <span>{store.department}</span>
              </div>
            )}
            
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                <span>Desde {new Date(store.created_at).getFullYear()}</span>
              </div>
              
              {store.product_count !== undefined && (
                <div className="flex items-center gap-1">
                  <Package className="h-4 w-4" />
                  <span>{store.product_count} productos</span>
                </div>
              )}
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <Button
              onClick={handleViewDetails}
              variant="outline"
              size="sm"
              className="flex-1 group-hover:border-primary/50 transition-colors"
            >
              <Eye className="h-4 w-4 mr-2" />
              Detalles
            </Button>
            
            <Button
              onClick={handleAddToCart}
              size="sm"
              className="flex-1 bg-primary hover:bg-primary/90 transition-colors"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              Agregar
            </Button>
          </div>

          {/* Indicador de productos personalizables */}
          <div className="flex items-center justify-center pt-2 border-t border-gray-100">
            <Badge variant="outline" className="text-xs text-primary border-primary/30">
              ✨ Productos Personalizables
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default ImprovedStoreCard;
