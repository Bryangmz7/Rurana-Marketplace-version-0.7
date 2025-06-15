import React, { useState } from 'react';
import { X } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import CartItemsList from './CartItemsList';
import DeliveryInformation from './DeliveryInformation';
import CartTotals from './CartTotals';

interface ImprovedCartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const ImprovedCartSidebar = ({ isOpen, onClose }: ImprovedCartSidebarProps) => {
  const { items, clearCart, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    address: '',
    phone: '',
    notes: ''
  });
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

    if (!deliveryData.address.trim()) {
      toast({
        title: "Dirección requerida",
        description: "Por favor ingresa una dirección de entrega",
        variant: "destructive",
      });
      return;
    }

    setIsProcessing(true);

    try {
      console.log('Starting improved checkout process for user:', user.id);

      // Verificar/crear perfil de buyer
      let { data: buyerProfile } = await supabase
        .from('buyer_profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!buyerProfile) {
        console.log('Creating new buyer profile...');
        
        const { data: newBuyerProfile, error: profileError } = await supabase
          .from('buyer_profiles')
          .insert({
            user_id: user.id,
            name: user.user_metadata?.name || user.email?.split('@')[0] || 'Usuario',
            email: user.email || '',
            phone: deliveryData.phone || user.user_metadata?.phone || null,
            address: deliveryData.address || user.user_metadata?.address || null
          })
          .select()
          .single();

        if (profileError) {
          console.error('Error creating buyer profile:', profileError);
          throw profileError;
        }

        buyerProfile = newBuyerProfile;
      } else {
        // Actualizar perfil con nueva información
        const updateData: any = {};
        
        if (deliveryData.address && deliveryData.address !== buyerProfile.address) {
          updateData.address = deliveryData.address;
        }
        
        if (deliveryData.phone && deliveryData.phone !== buyerProfile.phone) {
          updateData.phone = deliveryData.phone;
        }

        if (Object.keys(updateData).length > 0) {
          const { error: updateError } = await supabase
            .from('buyer_profiles')
            .update(updateData)
            .eq('user_id', user.id);

          if (updateError) {
            console.error('Error updating buyer profile:', updateError);
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
        const shippingCost = 10; // Costo fijo de envío por tienda
        const total = subtotal + shippingCost;

        console.log(`Creating order for store ${storeId} with total: ${total}`);

        // Crear el pedido mejorado - order_number se genera automáticamente por trigger
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: user.id,
            store_id: storeId,
            subtotal,
            shipping_cost: shippingCost,
            total,
            status: 'pending',
            delivery_address: deliveryData.address,
            delivery_phone: deliveryData.phone || null,
            delivery_notes: deliveryData.notes || null,
            customer_notes: orderNotes || null,
            order_number: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
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
          customization_details: null, // Se puede agregar personalización aquí
          special_instructions: null
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

      const createdOrders = await Promise.all(orderPromises);

      // Limpiar carrito
      await clearCart();
      setDeliveryData({ address: '', phone: '', notes: '' });
      setOrderNotes('');

      console.log('Improved checkout completed successfully');

      toast({
        title: "¡Pedido realizado!",
        description: `Se crearon ${createdOrders.length} pedido(s). Los vendedores serán notificados automáticamente.`,
      });

      onClose();
    } catch (error) {
      console.error('Error during improved checkout:', error);
      toast({
        title: "Error al procesar el pedido",
        description: "Hubo un problema al procesar tu pedido. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };

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
            <CartItemsList
              items={items}
              onQuantityChange={updateQuantity}
              onRemove={removeFromCart}
            />

            <Separator className="mb-4" />

            <DeliveryInformation
              deliveryData={deliveryData}
              setDeliveryData={setDeliveryData}
              orderNotes={orderNotes}
              setOrderNotes={setOrderNotes}
            />

            <Separator className="mb-4" />

            <CartTotals
              items={items}
              isProcessing={isProcessing}
              deliveryAddress={deliveryData.address}
              onCheckout={handleCheckout}
            />
          </>
        )}
      </div>
    </div>
  );
};

export default ImprovedCartSidebar;
