
import React, { createContext, useContext, useState, useEffect } from "react";
import { mockProducts } from "@/mocks/products";

export type Product = typeof mockProducts[0];

type CartItem = {
  productId: string;
  quantity: number;
};

type Order = {
  id: string;
  userId: string;
  items: CartItem[];
  status: "pending" | "sent" | "delivered";
  date: string;
};

type ShopContextProps = {
  products: Product[];
  cart: CartItem[];
  orders: Order[];
  addToCart: (productId: string, qty?: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  makeOrder: (userId: string) => void;
  updateCart: (productId: string, quantity: number) => void;
  setProducts: (ps: Product[]) => void;
};

const ShopContext = createContext<ShopContextProps | undefined>(undefined);

export const ShopProvider = ({ children }: { children: React.ReactNode }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    // Inicializar productos y estados desde localStorage
    setProducts(mockProducts);
    const cartLS = localStorage.getItem("cart");
    const ordersLS = localStorage.getItem("orders");
    if (cartLS) setCart(JSON.parse(cartLS));
    if (ordersLS) setOrders(JSON.parse(ordersLS));
  }, []);

  useEffect(() => {
    localStorage.setItem("cart", JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem("orders", JSON.stringify(orders));
  }, [orders]);

  const addToCart = (productId: string, qty = 1) => {
    setCart(prev => {
      const found = prev.find(it => it.productId === productId);
      if (found) {
        return prev.map(it =>
          it.productId === productId
            ? { ...it, quantity: it.quantity + qty }
            : it
        );
      }
      return [...prev, { productId, quantity: qty }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.filter(it => it.productId !== productId));
  };

  const clearCart = () => setCart([]);

  const updateCart = (productId: string, quantity: number) => {
    if (quantity <= 0) return removeFromCart(productId);
    setCart(prev =>
      prev.map(it =>
        it.productId === productId ? { ...it, quantity } : it
      )
    );
  };

  const makeOrder = (userId: string) => {
    if (cart.length === 0) return;
    const newOrder: Order = {
      id: Date.now().toString(),
      userId,
      items: cart,
      status: "pending",
      date: new Date().toISOString()
    };
    setOrders(prev => [newOrder, ...prev]);
    clearCart();
  };

  return (
    <ShopContext.Provider
      value={{
        products,
        cart,
        orders,
        addToCart,
        removeFromCart,
        clearCart,
        makeOrder,
        updateCart,
        setProducts
      }}
    >
      {children}
    </ShopContext.Provider>
  );
};

export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop debe ir envuelto en ShopProvider");
  return ctx;
}
