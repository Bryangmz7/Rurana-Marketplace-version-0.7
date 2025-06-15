
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductCard from '@/components/ProductCard';
import { Store as StoreIcon, Star, MapPin, Loader2, PackageSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Store } from '@/types/store';

// Extended Product type for this page
type Product = {
  id: string;
  name: string;
  description: string;
  price: number;
  image_urls: string[];
  category: string;
  delivery_time: number;
  stock: number;
  store_id: string;
};

const StorePage = () => {
    const { storeId } = useParams<{ storeId: string }>();
    const [store, setStore] = useState<Store | null>(null);
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!storeId) {
            setError("No se encontró el ID de la tienda.");
            setLoading(false);
            return;
        }

        const fetchStoreData = async () => {
            try {
                setLoading(true);
                
                // Fetch store details
                const { data: storeData, error: storeError } = await supabase
                    .from('stores')
                    .select('*')
                    .eq('id', storeId)
                    .single();

                if (storeError) throw new Error("No se pudo encontrar la tienda.");
                setStore(storeData);

                // Fetch products for the store
                const { data: productsData, error: productsError } = await supabase
                    .from('products')
                    .select('id, name, description, price, image_urls, category, delivery_time, stock, store_id')
                    .eq('store_id', storeId);

                if (productsError) throw new Error("No se pudieron cargar los productos de la tienda.");
                setProducts(productsData || []);

            } catch (err: any) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchStoreData();
    }, [storeId]);

    if (loading) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-grow flex items-center justify-center">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                </div>
                <Footer />
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex flex-col min-h-screen">
                <Navbar />
                <div className="flex-grow flex flex-col items-center justify-center text-center px-4">
                    <h2 className="text-2xl font-bold text-red-600 mb-4">Ocurrió un error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Button asChild>
                        <Link to="/marketplace">Volver al Marketplace</Link>
                    </Button>
                </div>
                <Footer />
            </div>
        );
    }
    
    if (!store) {
        return null;
    }

    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Navbar />
            
            <main className="flex-grow container mx-auto px-4 py-8">
                {/* Store Header */}
                <header className="bg-white p-8 rounded-xl shadow-md mb-8 border">
                    <div className="flex flex-col md:flex-row items-center gap-6">
                        {store.logo_url ? (
                            <img src={store.logo_url} alt={`${store.name} logo`} className="w-24 h-24 rounded-full object-cover border-4 border-primary/20" />
                        ) : (
                            <div className="w-24 h-24 bg-primary/10 rounded-full flex items-center justify-center">
                                <StoreIcon className="w-12 h-12 text-primary" />
                            </div>
                        )}
                        <div className="text-center md:text-left">
                            <h1 className="text-4xl font-bold text-gray-900">{store.name}</h1>
                            <p className="text-gray-600 mt-2 max-w-2xl">{store.description || 'Explora los productos únicos de esta tienda.'}</p>
                            <div className="flex items-center justify-center md:justify-start gap-6 mt-4 text-sm text-gray-700">
                                <div className="flex items-center gap-2">
                                    <Star className="h-5 w-5 text-yellow-400 fill-yellow-400" />
                                    <span className="font-semibold">{store.rating.toFixed(1)} de calificación</span>
                                </div>
                                {store.department && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-5 w-5 text-primary" />
                                        <span className="font-semibold">{store.department}</span>
                                    </div>
                                )}
                                {store.category && <Badge variant="secondary">{store.category}</Badge>}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Products Grid */}
                <div>
                    <h2 className="text-2xl font-bold mb-6 text-gray-800">Productos de la tienda</h2>
                    {products.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                            {products.map((product) => (
                                <ProductCard
                                    key={product.id}
                                    id={product.id}
                                    name={product.name}
                                    description={product.description}
                                    price={product.price}
                                    image_urls={product.image_urls}
                                    category={product.category}
                                    delivery_time={product.delivery_time}
                                    stock={product.stock}
                                    store_id={store.id}
                                    store_name={store.name}
                                    store_rating={store.rating}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-16 bg-white rounded-lg border">
                            <PackageSearch className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-medium text-gray-900">Esta tienda aún no tiene productos</h3>
                            <p className="text-gray-500 mt-2">Vuelve pronto para ver sus creaciones.</p>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
};

export default StorePage;
