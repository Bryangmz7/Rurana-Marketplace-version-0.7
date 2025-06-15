
import React, { createContext } from 'react';
import { useOptimizedCart } from '@/components/OptimizedCartContext';
import { CartItem, CartContextType } from '@/types/cart';

export const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider = ({ children }: { children: React.ReactNode }) => {
  const optimizedCart = useOptimizedCart();

  const adaptedItems: CartItem[] = optimizedCart.items.map(item => ({
    id: item.id,
    product_id: item.product_id,
    quantity: item.quantity,
    product: {
      id: item.product.id,
      name: item.product.name,
      price: item.product.price,
      image_urls: item.product.image_urls,
      store_id: item.product.store_id,
      stock: item.product.stock,
    }
  }));

  const value: CartContextType = {
    items: adaptedItems,
    addToCart: optimizedCart.addToCart,
    removeFromCart: optimizedCart.removeFromCart,
    updateQuantity: optimizedCart.updateQuantity,
    clearCart: optimizedCart.clearCart,
    total: optimizedCart.total,
    itemCount: optimizedCart.itemCount,
    loading: optimizedCart.loading,
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
};
