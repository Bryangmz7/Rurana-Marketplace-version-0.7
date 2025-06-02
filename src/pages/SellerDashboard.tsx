
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import StoreSetup from '@/components/StoreSetup';
import ProductManagement from '@/components/ProductManagement';
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
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUserAndStore();
  }, []);

  const checkUserAndStore = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
      navigate('/auth');
      return;
    }

    setUser(session.user);

    // Check if user has seller role
    const { data: userProfile } = await supabase
      .from('users')
      .select('role')
      .eq('id', session.user.id)
      .single();

    if (userProfile?.role !== 'seller') {
      toast({
        title: "Acceso denegado",
        description: "Necesitas una cuenta de vendedor para acceder.",
        variant: "destructive",
      });
      navigate('/');
      return;
    }

    // Check if user has a store
    const { data: storeData } = await supabase
      .from('stores')
      .select('*')
      .eq('user_id', session.user.id)
      .single();

    setStore(storeData);
    setLoading(false);
  };

  const handleStoreCreated = (newStore: Store) => {
    setStore(newStore);
    toast({
      title: "¡Tienda creada!",
      description: "Tu tienda ha sido configurada correctamente.",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {!store ? (
          <StoreSetup userId={user.id} onStoreCreated={handleStoreCreated} />
        ) : (
          <ProductManagement store={store} />
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default SellerDashboard;
