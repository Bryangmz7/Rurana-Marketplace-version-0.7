
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Clock, Package, Heart } from 'lucide-react';
import { useCart } from '@/hooks/useCart';
import { Link } from 'react-router-dom';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  delivery_time: number;
  stock: number;
  store_id: string;
  store_name: string;
  store_rating?: number;
}

const ProductCard = ({
  id,
  name,
  description,
  price,
  image_urls,
  category,
  delivery_time,
  stock,
  store_id,
  store_name,
  store_rating = 0
}: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    await addToCart(id);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-102 h-fit">
      <div className="relative">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {image_urls && image_urls[0] ? (
            <img
              src={image_urls[0]}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="h-12 w-12" />
            </div>
          )}
        </div>
        
        {/* Badges de estado */}
        <div className="absolute top-2 left-2 flex flex-col gap-1">
          {stock === 0 && (
            <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
              Agotado
            </Badge>
          )}
          {stock > 0 && stock <= 5 && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800 px-1.5 py-0.5">
              Últimas
            </Badge>
          )}
        </div>

        {/* Botón de favoritos */}
        <button className="absolute top-2 right-2 p-1.5 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
          <Heart className="h-3 w-3 text-gray-600 hover:text-red-500" />
        </button>

        {/* Badge de entrega rápida */}
        {delivery_time <= 3 && (
          <div className="absolute bottom-2 left-2">
            <Badge className="text-xs bg-green-500 hover:bg-green-600 px-1.5 py-0.5">
              <Clock className="h-2.5 w-2.5 mr-1" />
              Rápido
            </Badge>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        {/* Información de la tienda */}
        <div className="flex items-center justify-between text-xs text-gray-600">
          <Link to={`/store/${store_id}`} className="font-medium hover:text-primary transition-colors truncate flex-1 mr-2">
            {store_name}
          </Link>
          {store_rating > 0 && (
            <div className="flex items-center gap-1 flex-shrink-0">
              <Star className="h-2.5 w-2.5 fill-yellow-400 text-yellow-400" />
              <span className="text-xs">{store_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Nombre del producto */}
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Categoría y entrega */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {category}
          </Badge>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{delivery_time}d</span>
          </div>
        </div>

        {/* Precio y botón de compra */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex-1">
            <div className="text-lg font-bold text-primary">
              S/{price.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Stock: {stock}
            </div>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={stock === 0}
            size="sm"
            className="h-8 px-2 text-xs"
          >
            <ShoppingCart className="h-3 w-3 mr-1" />
            {stock === 0 ? 'Agotado' : 'Agregar'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProductCard;
