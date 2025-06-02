import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CartItem from './CartItem';
import { Input } from './ui/input';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { items, clearCart } = useCart();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [orderNotes, setOrderNotes] = useState('');

  const handleCheckout = async () => {
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
      // Verificar si el usuario tiene un perfil de buyer, si no, crearlo
      let { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      // Si no existe perfil de buyer, crearlo con datos del usuario
      if (!buyerProfile) {
        const { data: userData } = await supabase
          .from('users')
          .select('name, email')
          .eq('id', user.id)
          .single();

        const { data: newBuyerProfile, error: profileError } = await supabase
          .from('buyer_profiles')
          .insert({
            user_id: user.id,
            name: userData?.name || 'Usuario',
            email: userData?.email || '',
            phone: null,
            address: deliveryAddress || null
          })
          .select()
          .single();

        if (profileError) {
          throw profileError;
        }

        buyerProfile = newBuyerProfile;
      } else if (deliveryAddress && deliveryAddress !== buyerProfile.address) {
        // Actualizar la dirección si es diferente
        const { error: updateError } = await supabase
          .from('buyer_profiles')
          .update({ address: deliveryAddress })
          .eq('user_id', user.id);

        if (updateError) {
          console.error('Error updating buyer address:', updateError);
        }
      }

      // Agrupar items por tienda
      const itemsByStore = items.reduce((acc, item) => {
        const storeId = item.product.store_id;
        if (!acc[storeId]) {
          acc[storeId] = [];
        }
        acc[storeId].push(item);
        return acc;
      }, {} as Record<string, typeof items>);

      // Crear un pedido por cada tienda
      const orderPromises = Object.entries(itemsByStore).map(async ([storeId, storeItems]) => {
        const total = storeItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // Crear el pedido
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            store_id: storeId,
            total,
            status: 'pending',
            delivery_address: deliveryAddress || null,
            notes: orderNotes || null,
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Crear los items del pedido
        const orderItems = storeItems.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        return order;
      });

      await Promise.all(orderPromises);

      // Limpiar carrito
      clearCart();
      setDeliveryAddress('');
      setOrderNotes('');

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
      <div className="p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold">Carrito</h2>
          <Button variant="ghost" onClick={onClose}>
            <X className="h-6 w-6" />
          </Button>
        </div>

        <Separator className="my-4" />

        {items.length === 0 ? (
          <p className="text-gray-500">Tu carrito está vacío.</p>
        ) : (
          <div className="space-y-4">
            {items.map((item) => (
              <CartItem key={item.product.id} item={item} />
            ))}
          </div>
        )}

        <Separator className="my-4" />

        <div className="space-y-2">
          <h3 className="text-lg font-semibold">Detalles de entrega</h3>
          <Input
            type="text"
            placeholder="Dirección de entrega"
            value={deliveryAddress}
            onChange={(e) => setDeliveryAddress(e.target.value)}
          />
          <Input
            type="text"
            placeholder="Notas del pedido (opcional)"
            value={orderNotes}
            onChange={(e) => setOrderNotes(e.target.value)}
          />
        </div>

        <Separator className="my-4" />

        <div className="flex justify-between items-center">
          <h3 className="text-xl font-semibold">Total: S/{total.toFixed(2)}</h3>
          <Button
            onClick={handleCheckout}
            disabled={isProcessing}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            {isProcessing ? 'Procesando...' : 'Checkout'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CartSidebar;
