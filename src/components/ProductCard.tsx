
import React from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Clock, Package, Heart } from 'lucide-react';
import { useCart } from './CartContext';

interface ProductCardProps {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  delivery_time: number;
  stock: number;
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
  store_name,
  store_rating = 0
}: ProductCardProps) => {
  const { addToCart } = useCart();

  const handleAddToCart = async () => {
    await addToCart(id);
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
      <div className="relative">
        <div className="aspect-square bg-gray-100 overflow-hidden">
          {image_urls && image_urls[0] ? (
            <img
              src={image_urls[0]}
              alt={name}
              className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="h-16 w-16" />
            </div>
          )}
        </div>
        
        {/* Badges de estado */}
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {stock === 0 && (
            <Badge variant="destructive" className="text-xs">
              Agotado
            </Badge>
          )}
          {stock > 0 && stock <= 5 && (
            <Badge variant="secondary" className="text-xs bg-orange-100 text-orange-800">
              Últimas unidades
            </Badge>
          )}
          <Badge variant="outline" className="text-xs bg-white/90">
            {category}
          </Badge>
        </div>

        {/* Botón de favoritos */}
        <button className="absolute top-3 right-3 p-2 bg-white/90 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white">
          <Heart className="h-4 w-4 text-gray-600 hover:text-red-500" />
        </button>

        {/* Badge de entrega rápida */}
        {delivery_time <= 3 && (
          <div className="absolute bottom-3 left-3">
            <Badge className="text-xs bg-green-500 hover:bg-green-600">
              <Clock className="h-3 w-3 mr-1" />
              Entrega rápida
            </Badge>
          </div>
        )}
      </div>

      <div className="p-4 space-y-3">
        {/* Información de la tienda */}
        <div className="flex items-center justify-between text-sm text-gray-600">
          <span className="font-medium">{store_name}</span>
          {store_rating > 0 && (
            <div className="flex items-center gap-1">
              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
              <span>{store_rating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {/* Nombre del producto */}
        <h3 className="font-bold text-lg leading-tight line-clamp-2 group-hover:text-primary transition-colors">
          {name}
        </h3>

        {/* Descripción */}
        <p className="text-gray-600 text-sm line-clamp-2 leading-relaxed">
          {description}
        </p>

        {/* Información de entrega y stock */}
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{delivery_time} días</span>
          </div>
          <div className="flex items-center gap-1">
            <Package className="h-4 w-4" />
            <span>Stock: {stock}</span>
          </div>
        </div>

        {/* Precio y botón de compra */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="space-y-1">
            <div className="text-2xl font-bold text-primary">
              S/{price.toFixed(2)}
            </div>
            <div className="text-xs text-gray-500">
              Precio por unidad
            </div>
          </div>
          
          <Button
            onClick={handleAddToCart}
            disabled={stock === 0}
            className="bg-primary hover:bg-primary-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all hover:scale-105"
          >
            <ShoppingCart className="h-4 w-4" />
            {stock === 0 ? 'Agotado' : 'Agregar'}
          </Button>
        </div>

        {/* Información adicional */}
        {image_urls && image_urls.length > 1 && (
          <div className="text-xs text-gray-500 text-center pt-2">
            +{image_urls.length - 1} imagen{image_urls.length > 2 ? 's' : ''} más
          </div>
        )}
      </div>
    </Card>
  );
};

export default ProductCard;
