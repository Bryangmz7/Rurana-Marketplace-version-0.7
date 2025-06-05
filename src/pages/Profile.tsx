
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProfileEditor from '@/components/ProfileEditor';
import OrderHistory from '@/components/OrderHistory';
import { useToast } from '@/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { User, Package, AlertCircle, Loader2 } from 'lucide-react';
import { Card } from '@/components/ui/card';

const Profile = () => {
  const [user, setUser] = useState<any>(null);
  const [userRole, setUserRole] = useState<'buyer' | 'seller' | 'admin'>('buyer');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Checking user session...');
      
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error('Session error:', sessionError);
        throw sessionError;
      }
      
      if (!session) {
        console.log('No session found, redirecting to auth');
        navigate('/auth');
        return;
      }

      console.log('Session found, user ID:', session.user.id);
      setUser(session.user);

      // Obtener el rol del usuario con manejo de errores mejorado
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .maybeSingle();

      if (userError) {
        console.error('Error fetching user role:', userError);
        // Intentar crear el usuario si no existe
        if (userError.code === 'PGRST116') {
          console.log('User not found in users table, creating...');
          const { data: newUser, error: createError } = await supabase
            .from('users')
            .insert([{
              id: session.user.id,
              name: session.user.user_metadata?.name || session.user.email?.split('@')[0] || 'Usuario',
              email: session.user.email || '',
              role: 'buyer'
            }])
            .select()
            .single();

          if (createError) {
            console.error('Error creating user:', createError);
            throw createError;
          }
          
          setUserRole('buyer');
          console.log('User created with buyer role');
        } else {
          throw userError;
        }
      } else if (userData) {
        setUserRole(userData.role);
        console.log('User role loaded:', userData.role);
      } else {
        console.log('No user data found, defaulting to buyer');
        setUserRole('buyer');
      }
    } catch (error: any) {
      console.error('Error in checkUser:', error);
      setError(error.message || 'Error al cargar la información del usuario');
      toast({
        title: "Error",
        description: "No se pudo cargar la información del usuario.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white">
        <Navbar />
        <div className="flex items-center justify-center h-64">
          <div className="flex items-center gap-3">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <span className="text-lg text-gray-600">Cargando perfil...</span>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error al cargar el perfil</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <button
              onClick={checkUser}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary/90"
            >
              Intentar de nuevo
            </button>
          </Card>
        </div>
        <Footer />
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
          {userRole && (
            <div className="mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                {userRole === 'buyer' ? 'Comprador' : userRole === 'seller' ? 'Vendedor' : 'Administrador'}
              </span>
            </div>
          )}
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
                {userRole === 'seller' ? 'Pedidos Recibidos' : 'Mis Pedidos'}
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
          <Card className="p-8 text-center">
            <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Acceso limitado
            </h3>
            <p className="text-gray-600">
              Tu tipo de cuenta ({userRole}) no permite editar el perfil o ver el historial de pedidos.
            </p>
          </Card>
        )}
      </div>
      
      <Footer />
    </div>
  );
};

export default Profile;
