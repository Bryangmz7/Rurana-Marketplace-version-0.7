
import React from 'react';
import { Link } from 'react-router-dom';
import { Star, Store, MapPin } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface StoreInfoCardProps {
  storeId: string;
  storeName: string;
  storeRating?: number;
  storeDepartment?: string;
  className?: string;
}

const StoreInfoCard = ({ 
  storeId, 
  storeName, 
  storeRating = 0, 
  storeDepartment, 
  className = "" 
}: StoreInfoCardProps) => {
  return (
    <Link to={`/store/${storeId}`} className="block">
      <Card className={`p-4 hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-primary ${className}`}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Store className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-gray-900 hover:text-primary transition-colors">
              {storeName}
            </h3>
            <div className="flex items-center gap-4 mt-1">
              {storeRating > 0 && (
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                  <span className="text-sm font-medium text-gray-700">
                    {storeRating.toFixed(1)}
                  </span>
                </div>
              )}
              {storeDepartment && (
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{storeDepartment}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>
    </Link>
  );
};

export default StoreInfoCard;
