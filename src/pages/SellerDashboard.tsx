
import React, { useState } from "react";
import { useShop } from "@/context/ShopContext";
import { useAuth } from "@/context/AuthContext";

const SellerDashboard = () => {
  const { products, setProducts } = useShop();
  const { currentUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ name: "", price: 0, stock: 1, description: "", image: "" });

  // Solo muestra productos propios
  if (!currentUser || currentUser.role !== "seller") return <div>No autorizado</div>;
  const myProducts = products.filter(p => p.sellerId === currentUser.id);

  const handleAdd = () => {
    setProducts([
      ...products, {
        id: Date.now() + "",
        name: form.name,
        price: form.price,
        stock: form.stock,
        category: "Otros",
        image_urls: [form.image],
        description: form.description,
        delivery_time: 7,
        sellerId: currentUser.id
      }
    ]);
    setForm({ name: "", price: 0, stock: 1, description: "", image: "" });
    setEditing(false);
  };

  return (
    <div className="max-w-3xl mx-auto py-10">
      <h1 className="font-bold text-2xl mb-4">Panel vendedor</h1>
      <button className="mb-6 px-4 py-2 bg-primary text-white rounded" onClick={() => setEditing(!editing)}>
        {editing ? "Cancelar" : "Agregar producto"}
      </button>
      {editing && (
        <div className="mb-6 p-4 border rounded bg-gray-50">
          <input className="block mb-2 border rounded px-2 py-1 w-full" placeholder="Nombre"
            value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          <input className="block mb-2 border rounded px-2 py-1 w-full" placeholder="Precio"
            type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: +e.target.value }))} />
          <input className="block mb-2 border rounded px-2 py-1 w-full" placeholder="Stock"
            type="number" value={form.stock} onChange={e => setForm(f => ({ ...f, stock: +e.target.value }))} />
          <input className="block mb-2 border rounded px-2 py-1 w-full" placeholder="URL Imagen"
            value={form.image} onChange={e => setForm(f => ({ ...f, image: e.target.value }))} />
          <textarea className="block mb-2 border rounded px-2 py-1 w-full" placeholder="Descripción"
            value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          <button className="bg-primary text-white px-4 py-2 rounded" onClick={handleAdd}>
            Guardar
          </button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {myProducts.map(p => (
          <div key={p.id} className="border rounded p-4 flex flex-col">
            <img src={p.image_urls[0]} alt={p.name} className="w-full mb-2 rounded aspect-video object-cover" />
            <div className="font-bold">{p.name}</div>
            <div className="text-lg text-primary font-semibold">S/{p.price}</div>
            <div className="text-xs">Stock: {p.stock}</div>
            <div className="text-xs mb-2">{p.description}</div>
          </div>
        ))}
        {!myProducts.length && <div className="text-gray-500">Aún no tienes productos</div>}
      </div>
    </div>
  );
};
export default SellerDashboard;
