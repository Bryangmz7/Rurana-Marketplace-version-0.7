
import { useState } from 'react';
import { X, Plus, Minus, ShoppingBag, CreditCard } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCart } from '@/components/CartContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface CartSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

const CartSidebar = ({ isOpen, onClose }: CartSidebarProps) => {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [checkoutData, setCheckoutData] = useState({
    delivery_address: '',
    notes: ''
  });
  const { toast } = useToast();

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(productId);
    } else {
      updateQuantity(productId, newQuantity);
    }
  };

  const handleCheckout = async () => {
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

      setCheckoutData({ delivery_address: '', notes: '' });
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
                <div key={item.product.id} className="flex gap-3 p-3 border rounded-lg">
                  {item.product.image_urls && item.product.image_urls[0] && (
                    <img
                      src={item.product.image_urls[0]}
                      alt={item.product.name}
                      className="w-16 h-16 object-cover rounded"
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-medium text-sm">{item.product.name}</h3>
                    <p className="text-primary font-semibold">S/{item.product.price}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity - 1)}
                        className="h-8 w-8 p-0"
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="w-8 text-center text-sm">{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleQuantityChange(item.product.id, item.quantity + 1)}
                        className="h-8 w-8 p-0"
                        disabled={item.quantity >= item.product.stock}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-600 hover:text-red-700 ml-auto"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Checkout Section */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            <div className="flex justify-between items-center text-lg font-semibold">
              <span>Total:</span>
              <span className="text-primary">S/{total.toFixed(2)}</span>
            </div>

            <div className="space-y-3">
              <div>
                <Label htmlFor="delivery_address">Dirección de entrega *</Label>
                <Input
                  id="delivery_address"
                  placeholder="Ingresa tu dirección completa"
                  value={checkoutData.delivery_address}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, delivery_address: e.target.value }))}
                />
              </div>

              <div>
                <Label htmlFor="notes">Notas adicionales</Label>
                <Textarea
                  id="notes"
                  placeholder="Instrucciones especiales (opcional)"
                  value={checkoutData.notes}
                  onChange={(e) => setCheckoutData(prev => ({ ...prev, notes: e.target.value }))}
                  rows={2}
                />
              </div>
            </div>

            <Button 
              onClick={handleCheckout} 
              className="w-full" 
              disabled={isCheckingOut}
            >
              <CreditCard className="h-4 w-4 mr-2" />
              {isCheckingOut ? 'Procesando...' : 'Realizar Pedido'}
            </Button>
          </div>
        )}
      </div>
    </>
  );
};

export default CartSidebar;
