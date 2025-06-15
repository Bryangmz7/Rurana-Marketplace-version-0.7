
import React from "react";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";

const CartPage = () => {
  const { cart, products, removeFromCart, updateCart, makeOrder } = useShop();
  const { currentUser } = useAuth();

  const cartItems = cart.map(item => {
    const prod = products.find(p => p.id === item.productId);
    return prod
      ? { ...prod, quantity: item.quantity }
      : null;
  }).filter(Boolean);

  const total = cartItems.reduce((acc: any, it: any) => acc + it.price * it.quantity, 0);

  return (
    <div className="max-w-2xl mx-auto py-10">
      <h1 className="font-bold text-xl mb-4">Carrito</h1>
      {cartItems.length ? (
        <div>
          {cartItems.map((item: any) => (
            <div key={item.id} className="border-b py-4 flex items-center gap-3">
              <img src={item.image_urls[0]} alt={item.name} className="w-14 h-14 rounded object-cover" />
              <div className="flex-1">
                <div>{item.name}</div>
                <div className="text-sm text-gray-500">S/{item.price} · x{item.quantity}</div>
                <div className="flex gap-2 mt-1">
                  <button
                    onClick={() => updateCart(item.id, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    className="border rounded px-2"
                  >-</button>
                  <button
                    onClick={() => updateCart(item.id, item.quantity + 1)}
                    className="border rounded px-2"
                  >+</button>
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="border text-red-600 rounded px-2 ml-2"
                  >Eliminar</button>
                </div>
              </div>
            </div>
          ))}
          <div className="text-right font-semibold text-lg mt-6">Total: S/{total}</div>
          <button
            className="mt-4 px-6 py-2 bg-primary text-white rounded"
            onClick={() => currentUser && makeOrder(currentUser.id)}
            disabled={!currentUser}
          >
            Comprar
          </button>
        </div>
      ) : (
        <div className="text-gray-600">Tu carrito está vacío.</div>
      )}
    </div>
  );
};
export default CartPage;
