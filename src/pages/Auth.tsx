
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Store, Eye, EyeOff } from 'lucide-react';

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [selectedRole, setSelectedRole] = useState<'buyer' | 'seller' | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        navigate('/marketplace');
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !selectedRole) {
      toast({
        title: "Error",
        description: "Selecciona si quieres comprar o vender",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !name) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre",
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
        
        if (error) {
          throw error;
        }
        
        toast({
          title: "¡Bienvenido!",
          description: "Has iniciado sesión correctamente.",
        });

        // Check user role and redirect accordingly
        try {
          const { data: userProfile } = await supabase
            .from('users')
            .select('role')
            .eq('id', data.user.id)
            .maybeSingle();

          if (userProfile?.role === 'seller') {
            navigate('/seller-dashboard');
          } else {
            navigate('/marketplace');
          }
        } catch (profileError) {
          console.log('Profile fetch error:', profileError);
          navigate('/marketplace');
        }
      } else {
        // Sign up flow
        const { error, data } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/marketplace`,
            data: {
              name: name,
              role: selectedRole
            }
          }
        });
        
        if (error) {
          throw error;
        }
        
        // Create user profile immediately after signup
        if (data.user && !data.user.email_confirmed_at) {
          toast({
            title: "¡Cuenta creada!",
            description: "Revisa tu email para confirmar tu cuenta.",
          });
        } else if (data.user) {
          // User is already confirmed, create profile
          try {
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

            toast({
              title: "¡Cuenta creada!",
              description: "Tu cuenta ha sido creada exitosamente.",
            });

            if (selectedRole === 'seller') {
              navigate('/seller-dashboard');
            } else {
              navigate('/marketplace');
            }
          } catch (err) {
            console.error('Profile creation error:', err);
            navigate('/marketplace');
          }
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = "Ocurrió un error durante la autenticación.";
      
      if (error.message.includes('Invalid login credentials')) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message.includes('User already registered')) {
        errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
      } else if (error.message.includes('Password should be at least')) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.message.includes('Unable to validate email address')) {
        errorMessage = "Email inválido. Verifica el formato.";
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-2xl p-8 border border-gray-100">
        <div className="text-center mb-8">
          <div className="mb-4">
            <span className="text-3xl font-bold text-primary">RURANA</span>
            <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
              AI Powered
            </span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
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
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selectedRole === 'buyer'
                    ? 'border-primary bg-primary-50 text-primary ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <ShoppingBag className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">Comprar</div>
                <div className="text-xs text-gray-500 mt-1">Buscar productos únicos</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('seller')}
                className={`p-4 rounded-2xl border-2 transition-all duration-200 ${
                  selectedRole === 'seller'
                    ? 'border-primary bg-primary-50 text-primary ring-2 ring-primary/20'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                }`}
              >
                <Store className="h-8 w-8 mx-auto mb-2" />
                <div className="font-semibold">Vender</div>
                <div className="text-xs text-gray-500 mt-1">Crear mi tienda</div>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-5">
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
                className="h-12 text-base rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
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
              className="h-12 text-base rounded-xl border-gray-300 focus:border-primary focus:ring-primary"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Contraseña
            </label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                minLength={6}
                className="h-12 text-base rounded-xl border-gray-300 focus:border-primary focus:ring-primary pr-12"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center"
              >
                {showPassword ? (
                  <EyeOff className="h-5 w-5 text-gray-400" />
                ) : (
                  <Eye className="h-5 w-5 text-gray-400" />
                )}
              </button>
            </div>
            {!isLogin && (
              <p className="text-xs text-gray-500 mt-1">Mínimo 6 caracteres</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-primary hover:bg-primary-600 text-white py-3 h-12 rounded-xl text-base font-semibold transition-all duration-200 shadow-lg hover:shadow-xl"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                Procesando...
              </div>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setSelectedRole(null);
              setName('');
              setEmail('');
              setPassword('');
            }}
            className="text-primary hover:text-primary-600 font-medium transition-colors duration-200"
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
