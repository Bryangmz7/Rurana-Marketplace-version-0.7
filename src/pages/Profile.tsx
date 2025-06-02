
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProfileEditor from '@/components/ProfileEditor';
import OrderHistory from '@/components/OrderHistory';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Package } from 'lucide-react';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/auth');
        return;
      }

      setUser(session.user);

      // Obtener el rol del usuario
      const { data: userData, error } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

      if (error) throw error;
      
      setUserRole(userData.role);
    } catch (error) {
      console.error('Error checking user:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario.",
        variant: "destructive",
      });
      navigate('/');
    } finally {
      setLoading(false);
    }
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

  // Solo mostrar el editor si es buyer o seller
  const canEditProfile = userRole === 'buyer' || userRole === 'seller';

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Mi Perfil</h1>
          <p className="text-gray-600">
            Gestiona tu información personal y revisa tu actividad
          </p>
        </div>

        {canEditProfile ? (
          <Tabs defaultValue="profile" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-96">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Información Personal
              </TabsTrigger>
              <TabsTrigger value="orders" className="flex items-center gap-2">
                <Package className="h-4 w-4" />
                Mis Pedidos
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="profile">
              <ProfileEditor userId={user.id} userRole={userRole as 'buyer' | 'seller'} />
            </TabsContent>
            
            <TabsContent value="orders">
              <OrderHistory userId={user.id} />
            </TabsContent>
          </Tabs>
        ) : (
          <div className="text-center py-8">
            <p className="text-gray-600">Tu tipo de cuenta no permite editar el perfil.</p>
          </div>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
