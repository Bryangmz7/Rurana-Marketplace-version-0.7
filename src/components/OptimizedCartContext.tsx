
import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_urls: string[];
    store: {
      name: string;
    };
  };
}

interface CartContextType {
  items: CartItem[];
  itemCount: number;
  loading: boolean;
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const OptimizedCartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const fetchCartItems = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('cart_items')
        .select(`
          id,
          product_id,
          quantity,
          product:products(
            id,
            name,
            price,
            image_urls,
            store:stores(name)
          )
        `)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error fetching cart items:', error);
        toast({
          title: "Error",
          description: "No se pudieron cargar los elementos del carrito.",
          variant: "destructive",
        });
        return;
      }

      setItems(data || []);
    } catch (error) {
      console.error('Error in fetchCartItems:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  useEffect(() => {
    fetchCartItems();
  }, [fetchCartItems]);

  const addToCart = useCallback(async (productId: string, quantity = 1) => {
    if (!user) {
      toast({
        title: "Inicia sesión",
        description: "Debes iniciar sesión para agregar productos al carrito.",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      
      // Check if item already exists
      const existingItem = items.find(item => item.product_id === productId);
      
      if (existingItem) {
        await updateQuantity(productId, existingItem.quantity + quantity);
        return;
      }

      const { error } = await supabase
        .from('cart_items')
        .insert([{
          user_id: user.id,
          product_id: productId,
          quantity,
        }]);

      if (error) {
        console.error('Error adding to cart:', error);
        toast({
          title: "Error",
          description: "No se pudo agregar el producto al carrito.",
          variant: "destructive",
        });
        return;
      }

      await fetchCartItems();
      toast({
        title: "Producto agregado",
        description: "El producto se agregó al carrito exitosamente.",
      });
    } catch (error) {
      console.error('Error in addToCart:', error);
    } finally {
      setLoading(false);
    }
  }, [user, items, toast, fetchCartItems]);

  const removeFromCart = useCallback(async (productId: string) => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error removing from cart:', error);
        toast({
          title: "Error",
          description: "No se pudo eliminar el producto del carrito.",
          variant: "destructive",
        });
        return;
      }

      setItems(prev => prev.filter(item => item.product_id !== productId));
      toast({
        title: "Producto eliminado",
        description: "El producto se eliminó del carrito.",
      });
    } catch (error) {
      console.error('Error in removeFromCart:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const updateQuantity = useCallback(async (productId: string, quantity: number) => {
    if (!user) return;

    if (quantity <= 0) {
      await removeFromCart(productId);
      return;
    }

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .update({ quantity })
        .eq('user_id', user.id)
        .eq('product_id', productId);

      if (error) {
        console.error('Error updating quantity:', error);
        toast({
          title: "Error",
          description: "No se pudo actualizar la cantidad.",
          variant: "destructive",
        });
        return;
      }

      setItems(prev => prev.map(item => 
        item.product_id === productId 
          ? { ...item, quantity }
          : item
      ));
    } catch (error) {
      console.error('Error in updateQuantity:', error);
    } finally {
      setLoading(false);
    }
  }, [user, removeFromCart, toast]);

  const clearCart = useCallback(async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error clearing cart:', error);
        toast({
          title: "Error",
          description: "No se pudo vaciar el carrito.",
          variant: "destructive",
        });
        return;
      }

      setItems([]);
      toast({
        title: "Carrito vaciado",
        description: "Se eliminaron todos los productos del carrito.",
      });
    } catch (error) {
      console.error('Error in clearCart:', error);
    } finally {
      setLoading(false);
    }
  }, [user, toast]);

  const contextValue = useMemo(() => ({
    items,
    itemCount: items.reduce((total, item) => total + item.quantity, 0),
    loading,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    total: items.reduce((total, item) => total + (item.product.price * item.quantity), 0),
    refreshCart: fetchCartItems,
  }), [items, loading, addToCart, removeFromCart, updateQuantity, clearCart, fetchCartItems]);

  return (
    <CartContext.Provider value={contextValue}>
      {children}
    </CartContext.Provider>
  );
};

export const useOptimizedCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useOptimizedCart must be used within an OptimizedCartProvider');
  }
  return context;
};
