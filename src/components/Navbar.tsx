
import { useState, useEffect } from 'react';
import { Search, ShoppingCart, User, LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';

const Navbar = () => {
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Get initial session
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };
    
    getSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user || null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast({
        title: "Error",
        description: "No se pudo cerrar sesión",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Sesión cerrada",
        description: "Has cerrado sesión correctamente",
      });
      navigate('/');
    }
  };

  const handleMarketplaceClick = () => {
    navigate('/marketplace');
  };

  const handleAuthClick = () => {
    navigate('/auth');
  };

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center">
            <div className="flex-shrink-0 cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-2xl font-bold text-primary">RURANA</span>
              <span className="ml-2 text-xs bg-primary-100 text-primary-600 px-2 py-1 rounded-full">
                AI Powered
              </span>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-lg mx-8">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <Input
                type="text"
                placeholder="Buscar productos..."
                className="pl-10 w-full"
              />
            </div>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={handleMarketplaceClick}>
              Marketplace
            </Button>
            <Button variant="ghost" size="sm">
              Personalizador
            </Button>
            <Button variant="ghost" size="sm">
              <ShoppingCart className="h-5 w-5" />
            </Button>
            
            {user ? (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm">
                  <User className="h-5 w-5" />
                </Button>
                <Button variant="ghost" size="sm" onClick={handleSignOut}>
                  <LogOut className="h-5 w-5" />
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={handleAuthClick}>
                <User className="h-5 w-5" />
                Iniciar Sesión
              </Button>
            )}
            
            <Button className="bg-primary hover:bg-primary-600">
              Vender
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
