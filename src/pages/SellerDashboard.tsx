
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
import CustomerManagement from '@/components/CustomerManagement';
import { useToast } from '@/hooks/use-toast';

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  created_at: string;
}

const SellerDashboard = () => {
  const [store, setStore] = useState<Store | null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('overview');
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

      // Check if user has seller role
      const { data: userProfile, error: profileError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error fetching user profile:', profileError);
        toast({
          title: "Error",
          description: "No se pudo verificar tu perfil de usuario.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      if (!userProfile || userProfile.role !== 'seller') {
        toast({
          title: "Acceso denegado",
          description: "Necesitas una cuenta de vendedor para acceder a esta página.",
          variant: "destructive",
        });
        navigate('/');
        return;
      }

      // Check if user has a store
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

  const renderTabContent = () => {
    if (!store) return null;

    switch (activeTab) {
      case 'overview':
        return <StoreOverview storeId={store.id} />;
      case 'products':
        return <ProductManagement store={store} />;
      case 'store':
        return <StoreManagement store={store} onStoreUpdated={handleStoreUpdated} />;
      case 'customers':
        return <CustomerManagement storeId={store.id} />;
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
          <StoreSetup userId={user.id} onStoreCreated={handleStoreCreated} />
        </div>
      ) : (
        <>
          <StoreNavigation 
            activeTab={activeTab} 
            onTabChange={setActiveTab} 
            storeName={store.name}
          />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {renderTabContent()}
          </div>
        </>
      )}
      
      <Footer />
    </div>
  );
};

export default SellerDashboard;
