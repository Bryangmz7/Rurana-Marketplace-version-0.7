
import { Star, MapPin, Package } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface StoreCardProps {
  id: string;
  name: string;
  description: string;
  rating: number;
  reviewCount: number;
  location: string;
  productCount: number;
  imageUrl: string;
  category: string;
}

const StoreCard = ({ 
  id, 
  name, 
  description, 
  rating, 
  reviewCount, 
  location, 
  productCount, 
  imageUrl, 
  category 
}: StoreCardProps) => {
  return (
    <div className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group hover:scale-105">
      <div className="relative h-48 bg-gradient-to-br from-primary-100 to-blue-200">
        <div className="absolute top-4 left-4">
          <span className="bg-white text-primary px-3 py-1 rounded-full text-sm font-medium">
            {category}
          </span>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl font-bold text-primary">{name.charAt(0)}</span>
          </div>
        </div>
      </div>
      
      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-xl font-bold text-gray-900 mb-2">{name}</h3>
          <p className="text-gray-600 text-sm leading-relaxed">{description}</p>
        </div>
        
        <div className="flex items-center justify-between text-sm text-gray-500">
          <div className="flex items-center space-x-1">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="font-medium">{rating}</span>
            <span>({reviewCount})</span>
          </div>
          <div className="flex items-center space-x-1">
            <Package className="h-4 w-4" />
            <span>{productCount} productos</span>
          </div>
        </div>
        
        <div className="flex items-center space-x-1 text-sm text-gray-500">
          <MapPin className="h-4 w-4" />
          <span>{location}</span>
        </div>
        
        <Button className="w-full bg-primary hover:bg-primary-600 rounded-xl">
          Ver tienda
        </Button>
      </div>
    </div>
  );
};

export default StoreCard;
