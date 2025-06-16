
import { User, Phone, MapPin, Mail, MessageCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Order } from '@/types/order';
import { contactBuyer } from '@/utils/orderUtils';
import { useToast } from '@/hooks/use-toast';

interface CustomerInfoProps {
  order: Order;
}

const CustomerInfo = ({ order }: CustomerInfoProps) => {
  const { toast } = useToast();

  const handleContactBuyer = () => {
    contactBuyer(order, toast);
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-cyan-50 border-2 border-blue-200 rounded-xl p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          {order.buyer_profile?.avatar_url ? (
            <img 
              src={order.buyer_profile.avatar_url} 
              alt={order.buyer_profile.name || 'Cliente'}
              className="w-16 h-16 rounded-full object-cover border-3 border-white shadow-lg"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-blue-400 to-cyan-500 rounded-full flex items-center justify-center shadow-lg">
              <User className="h-8 w-8 text-white" />
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-blue-900 flex items-center gap-2">
              <User className="h-5 w-5" />
              Información del Cliente
            </h3>
          </div>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Columna izquierda - Datos básicos */}
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center gap-2 mb-1">
                  <User className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">Nombre:</span>
                </div>
                <p className="text-gray-900 font-semibold">
                  {order.buyer_profile?.name || 'No registrado'}
                </p>
              </div>
              
              {order.buyer_profile?.email && (
                <div className="bg-white rounded-lg p-3 border border-blue-100">
                  <div className="flex items-center gap-2 mb-1">
                    <Mail className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Email:</span>
                  </div>
                  <p className="text-gray-700 text-sm">{order.buyer_profile.email}</p>
                </div>
              )}
            </div>
            
            {/* Columna derecha - Contacto */}
            <div className="space-y-3">
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-blue-800">Teléfono:</span>
                  </div>
                </div>
                
                {(order.delivery_phone || order.buyer_profile?.phone) ? (
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-900 font-medium">
                        {order.delivery_phone || order.buyer_profile?.phone}
                      </p>
                      {order.delivery_phone && order.buyer_profile?.phone && 
                       order.delivery_phone !== order.buyer_profile.phone && (
                        <p className="text-xs text-gray-500">
                          Perfil: {order.buyer_profile.phone}
                        </p>
                      )}
                    </div>
                    <Button
                      onClick={handleContactBuyer}
                      className="bg-green-600 hover:bg-green-700 text-white shadow-sm ml-2"
                      size="sm"
                    >
                      <MessageCircle className="h-4 w-4 mr-1" />
                      WhatsApp
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-yellow-800 font-medium">
                      Este cliente no tiene número de WhatsApp registrado
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {/* Direcciones */}
          <div className="mt-4 space-y-2">
            {order.delivery_address && (
              <div className="bg-white rounded-lg p-3 border border-green-200">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-green-600 mt-0.5" />
                  <div className="flex-1">
                    <span className="text-sm font-medium text-green-800">Dirección de entrega:</span>
                    <p className="text-gray-900 mt-1">{order.delivery_address}</p>
                    {order.delivery_notes && (
                      <p className="text-sm text-gray-600 mt-1 italic">
                        Notas: {order.delivery_notes}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}
            
            {order.buyer_profile?.address && order.delivery_address !== order.buyer_profile.address && (
              <div className="bg-white rounded-lg p-3 border border-blue-100">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-blue-600 mt-0.5" />
                  <div>
                    <span className="text-sm font-medium text-blue-800">Dirección personal:</span>
                    <p className="text-gray-700 mt-1 text-sm">{order.buyer_profile.address}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerInfo;
