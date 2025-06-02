
import React, { useState } from 'react';
import { useCart } from './CartContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { X, Plus, Minus, ShoppingBag, Truck, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { items, removeFromCart, updateQuantity, clearCart, total } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<string[]>([]);
  const { toast } = useToast();

  const validateCheckout = () => {
    const newErrors: string[] = [];
    
    if (items.length === 0) {
      newErrors.push('El carrito está vacío');
    }
    
    if (!deliveryAddress.trim()) {
      newErrors.push('La dirección de entrega es obligatoria');
    }
    
    setErrors(newErrors);
    return newErrors.length === 0;
  };

  const handleCheckout = async () => {
    if (!validateCheckout()) {
      return;
    }

    try {
      setIsCheckingOut(true);
      setErrors([]);
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('Usuario no autenticado');
      }

      console.log('Starting checkout process for user:', user.id);
      console.log('Cart items:', items);

      // Verificar que el usuario tenga un perfil de comprador
      const { data: buyerProfile, error: buyerError } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (buyerError) {
        console.error('Error checking buyer profile:', buyerError);
        throw new Error('Error al verificar el perfil del comprador');
      }

      if (!buyerProfile) {
        console.log('No buyer profile found, creating one...');
        const { error: createError } = await supabase
          .from('buyer_profiles')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.name || 'Usuario',
            email: user.email || '',
            phone: user.user_metadata?.phone || ''
          });

        if (createError) {
          console.error('Error creating buyer profile:', createError);
          throw new Error('Error al crear el perfil del comprador');
        }
      }

      // Agrupar productos por tienda
      const ordersByStore = items.reduce((acc, item) => {
        const storeId = item.product.store_id;
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      console.log('Orders grouped by store:', ordersByStore);

      // Crear un pedido por cada tienda
      for (const [storeId, storeItems] of Object.entries(ordersByStore)) {
        const storeTotal = storeItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        
        console.log(`Creating order for store ${storeId} with total ${storeTotal}`);
        
        // Crear el pedido
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            store_id: storeId,
            total: storeTotal,
            delivery_address: deliveryAddress.trim(),
            notes: notes.trim() || null,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw new Error(`Error al crear el pedido: ${orderError.message}`);
        }

        console.log('Order created:', order);

        // Crear los items del pedido
        const orderItems = storeItems.map(item => ({
          order_id: order.id,
          product_id: item.product_id,
          quantity: item.quantity,
          unit_price: item.product.price
        }));

        console.log('Creating order items:', orderItems);

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          throw new Error(`Error al crear los productos del pedido: ${itemsError.message}`);
        }

        // Obtener información del vendedor para la notificación
        const { data: store } = await supabase
          .from('stores')
          .select('user_id, name')
          .eq('id', storeId)
          .single();

        if (store) {
          console.log('Creating notification for seller:', store.user_id);
          
          // Crear notificación para el vendedor
          const { error: notificationError } = await supabase
            .from('notifications')
            .insert({
              user_id: store.user_id,
              title: 'Nuevo pedido recibido',
              message: `Has recibido un nuevo pedido por S/${storeTotal.toFixed(2)} en tu tienda ${store.name}`,
              type: 'order',
              related_order_id: order.id
            });

          if (notificationError) {
            console.error('Error creating notification:', notificationError);
            // No lanzar error aquí, la notificación es opcional
          }
        }
      }

      // Limpiar el carrito
      await clearCart();
      
      toast({
        title: "¡Pedido realizado!",
        description: "Tu pedido se ha enviado correctamente. El vendedor será notificado y se pondrá en contacto contigo.",
      });
      
      onClose();
      setDeliveryAddress('');
      setNotes('');
      
    } catch (error: any) {
      console.error('Error creating order:', error);
      toast({
        title: "Error al procesar el pedido",
        description: error.message || "No se pudo procesar el pedido. Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
        <div className="flex h-full flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex items-center gap-2">
              <ShoppingBag className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Carrito de compras</h2>
              {items.length > 0 && (
                <Badge variant="secondary">{items.length}</Badge>
              )}
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4">
            {/* Errores */}
            {errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
                <div className="flex items-center gap-2 text-red-800 font-medium mb-2">
                  <AlertCircle className="h-4 w-4" />
                  Errores de validación
                </div>
                <ul className="text-sm text-red-700 space-y-1">
                  {errors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {items.length === 0 ? (
              <div className="text-center py-8">
                <ShoppingBag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Tu carrito está vacío</p>
              </div>
            ) : (
              <div className="space-y-4">
                {items.map((item) => (
                  <div key={item.id} className="flex gap-3 p-3 border rounded-lg">
                    <img
                      src={item.product.image_urls?.[0] || '/placeholder.svg'}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{item.product.name}</h3>
                      <p className="text-primary font-bold">S/{item.product.price}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center">{item.quantity}</span>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeFromCart(item.product_id)}
                          className="ml-auto text-red-500"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* Checkout Form */}
                <div className="border-t pt-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Truck className="h-4 w-4 inline mr-1" />
                      Dirección de entrega *
                    </label>
                    <Textarea
                      value={deliveryAddress}
                      onChange={(e) => setDeliveryAddress(e.target.value)}
                      placeholder="Ingresa tu dirección completa..."
                      className="min-h-[80px]"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Notas adicionales (opcional)
                    </label>
                    <Textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="Instrucciones especiales para el vendedor..."
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          {items.length > 0 && (
            <div className="border-t p-4 space-y-4">
              <div className="flex justify-between items-center text-lg font-bold">
                <span>Total:</span>
                <span className="text-primary">S/{total.toFixed(2)}</span>
              </div>
              
              <Button
                onClick={handleCheckout}
                disabled={isCheckingOut}
                className="w-full"
              >
                {isCheckingOut ? 'Procesando...' : 'Confirmar pedido'}
              </Button>
              
              <p className="text-xs text-gray-500 text-center">
                Al confirmar, el vendedor será notificado y se pondrá en contacto contigo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
