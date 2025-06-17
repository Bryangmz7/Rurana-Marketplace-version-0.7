
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Plus, Search, Edit, Trash2, Package, Clock } from 'lucide-react';
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
      setProducts(products.map(p => p.id === savedProduct.id ? savedProduct : p));
    } else {
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
    <div className="space-y-4">
      {showForm ? (
        <ProductForm
          storeId={store.id}
          product={editingProduct || undefined}
          onSave={handleProductSaved}
          onCancel={handleCancelForm}
        />
      ) : (
        <>
          {/* Header compacto */}
          <div className="bg-white border rounded-lg p-4">
            <div className="flex justify-between items-center mb-3">
              <div>
                <h3 className="text-lg font-semibold">Gestión de productos</h3>
                <p className="text-gray-600 text-sm">
                  {products.length} producto{products.length !== 1 ? 's' : ''} en tu tienda
                </p>
              </div>
              <Button
                onClick={() => setShowForm(true)}
                className="bg-primary hover:bg-primary-600"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Agregar
              </Button>
            </div>
            
            {/* Barra de búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar productos..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-9"
              />
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
              {filteredProducts.map((product) => (
                <Card key={product.id} className="group overflow-hidden hover:shadow-md transition-all duration-300 hover:scale-102">
                  <div className="relative">
                    <div className="aspect-square bg-gray-100 overflow-hidden">
                      {product.image_urls && product.image_urls[0] ? (
                        <img
                          src={product.image_urls[0]}
                          alt={product.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <Package className="h-8 w-8" />
                        </div>
                      )}
                    </div>
                    
                    {/* Botones de acción */}
                    <div className="absolute top-1 right-1 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button 
                        variant="secondary" 
                        size="sm"
                        onClick={() => handleEditProduct(product)}
                        className="bg-white/90 hover:bg-white h-6 w-6 p-0"
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => handleDeleteProduct(product.id)}
                        className="bg-red-500/90 hover:bg-red-500 h-6 w-6 p-0"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    
                    {/* Badge de stock */}
                    <div className="absolute top-1 left-1">
                      <span className={`inline-block text-xs px-1.5 py-0.5 rounded-full text-white ${
                        product.stock > 10 
                          ? 'bg-green-500' 
                          : product.stock > 0 
                            ? 'bg-yellow-500'
                            : 'bg-red-500'
                      }`}>
                        {product.stock}
                      </span>
                    </div>
                  </div>
                  
                  <div className="p-2 space-y-1">
                    <h3 className="font-medium text-sm leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                      {product.name}
                    </h3>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-primary">S/{product.price}</span>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{product.delivery_time}d</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="inline-block bg-gray-100 text-gray-700 text-xs px-1.5 py-0.5 rounded">
                        {product.category}
                      </span>
                      <span className={`text-xs font-medium ${
                        product.stock > 0 ? 'text-green-600' : 'text-red-600'
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
