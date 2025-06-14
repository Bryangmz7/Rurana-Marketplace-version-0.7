
-- 1. Activar RLS en usuarios y perfiles
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.buyer_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.seller_profiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para que cada usuario sólo vea y modifique su propio usuario/perfil
CREATE POLICY "Usuarios pueden ver su propio user" ON public.users
  FOR SELECT USING (id = auth.uid());

CREATE POLICY "Usuarios pueden actualizar su propio user" ON public.users
  FOR UPDATE USING (id = auth.uid());

CREATE POLICY "Compradores pueden ver su buyer_profile" ON public.buyer_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Compradores pueden modificar su buyer_profile" ON public.buyer_profiles
  FOR UPDATE USING (user_id = auth.uid());

CREATE POLICY "Vendedores pueden ver su seller_profile" ON public.seller_profiles
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Vendedores pueden modificar su seller_profile" ON public.seller_profiles
  FOR UPDATE USING (user_id = auth.uid());

-- (Repite el patrón para otras tablas sensibles según necesidad, por ejemplo, orders y products)
