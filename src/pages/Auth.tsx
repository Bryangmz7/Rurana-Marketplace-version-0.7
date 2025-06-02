import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { ShoppingBag, Store, Eye, EyeOff, Loader2 } from 'lucide-react';

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
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          console.log('User already logged in, checking profile...');
          // Esperar un poco para que el trigger cree el perfil
          setTimeout(async () => {
            try {
              const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', session.user.id)
                .maybeSingle();

              console.log('User profile:', userProfile);

              if (userProfile?.role === 'seller') {
                navigate('/seller-dashboard');
              } else {
                navigate('/marketplace');
              }
            } catch (error) {
              console.log('Profile fetch error:', error);
              navigate('/marketplace');
            }
          }, 1000);
        }
      } catch (error) {
        console.error('Session check error:', error);
      }
    };
    checkUser();
  }, [navigate]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast({
        title: "Error",
        description: "Por favor completa todos los campos requeridos",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Error",
        description: "La contraseña debe tener al menos 6 caracteres",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !selectedRole) {
      toast({
        title: "Error",
        description: "Por favor selecciona si quieres comprar o vender",
        variant: "destructive",
      });
      return;
    }

    if (!isLogin && !name?.trim()) {
      toast({
        title: "Error",
        description: "Por favor ingresa tu nombre completo",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        // Login flow
        console.log('Attempting login...');
        const { error, data } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        
        if (error) {
          throw error;
        }
        
        console.log('Login successful:', data);
        
        toast({
          title: "¡Bienvenido de nuevo!",
          description: "Has iniciado sesión correctamente.",
        });

        // Verificar rol del usuario después de login
        setTimeout(async () => {
          try {
            const { data: userProfile } = await supabase
              .from('users')
              .select('role')
              .eq('id', data.user.id)
              .maybeSingle();

            console.log('User profile after login:', userProfile);

            if (userProfile?.role === 'seller') {
              navigate('/seller-dashboard');
            } else {
              navigate('/marketplace');
            }
          } catch (profileError) {
            console.log('Profile fetch error after login:', profileError);
            navigate('/marketplace');
          }
        }, 500);

      } else {
        // Sign up flow
        console.log('Attempting signup with role:', selectedRole);
        const { error, data } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/marketplace`,
            data: {
              name: name.trim(),
              role: selectedRole
            }
          }
        });
        
        if (error) {
          throw error;
        }
        
        console.log('Signup response:', data);
        
        if (data.user && !data.user.email_confirmed_at) {
          // User needs to confirm email
          toast({
            title: "¡Registro exitoso!",
            description: "Te hemos enviado un email de confirmación. Por favor revisa tu bandeja de entrada.",
          });
          
          // Reset form
          setEmail('');
          setPassword('');
          setName('');
          setSelectedRole(null);
          setIsLogin(true);
          
        } else if (data.user) {
          // User is already confirmed
          console.log('User confirmed, waiting for profile creation...');
          
          toast({
            title: "¡Cuenta creada exitosamente!",
            description: "Tu cuenta ha sido configurada correctamente.",
          });

          // Esperar que el trigger cree el perfil del usuario
          setTimeout(async () => {
            try {
              const { data: userProfile } = await supabase
                .from('users')
                .select('role')
                .eq('id', data.user.id)
                .maybeSingle();

              console.log('Profile created:', userProfile);

              if (userProfile?.role === 'seller' || selectedRole === 'seller') {
                navigate('/seller-dashboard');
              } else {
                navigate('/marketplace');
              }
            } catch (err) {
              console.error('Profile fetch error:', err);
              // Si no se puede obtener el perfil, redirigir según el rol seleccionado
              if (selectedRole === 'seller') {
                navigate('/seller-dashboard');
              } else {
                navigate('/marketplace');
              }
            }
          }, 2000);
        }
      }
    } catch (error: any) {
      console.error('Auth error:', error);
      let errorMessage = "Ocurrió un error durante la autenticación.";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "Credenciales incorrectas. Verifica tu email y contraseña.";
      } else if (error.message?.includes('User already registered')) {
        errorMessage = "Este email ya está registrado. Intenta iniciar sesión.";
      } else if (error.message?.includes('Password should be at least')) {
        errorMessage = "La contraseña debe tener al menos 6 caracteres.";
      } else if (error.message?.includes('Unable to validate email address')) {
        errorMessage = "Email inválido. Verifica el formato.";
      } else if (error.message?.includes('Signup is disabled')) {
        errorMessage = "El registro está temporalmente deshabilitado.";
      } else if (error.message?.includes('Email rate limit exceeded')) {
        errorMessage = "Demasiados intentos. Espera unos minutos antes de volver a intentar.";
      } else if (error.message?.includes('Database error saving new user')) {
        errorMessage = "Error al crear el perfil de usuario. Intenta de nuevo.";
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-100 flex items-center justify-center px-4 py-8">
      <div className="max-w-md w-full bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-gray-200/50">
        <div className="text-center mb-8">
          <div className="mb-6">
            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
              RURANA
            </span>
            <div className="mt-2">
              <span className="text-xs bg-gradient-to-r from-primary to-purple-600 text-white px-3 py-1 rounded-full font-medium">
                AI Powered Marketplace
              </span>
            </div>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
          </h1>
          <p className="text-gray-600 text-lg">
            {isLogin ? 'Accede a tu cuenta de RURANA' : 'Únete a la comunidad RURANA'}
          </p>
        </div>

        {!isLogin && (
          <div className="mb-8">
            <label className="block text-sm font-semibold text-gray-700 mb-4">
              ¿Qué quieres hacer en RURANA?
            </label>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setSelectedRole('buyer')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  selectedRole === 'buyer'
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 text-primary ring-2 ring-primary/20 transform scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-102'
                }`}
              >
                <ShoppingBag className="h-10 w-10 mx-auto mb-3" />
                <div className="font-bold text-lg">Comprar</div>
                <div className="text-sm text-gray-500 mt-2">Descubrir productos únicos</div>
              </button>
              <button
                type="button"
                onClick={() => setSelectedRole('seller')}
                className={`p-6 rounded-2xl border-2 transition-all duration-300 ${
                  selectedRole === 'seller'
                    ? 'border-primary bg-gradient-to-br from-primary/10 to-primary/5 text-primary ring-2 ring-primary/20 transform scale-105'
                    : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 hover:scale-102'
                }`}
              >
                <Store className="h-10 w-10 mx-auto mb-3" />
                <div className="font-bold text-lg">Vender</div>
                <div className="text-sm text-gray-500 mt-2">Crear mi tienda online</div>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleAuth} className="space-y-6">
          {!isLogin && (
            <div>
              <label htmlFor="name" className="block text-sm font-semibold text-gray-700 mb-3">
                Nombre completo *
              </label>
              <Input
                id="name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required={!isLogin}
                placeholder="Tu nombre completo"
                className="h-14 text-base rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary transition-all duration-200"
              />
            </div>
          )}
          
          <div>
            <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-3">
              Correo electrónico *
            </label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="tu@email.com"
              className="h-14 text-base rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary transition-all duration-200"
            />
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-3">
              Contraseña *
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
                className="h-14 text-base rounded-xl border-2 border-gray-200 focus:border-primary focus:ring-primary pr-14 transition-all duration-200"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center hover:bg-gray-50 rounded-r-xl transition-colors"
              >
                {showPassword ? (
                  <EyeOff className="h-6 w-6 text-gray-400" />
                ) : (
                  <Eye className="h-6 w-6 text-gray-400" />
                )}
              </button>
            </div>
            {!isLogin && (
              <p className="text-sm text-gray-500 mt-2">Mínimo 6 caracteres</p>
            )}
          </div>

          <Button
            type="submit"
            className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary-600 hover:to-purple-700 text-white py-4 h-14 rounded-xl text-lg font-bold transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105"
            disabled={loading}
          >
            {loading ? (
              <div className="flex items-center">
                <Loader2 className="animate-spin h-6 w-6 mr-3" />
                {isLogin ? 'Iniciando sesión...' : 'Creando cuenta...'}
              </div>
            ) : (
              isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'
            )}
          </Button>
        </form>

        <div className="mt-8 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setSelectedRole(null);
              setName('');
              setEmail('');
              setPassword('');
            }}
            className="text-primary hover:text-primary-600 font-semibold transition-colors duration-200 text-lg"
          >
            {isLogin 
              ? '¿No tienes cuenta? Regístrate aquí' 
              : '¿Ya tienes cuenta? Inicia sesión aquí'
            }
          </button>
        </div>

        {!isLogin && (
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              Al registrarte, aceptas nuestros términos de servicio y política de privacidad
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Auth;
