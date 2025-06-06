
import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/CartContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CartItem from './CartItem';
import { Input } from './ui/input';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { items, clearCart, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const handleCheckout = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Necesitas iniciar sesión para realizar una compra",
        variant: "destructive",
      });
      return;
    }

    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos al carrito antes de proceder",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting checkout process for user:', user.id);

      // Verificar/crear perfil de buyer con sincronización mejorada
      let { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!buyerProfile) {
        console.log('Creating new buyer profile...');
        
        // Crear perfil de buyer con datos completos
        const { data: newBuyerProfile, error: profileError } = await supabase
          .from('buyer_profiles')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            phone: user.user_metadata?.phone || null,
            address: deliveryAddress || user.user_metadata?.address || null
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating buyer profile:', profileError);
          throw profileError;
        }

        buyerProfile = newBuyerProfile;
        console.log('Buyer profile created:', buyerProfile);
      } else {
        console.log('Updating existing buyer profile...');
        
        // Actualizar perfil existente si hay nueva información
        const updateData: any = {};
        
        if (deliveryAddress && deliveryAddress !== buyerProfile.address) {
          updateData.address = deliveryAddress;
        }
        
        if (user.user_metadata?.phone && user.user_metadata.phone !== buyerProfile.phone) {
          updateData.phone = user.user_metadata.phone;
        }
        
        if (user.user_metadata?.name && user.user_metadata.name !== buyerProfile.name) {
          updateData.name = user.user_metadata.name;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('buyer_profiles')
            .update(updateData)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating buyer profile:', updateError);
          } else {
            console.log('Buyer profile updated with:', updateData);
          }
        }
      }

      // Agrupar items por tienda
      const itemsByStore = items.reduce((acc: Record<string, typeof items>, item) => {
        const storeId = item.product.store_id;
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
        return acc;
      }, {});

      console.log('Creating orders for stores:', Object.keys(itemsByStore));

      // Crear un pedido por cada tienda
      const orderPromises = Object.entries(itemsByStore).map(async ([storeId, storeItems]) => {
        const subtotal = storeItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);
        const shippingCost = 10; // Costo fijo de envío
        const total = subtotal + shippingCost;

        console.log(`Creating order for store ${storeId} with total: ${total}`);

        // Crear el pedido - el order_number se genera automáticamente por trigger
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            store_id: storeId,
            subtotal,
            shipping_cost: shippingCost,
            total,
            status: 'pending',
            delivery_address: deliveryAddress || null,
            customer_notes: orderNotes || null,
          })
          .select()
          .single();

        if (orderError) {
          console.error('Error creating order:', orderError);
          throw orderError;
        }

        console.log('Order created:', order);

        // Crear los items del pedido con total_price requerido
        const orderItems = storeItems.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.quantity * item.product.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) {
          console.error('Error creating order items:', itemsError);
          throw itemsError;
        }

        console.log('Order items created for order:', order.id);
        return order;
      });

      await Promise.all(orderPromises);

      // Limpiar carrito
      await clearCart();
      setDeliveryAddress('');
      setOrderNotes('');

      console.log('Checkout completed successfully');

      toast({
        title: "¡Pedido realizado!",
        description: "Tu pedido ha sido enviado a los vendedores. Te notificaremos cuando confirmen el pedido.",
      });

      onClose();
    } catch (error) {
      console.error('Error during checkout:', error);
      toast({
        title: "Error al procesar el pedido",
        description: "Hubo un problema al procesar tu pedido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const total = items.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

  return (
    <div
      className={`fixed top-0 right-0 w-full sm:w-96 h-full bg-white shadow-xl transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : 'translate-x-full'
      } z-50`}
    >
      <div className="p-6 h-full flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold">Carrito</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <Separator className="mb-4" />

        {items.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-gray-500">Tu carrito está vacío.</p>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto space-y-4 mb-4">
              {items.map((item) => (
                <CartItem 
                  key={item.product.id} 
                  item={item}
                  onQuantityChange={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>

            <Separator className="mb-4" />

            <div className="space-y-3 mb-4">
              <h3 className="text-lg font-semibold">Detalles de entrega</h3>
              <Input
                type="text"
                placeholder="Dirección de entrega"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="w-full"
              />
              <Input
                type="text"
                placeholder="Notas del pedido (opcional)"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                className="w-full"
              />
            </div>

            <Separator className="mb-4" />

            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold">Total: S/{total.toFixed(2)}</h3>
              </div>
              <Button
                onClick={handleCheckout}
                disabled={isProcessing}
                className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
                size="lg"
              >
                {isProcessing ? 'Procesando...' : 'Realizar Pedido'}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default CartSidebar;
