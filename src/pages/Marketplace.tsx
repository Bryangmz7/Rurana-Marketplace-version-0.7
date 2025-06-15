
import React from "react";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";

const Marketplace = () => {
  const { products, addToCart } = useShop();
  const { currentUser } = useAuth();

  return (
    <div className="max-w-4xl mx-auto py-10">
      <h1 className="font-bold text-2xl mb-4">Marketplace (Simulado)</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map(prod => (
          <div key={prod.id} className="border rounded-lg p-4 flex flex-col">
            <img
              src={prod.image_urls[0]}
              alt={prod.name}
              className="w-full rounded mb-2 object-cover aspect-square"
            />
            <div className="flex-1">
              <div className="font-bold">{prod.name}</div>
              <div className="text-gray-600 text-sm mb-2">{prod.description}</div>
              <div className="text-lg font-semibold mb-1">S/{prod.price}</div>
              <div className="text-xs text-gray-400 mb-1">
                Stock: {prod.stock} · Categoría: {prod.category}
              </div>
              <button
                className="mt-2 bg-primary text-white rounded px-4 py-2 hover:bg-primary/80"
                disabled={!currentUser || currentUser.role !== "buyer"}
                onClick={() => addToCart(prod.id)}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
export default Marketplace;
