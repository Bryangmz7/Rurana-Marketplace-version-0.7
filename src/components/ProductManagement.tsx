
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, MoreVertical, Edit, Trash2, Package } from 'lucide-react';
import ProductForm from '@/components/ProductForm';
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
  stock: number;
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
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, [store.id]);

  useEffect(() => {
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredProducts(filtered);
  }, [products, searchQuery]);

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

  const handleProductSaved = (savedProduct: Product) => {
    if (editingProduct) {
      // Actualizar producto existente
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
    } else {
      // Agregar nuevo producto
      setProducts([savedProduct, ...products]);
    }
    setShowForm(false);
    setEditingProduct(null);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setShowForm(true);
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

  const handleCancelForm = () => {
    setShowForm(false);
    setEditingProduct(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {showForm ? (
        <ProductForm
          storeId={store.id}
          product={editingProduct || undefined}
          onSave={handleProductSaved}
          onCancel={handleCancelForm}
        />
      ) : (
        <>
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">Gestión de productos</h3>
              <p className="text-gray-600 text-sm">
                {products.length} producto{products.length !== 1 ? 's' : ''} en tu tienda
              </p>
            </div>
            <div className="flex gap-4 items-center">
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar productos..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary-600"
              >
                <Plus className="h-5 w-5 mr-2" />
                Agregar producto
              </Button>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <Card className="p-8 text-center">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {products.length === 0 ? 'Aún no tienes productos' : 'No se encontraron productos'}
              </h3>
              <p className="text-gray-600 mb-4">
                {products.length === 0 
                  ? 'Comienza agregando tu primer producto a la tienda.'
                  : 'Intenta con otros términos de búsqueda.'
                }
              </p>
              {products.length === 0 && (
                <Button
                  onClick={() => setShowForm(true)}
                  className="bg-primary hover:bg-primary-600"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Agregar primer producto
                </Button>
              )}
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((product) => (
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
                        <Package className="h-12 w-12" />
                      </div>
                    )}
                    <div className="absolute top-2 right-2">
                      <div className="relative group">
                        <Button variant="ghost" size="sm" className="bg-white/80 hover:bg-white">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                        <div className="absolute right-0 mt-1 w-32 bg-white rounded-md shadow-lg border opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                          <button 
                            onClick={() => handleEditProduct(product)}
                            className="flex items-center w-full px-3 py-2 text-sm text-gray-700 hover:bg-gray-100"
                          >
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
                    
                    {/* Badge de stock */}
                    <div className="absolute top-2 left-2">
                      <span className={`inline-block text-xs px-2 py-1 rounded-full ${
                        product.stock > 10 
                          ? 'bg-green-100 text-green-800' 
                          : product.stock > 0 
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-red-100 text-red-800'
                      }`}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-lg mb-1">{product.name}</h3>
                    <p className="text-gray-600 text-sm mb-2 line-clamp-2">{product.description}</p>
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-lg font-bold text-primary">S/{product.price}</span>
                      <span className="text-sm text-gray-500">{product.delivery_time} días</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded">
                        {product.category}
                      </span>
                      <span className={`text-xs font-medium ${
                        product.stock > 10 
                          ? 'text-green-600' 
                          : product.stock > 0 
                            ? 'text-yellow-600'
                            : 'text-red-600'
                      }`}>
                        {product.stock > 0 ? 'Disponible' : 'Agotado'}
                      </span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default ProductManagement;
