import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ShoppingCart } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { useCart } from '@/hooks/useCart';
import CartItemsList from '@/components/CartItemsList';
import DeliveryInformation from '@/components/DeliveryInformation';
import CartTotals from '@/components/CartTotals';
import StoreInfoCard from '@/components/StoreInfoCard';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

const CartPage = () => {
  const { items, clearCart, updateQuantity, removeFromCart } = useCart();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [deliveryData, setDeliveryData] = useState({
    address: '',
    phone: '',
    notes: ''
  });
  const [orderNotes, setOrderNotes] = useState('');

  // Agrupar items por tienda para mostrar información de cada tienda
  const itemsByStore = items.reduce((acc: Record<string, typeof items>, item) => {
    const storeId = item.product.store_id;
    if (!acc[storeId]) {
      acc[storeId] = [];
    }
    acc[storeId].push(item);
    return acc;
  }, {});

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
      console.log('Starting checkout process for user:', user.id);

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
        const shippingCost = 10;
        const total = subtotal + shippingCost;

        console.log(`Creating order for store ${storeId} with total: ${total}`);

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

        const orderItems = storeItems.map(item => ({
          order_id: order.id,
          product_id: item.product.id,
          quantity: item.quantity,
          unit_price: item.product.price,
          total_price: item.quantity * item.product.price,
          customization_details: null,
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

      await clearCart();
      setDeliveryData({ address: '', phone: '', notes: '' });
      setOrderNotes('');

      console.log('Checkout completed successfully');

      toast({
        title: "¡Pedido realizado!",
        description: `Se crearon ${createdOrders.length} pedido(s). Los vendedores serán notificados automáticamente.`,
      });

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to="/marketplace">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Volver al Marketplace
            </Button>
          </Link>
          <div className="flex items-center gap-3">
            <ShoppingCart className="h-8 w-8 text-primary" />
            <h1 className="text-3xl font-bold text-gray-900">Mi Carrito</h1>
          </div>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingCart className="h-24 w-24 text-gray-300 mx-auto mb-6" />
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Tu carrito está vacío</h2>
            <p className="text-gray-600 mb-8">Explora nuestro marketplace y encuentra productos únicos</p>
            <Link to="/marketplace">
              <Button size="lg">
                Explorar Productos
              </Button>
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Lista de productos */}
            <div className="lg:col-span-2 space-y-6">
              {/* Información de las tiendas */}
              {Object.keys(itemsByStore).map(storeId => {
                const storeItems = itemsByStore[storeId];
                const firstItem = storeItems[0];
                return (
                  <StoreInfoCard
                    key={storeId}
                    storeId={storeId}
                    storeName={firstItem.product.store?.name || 'Tienda'}
                    storeRating={firstItem.product.store?.rating || 0}
                    className="mb-4"
                  />
                );
              })}

              <div className="bg-white rounded-xl shadow-sm border p-6">
                <h2 className="text-xl font-semibold mb-4">Productos en tu carrito</h2>
                <CartItemsList
                  items={items}
                  onQuantityChange={updateQuantity}
                  onRemove={removeFromCart}
                />
              </div>
              
              <div className="bg-white rounded-xl shadow-sm border p-6">
                <DeliveryInformation
                  deliveryData={deliveryData}
                  setDeliveryData={setDeliveryData}
                  orderNotes={orderNotes}
                  setOrderNotes={setOrderNotes}
                />
              </div>
            </div>

            {/* Resumen del pedido */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-xl shadow-sm border p-6 sticky top-8">
                <h2 className="text-xl font-semibold mb-4">Resumen del pedido</h2>
                <CartTotals
                  items={items}
                  isProcessing={isProcessing}
                  deliveryAddress={deliveryData.address}
                  onCheckout={handleCheckout}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default CartPage;
