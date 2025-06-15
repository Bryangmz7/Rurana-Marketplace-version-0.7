
import { useState, useEffect } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export const useAuth = () => {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setAuthState({ user: null, loading: false, error: error.message });
          return;
        }

        setAuthState({ user: session?.user || null, loading: false, error: null });
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setAuthState({ user: null, loading: false, error: 'Error loading session' });
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.id);
        setAuthState({ user: session?.user || null, loading: false, error: null });
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    try {
      setAuthState(prev => ({ ...prev, loading: true }));
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('Error signing out:', error);
        setAuthState(prev => ({ ...prev, loading: false, error: error.message }));
        return;
      }
      
      setAuthState({ user: null, loading: false, error: null });
    } catch (error) {
      console.error('Error in signOut:', error);
      setAuthState(prev => ({ ...prev, loading: false, error: 'Error signing out' }));
    }
  };

  return {
    ...authState,
    signOut,
  };
};
