
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Store } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/');
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isLogin && !selectedRole) {
      toast({
        title: "Error",
        description: "Selecciona si quieres comprar o vender",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error, data } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (error) throw error;
        
        // Check user role and redirect accordingly
        const { data: userProfile } = await supabase
          .from('users')
          .select('role')
          .eq('id', data.user.id)
          .single();

        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        if (userProfile?.role === 'seller') {
          navigate('/seller-dashboard');
        } else {
          navigate('/marketplace');
        }
      } else {
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              name: name,
              role: selectedRole
            }
          }
        });
        
        if (error) throw error;
        
        // Create user profile
        if (data.user) {
          const { error: profileError } = await supabase
            .from('users')
            .insert([
              {
                id: data.user.id,
                name: name,
                email: email,
                role: selectedRole
              }
            ]);
          
          if (profileError) {
            console.error('Error creating profile:', profileError);
          }
        }
        
        toast({
          title: "¡Cuenta creada!",
          description: "Revisa tu email para confirmar tu cuenta.",
        });
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      toast({
        title: "Error",
        description: error.message || "Ocurrió un error durante la autenticación.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-blue-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-gray-600">
            {isLogin ? 'Accede a tu cuenta de RURANA' : 'Únete a la comunidad RURANA'}
          </p>
        </div>

        {!isLogin && (
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              ¿Qué quieres hacer?
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setSelectedRole('buyer')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedRole === 'buyer'
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium">Comprar</div>
                <div className="text-xs text-gray-500">Buscar productos únicos</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('seller')}
                className={`p-4 rounded-xl border-2 transition-all ${
                  selectedRole === 'seller'
                    ? 'border-primary bg-primary-50 text-primary'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <Store className="h-8 w-8 mx-auto mb-2" />
                <div className="font-medium">Vender</div>
                <div className="text-xs text-gray-500">Crear mi tienda</div>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Nombre completo
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Tu nombre completo"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
              Correo electrónico
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-600 text-white py-3 rounded-xl"
            disabled={loading}
          >
            {loading ? 'Procesando...' : (isLogin ? 'Iniciar Sesión' : 'Crear Cuenta')}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-primary hover:text-primary-600 font-medium"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate aquí' 
              : '¿Ya tienes cuenta? Inicia sesión aquí'
            }
          </button>
        </div>
      </div>
    </div>
  );
};

export default Auth;
