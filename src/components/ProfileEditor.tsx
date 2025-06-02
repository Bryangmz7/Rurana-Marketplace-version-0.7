
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Building } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';

interface ProfileEditorProps {
  userId: string;
  userRole: 'buyer' | 'seller';
}

const ProfileEditor = ({ userId, userRole }: ProfileEditorProps) => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [userId, userRole]);

  const fetchProfile = async () => {
    try {
      const tableName = userRole === 'seller' ? 'seller_profiles' : 'buyer_profiles';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      setProfile(data);
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: "Error",
        description: "No se pudo cargar el perfil",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const tableName = userRole === 'seller' ? 'seller_profiles' : 'buyer_profiles';
      const { error } = await supabase
        .from(tableName)
        .update(profile)
        .eq('user_id', userId);

      if (error) throw error;

      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar el perfil",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = (url: string) => {
    setProfile({ ...profile, avatar_url: url });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold mb-6 flex items-center gap-2">
        <User className="h-5 w-5" />
        Editar Perfil
      </h3>

      <div className="space-y-6">
        {/* Avatar */}
        <div>
          <Label className="text-sm font-medium mb-2 block">Foto de perfil</Label>
          <ImageUpload
            bucket="user-avatars"
            currentImage={profile?.avatar_url}
            onImageUploaded={handleImageUpload}
            userId={userId}
            singleImage={true}
          />
        </div>

        {/* Información básica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="name" className="text-sm font-medium mb-2 block">
              Nombre completo
            </Label>
            <Input
              id="name"
              value={profile?.name || ''}
              onChange={(e) => setProfile({ ...profile, name: e.target.value })}
              placeholder="Tu nombre completo"
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-2 block">
              Email
            </Label>
            <Input
              id="email"
              type="email"
              value={profile?.email || ''}
              onChange={(e) => setProfile({ ...profile, email: e.target.value })}
              placeholder="tu@email.com"
              icon={<Mail className="h-4 w-4" />}
            />
          </div>

          <div>
            <Label htmlFor="phone" className="text-sm font-medium mb-2 block">
              Teléfono
            </Label>
            <Input
              id="phone"
              value={profile?.phone || ''}
              onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
              placeholder="+51 999 999 999"
              icon={<Phone className="h-4 w-4" />}
            />
          </div>

          <div>
            <Label htmlFor="address" className="text-sm font-medium mb-2 block">
              Dirección
            </Label>
            <Input
              id="address"
              value={profile?.address || ''}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              placeholder="Tu dirección"
              icon={<MapPin className="h-4 w-4" />}
            />
          </div>
        </div>

        {/* Campos específicos para sellers */}
        {userRole === 'seller' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="business_name" className="text-sm font-medium mb-2 block">
                Nombre del negocio
              </Label>
              <Input
                id="business_name"
                value={profile?.business_name || ''}
                onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                placeholder="Nombre de tu negocio"
                icon={<Building className="h-4 w-4" />}
              />
            </div>

            <div>
              <Label htmlFor="business_description" className="text-sm font-medium mb-2 block">
                Descripción del negocio
              </Label>
              <Textarea
                id="business_description"
                value={profile?.business_description || ''}
                onChange={(e) => setProfile({ ...profile, business_description: e.target.value })}
                placeholder="Describe tu negocio..."
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar cambios'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileEditor;
