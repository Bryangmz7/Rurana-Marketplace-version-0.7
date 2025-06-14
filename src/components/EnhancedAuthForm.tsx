import React from 'react';
import { useToast } from '@/hooks/use-toast';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { supabase } from '@/integrations/supabase/client';
import { Icons } from './Icons';
import LoginForm from './LoginForm';
import SignupForm from './SignupForm';

const EnhancedAuthForm = () => {
  const [isLogin, setIsLogin] = React.useState(true);

  const handleAuthSuccess = () => {
    // Redirigir o actualizar interfaz tras login/signup
    window.location.href = "/";
  };

  return (
    <div className="max-w-md mx-auto rounded border p-6 bg-white">
      <h2 className="text-2xl font-bold mb-4 text-center">
        {isLogin ? 'Iniciar Sesión' : 'Crear Cuenta'}
      </h2>

      {isLogin
        ? <LoginForm onSuccess={handleAuthSuccess} />
        : <SignupForm onSuccess={handleAuthSuccess} />
      }

      <div className="flex justify-center mt-4 text-sm">
        {isLogin ? (
          <>
            ¿No tienes cuenta?
            <button
              className="text-primary font-semibold ml-1 hover:underline"
              onClick={() => setIsLogin(false)}
            >
              Registrar
            </button>
          </>
        ) : (
          <>
            ¿Ya tienes cuenta?
            <button
              className="text-primary font-semibold ml-1 hover:underline"
              onClick={() => setIsLogin(true)}
            >
              Iniciar sesión
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default EnhancedAuthForm;
