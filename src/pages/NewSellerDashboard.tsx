
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StoreSetup from '@/components/StoreSetup';
import StoreNavigation from '@/components/StoreNavigation';
import StoreOverview from '@/components/StoreOverview';
import ProductManagement from '@/components/ProductManagement';
import StoreManagement from '@/components/StoreManagement';
import NewOrderManagement from '@/components/NewOrderManagement';
import CustomProductForm from '@/components/CustomProductForm';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Plus, Package, Settings, BarChart3, ShoppingBag } from 'lucide-react';

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  created_at: string;
  user_id: string;
}

interface SellerProfile {
  id: string;
  user_id: string;
  name: string;
  email: string;
  business_name: string;
  business_description?: string;
  verified: boolean;
}

const NewSellerDashboard = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [sellerProfile, setSellerProfile] = useState<SellerProfile | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [showProductForm, setShowProductForm] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserAndStore();
  }, []);

  const checkUserAndStore = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Verificar si el usuario tiene perfil de vendedor
      const { data: sellerProfileData, error: sellerError } = await supabase
        .from('seller_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (sellerError) {
        console.error('Error fetching seller profile:', sellerError);
        toast({
          title: "Error",
          description: "No se pudo verificar tu perfil de vendedor.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (!sellerProfileData) {
        toast({
          title: "Acceso denegado",
          description: "Necesitas una cuenta de vendedor para acceder a esta página.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      setSellerProfile(sellerProfileData);

      // Verificar si el vendedor tiene una tienda
      const { data: storeData, error: storeError } = await supabase
        .from('stores')
        .select('*')
        .eq('user_id', session.user.id)
        .maybeSingle();

      if (storeError) {
        console.error('Error fetching store:', storeError);
      }

      setStore(storeData);
    } catch (error) {
      console.error('Error in checkUserAndStore:', error);
      toast({
        title: "Error",
        description: "Ocurrió un error al cargar la página.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
  };

  const handleStoreCreated = (newStore: Store) => {
    setStore(newStore);
    setActiveTab('products');
    toast({
      title: "¡Tienda creada exitosamente!",
      description: "Tu tienda ha sido configurada correctamente. Ahora puedes comenzar a agregar productos.",
    });
  };

  const handleStoreUpdated = (updatedStore: Store) => {
    setStore(updatedStore);
  };

  const handleProductCreated = () => {
    setShowProductForm(false);
    setActiveTab('products');
    toast({
      title: "Producto creado",
      description: "El producto personalizable ha sido agregado a tu tienda",
    });
  };

  const renderTabContent = () => {
    if (!store) return null;

    if (showProductForm) {
      return (
        <CustomProductForm
          storeId={store.id}
          onProductCreated={handleProductCreated}
          onCancel={() => setShowProductForm(false)}
        />
      );
    }

    switch (activeTab) {
      case 'overview':
        return <StoreOverview storeId={store.id} />;
      case 'products':
        return <ProductManagement store={store} />;
      case 'store':
        return <StoreManagement store={store} onStoreUpdated={handleStoreUpdated} />;
      case 'orders':
        return <NewOrderManagement storeId={store.id} />;
      default:
        return <StoreOverview storeId={store.id} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-gray-600">Cargando tu panel de vendedor...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      {!store ? (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Bienvenido, {sellerProfile?.name}
            </h1>
            <p className="text-gray-600">
              Negocio: {sellerProfile?.business_name}
              {sellerProfile?.verified && (
                <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                  Verificado
                </span>
              )}
            </p>
          </div>
          <StoreSetup userId={user.id} onStoreCreated={handleStoreCreated} />
        </div>
      ) : (
        <>
          {/* Navigation mejorada */}
          <div className="bg-white border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex items-center justify-between py-4">
                <div className="flex items-center space-x-8">
                  <div>
                    <h1 className="text-xl font-bold text-gray-900">{store.name}</h1>
                    <p className="text-sm text-gray-500">Panel de gestión</p>
                  </div>
                  
                  <nav className="flex space-x-8">
                    <button
                      onClick={() => setActiveTab('overview')}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'overview'
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <BarChart3 className="h-4 w-4 mr-2" />
                      Resumen
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('products')}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'products'
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Productos
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('orders')}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'orders'
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <ShoppingBag className="h-4 w-4 mr-2" />
                      Pedidos
                    </button>
                    
                    <button
                      onClick={() => setActiveTab('store')}
                      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md ${
                        activeTab === 'store'
                          ? 'bg-primary text-white'
                          : 'text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Configuración
                    </button>
                  </nav>
                </div>
                
                <div className="flex items-center space-x-4">
                  <Button
                    onClick={() => setShowProductForm(true)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Producto Personalizable
                  </Button>
                </div>
              </div>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderTabContent()}
          </div>
        </>
      )}
      
      <Footer />
    </div>
  );
};

export default NewSellerDashboard;
