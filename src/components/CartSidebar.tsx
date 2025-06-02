
import { useState } from 'react';
import { X, ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useCart } from '@/components/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import CartItem from './CartItem';
import CheckoutForm from './CheckoutForm';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const { toast } = useToast();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async (checkoutData: { delivery_address: string; notes: string }) => {
    if (items.length === 0) {
      toast({
        title: "Carrito vacío",
        description: "Agrega productos antes de realizar el pedido",
        variant: "destructive",
      });
      return;
    }

    if (!checkoutData.delivery_address.trim()) {
      toast({
        title: "Dirección requerida",
        description: "Por favor ingresa una dirección de entrega",
        variant: "destructive",
      });
      return;
    }

    setIsCheckingOut(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        toast({
          title: "Error",
          description: "Debes iniciar sesión para realizar un pedido",
          variant: "destructive",
        });
        return;
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

      // Crear una orden por cada tienda
      for (const [storeId, storeItems] of Object.entries(itemsByStore)) {
        const total = storeItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0);

        // Crear la orden
        const { data: order, error: orderError } = await supabase
          .from('orders')
          .insert({
            buyer_id: session.user.id,
            store_id: storeId,
            total,
            delivery_address: checkoutData.delivery_address,
            notes: checkoutData.notes,
            status: 'pending'
          })
          .select()
          .single();

        if (orderError) throw orderError;

        // Crear los items de la orden
        const orderItems = storeItems.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price
        }));

        const { error: itemsError } = await supabase
          .from('order_items')
          .insert(orderItems);

        if (itemsError) throw itemsError;

        // Actualizar stock de productos
        for (const item of storeItems) {
          const { error: stockError } = await supabase
            .from('products')
            .update({ 
              stock: Math.max(0, item.product.stock - item.quantity)
            })
            .eq('id', item.product.id);

          if (stockError) {
            console.error('Error updating stock:', stockError);
          }
        }

        // Limpiar carrito (solo los items de esta tienda)
        for (const item of storeItems) {
          const { error: cartError } = await supabase
            .from('cart_items')
            .delete()
            .eq('user_id', session.user.id)
            .eq('product_id', item.product.id);

          if (cartError) {
            console.error('Error clearing cart:', cartError);
          }
        }
      }

      // Limpiar carrito local
      clearCart();
      
      toast({
        title: "¡Pedido realizado!",
        description: `Se han creado ${Object.keys(itemsByStore).length} pedido(s) exitosamente`,
      });

      onClose();
    } catch (error: any) {
      console.error('Checkout error:', error);
      toast({
        title: "Error en el pedido",
        description: error.message || "No se pudo procesar el pedido",
        variant: "destructive",
      });
    } finally {
      setIsCheckingOut(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black bg-opacity-50 z-40" onClick={onClose} />
      
      {/* Sidebar */}
      <div className="fixed right-0 top-0 h-full w-96 bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingBag className="h-5 w-5" />
            <h2 className="text-lg font-semibold">Carrito</h2>
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {items.length}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <ShoppingBag className="h-12 w-12 mb-4" />
              <p>Tu carrito está vacío</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <CartItem
                  key={item.product.id}
                  item={item}
                  onQuantityChange={handleQuantityChange}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          )}
        </div>

        {/* Checkout Section */}
        {items.length > 0 && (
          <CheckoutForm
            total={total}
            onCheckout={handleCheckout}
            isProcessing={isCheckingOut}
          />
        )}
      </div>
    </>
  );
};

export default CartSidebar;
