
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Plus, MoreVertical, Edit, Trash2 } from 'lucide-react';
import AddProductForm from '@/components/AddProductForm';
import { useToast } from '@/hooks/use-toast';

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  created_at: string;
}

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  delivery_time: number;
  created_at: string;
}

interface ProductManagementProps {
  store: Store;
}

const ProductManagement = ({ store }: ProductManagementProps) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [store.id]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('store_id', store.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProductAdded = (newProduct: Product) => {
    setProducts([newProduct, ...products]);
    setShowAddForm(false);
    toast({
      title: "Producto agregado",
      description: "El producto se ha agregado correctamente a tu tienda.",
    });
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm('¿Estás seguro de que quieres eliminar este producto?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', productId);

      if (error) throw error;

      setProducts(products.filter(p => p.id !== productId));
      toast({
        title: "Producto eliminado",
        description: "El producto se ha eliminado correctamente.",
      });
    } catch (error) {
      console.error('Error deleting product:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar el producto.",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {store.name}
          </h1>
          <p className="text-gray-600">{store.description}</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          className="bg-primary hover:bg-primary-600"
        >
          <Plus className="h-5 w-5 mr-2" />
          Agregar producto
        </Button>
      </div>

      {showAddForm && (
        <div className="mb-8">
          <AddProductForm
            storeId={store.id}
            onProductAdded={handleProductAdded}
            onCancel={() => setShowAddForm(false)}
          />
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map((product) => (
          <Card key={product.id} className="overflow-hidden">
            <div className="aspect-square bg-gray-100 relative">
              {product.image_urls && product.image_urls[0] ? (
                <img
                  src={product.image_urls[0]}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                  Sin imagen
                </div>
              )}
              <div className="absolute top-2 right-2">
                <div className="relative group">
                  <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                  <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <button className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100">
                      <Edit className="h-4 w-4 mr-2" />
                      Editar
                    </button>
                    <button 
                      onClick={() => handleDeleteProduct(product.id)}
                      className="flex items-center w-full px-3 py-2 text-sm text-red-600 hover:bg-gray-100"
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Eliminar
                    </button>
                  </div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
              <div className="flex justify-between items-center">
                <span className="text-lg font-bold text-primary">S/{product.price}</span>
                <span className="text-sm text-gray-500">{product.delivery_time} días</span>
              </div>
              <div className="mt-2">
                <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                  {product.category}
                </span>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {products.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg mb-4">Aún no tienes productos en tu tienda</p>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-primary hover:bg-primary-600"
          >
            <Plus className="h-5 w-5 mr-2" />
            Agregar tu primer producto
          </Button>
        </div>
      )}
    </div>
  );
};

export default ProductManagement;
