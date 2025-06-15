
import React, { createContext, useContext } from 'react';
import { useOptimizedCart } from '@/components/OptimizedCartContext';

interface CartItem {
  id: string;
  product_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_urls: string[];
    store_id: string;
    stock: number;
  };
}

interface CartContextType {
  items: CartItem[];
  addToCart: (productId: string, quantity?: number) => Promise<void>;
  removeFromCart: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clearCart: () => Promise<void>;
  total: number;
  itemCount: number;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

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

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
