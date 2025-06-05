
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone, MapPin, Building, MessageSquare, AlertCircle } from 'lucide-react';
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
  const [hasChanges, setHasChanges] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchProfile();
  }, [userId, userRole]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      console.log(`Fetching ${userRole} profile for user:`, userId);
      
      const tableName = userRole === 'seller' ? 'seller_profiles' : 'buyer_profiles';
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error(`Error fetching ${userRole} profile:`, error);
        throw error;
      }

      if (!data) {
        console.log(`No ${userRole} profile found, creating default profile`);
        // Crear perfil por defecto si no existe
        const defaultProfile = {
          user_id: userId,
          name: '',
          email: '',
          phone: '',
          ...(userRole === 'seller' ? {
            business_name: '',
            business_description: ''
          } : {
            address: ''
          })
        };
        
        const { data: newProfile, error: createError } = await supabase
          .from(tableName)
          .insert([defaultProfile])
          .select()
          .single();

        if (createError) {
          console.error(`Error creating ${userRole} profile:`, createError);
          throw createError;
        }
        
        setProfile(newProfile);
      } else {
        console.log(`${userRole} profile loaded:`, data);
        setProfile(data);
      }
    } catch (error: any) {
      console.error('Error in fetchProfile:', error);
      toast({
        title: "Error",
        description: `No se pudo cargar el perfil: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile || !hasChanges) return;
    
    setSaving(true);
    try {
      console.log('Saving profile changes:', profile);
      
      const tableName = userRole === 'seller' ? 'seller_profiles' : 'buyer_profiles';
      const { data, error } = await supabase
        .from(tableName)
        .update(profile)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating profile:', error);
        throw error;
      }

      console.log('Profile updated successfully:', data);
      setProfile(data);
      setHasChanges(false);
      
      toast({
        title: "Perfil actualizado",
        description: "Los cambios se han guardado correctamente",
      });
    } catch (error: any) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: `No se pudo actualizar el perfil: ${error.message}`,
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setProfile((prev: any) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleImageUpload = (url: string) => {
    handleInputChange('avatar_url', url);
  };

  const formatPhoneNumber = (value: string) => {
    const cleaned = value.replace(/\D/g, '');
    if (cleaned.length <= 9) {
      return cleaned.replace(/(\d{3})(\d{3})(\d{3})/, '$1 $2 $3').trim();
    }
    return cleaned;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhoneNumber(e.target.value);
    handleInputChange('phone', formatted);
  };

  const testWhatsApp = () => {
    if (!profile?.phone) {
      toast({
        title: "Número requerido",
        description: "Primero debes agregar tu número de teléfono",
        variant: "destructive",
      });
      return;
    }

    const cleanPhone = profile.phone.replace(/[^\d]/g, '');
    let whatsappNumber = cleanPhone;
    if (!whatsappNumber.startsWith('51') && whatsappNumber.length === 9) {
      whatsappNumber = '51' + whatsappNumber;
    }

    const testMessage = "Hola, este es un mensaje de prueba desde mi perfil.";
    const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(testMessage)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!profile) {
    return (
      <Card className="p-6">
        <div className="flex items-center gap-2 text-red-600">
          <AlertCircle className="h-5 w-5" />
          <span>No se pudo cargar el perfil</span>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Editar Perfil {userRole === 'seller' ? '(Vendedor)' : '(Comprador)'}
        </h3>
        {hasChanges && (
          <div className="flex items-center gap-2 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span className="text-sm">Cambios sin guardar</span>
          </div>
        )}
      </div>

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
              Nombre completo *
            </Label>
            <Input
              id="name"
              value={profile?.name || ''}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Tu nombre completo"
              required
            />
          </div>

          <div>
            <Label htmlFor="email" className="text-sm font-medium mb-2 block">
              Email *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="tu@email.com"
                className="pl-10"
                required
              />
            </div>
          </div>
        </div>

        {/* Información de contacto */}
        <div className="space-y-4">
          <h4 className="text-md font-medium text-gray-900 border-b pb-2">
            Información de Contacto
          </h4>
          
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex items-start gap-3">
              <MessageSquare className="h-5 w-5 text-blue-600 mt-0.5" />
              <div className="flex-1">
                <h5 className="font-medium text-blue-900 mb-1">WhatsApp para comunicación</h5>
                <p className="text-sm text-blue-700 mb-3">
                  Tu número de WhatsApp será usado para que los {userRole === 'seller' ? 'clientes' : 'vendedores'} puedan contactarte sobre los pedidos.
                </p>
                
                <div className="space-y-3">
                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium mb-2 block text-blue-900">
                      Número de WhatsApp *
                    </Label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="phone"
                          value={profile?.phone || ''}
                          onChange={handlePhoneChange}
                          placeholder="999 999 999"
                          className="pl-10"
                          maxLength={11}
                        />
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={testWhatsApp}
                        disabled={!profile?.phone}
                        className="text-green-600 border-green-600 hover:bg-green-50"
                      >
                        Probar
                      </Button>
                    </div>
                    <p className="text-xs text-blue-600 mt-1">
                      Formato: 999 999 999 (sin código de país)
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {userRole === 'buyer' && (
            <div>
              <Label htmlFor="address" className="text-sm font-medium mb-2 block">
                Dirección
              </Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="address"
                  value={profile?.address || ''}
                  onChange={(e) => handleInputChange('address', e.target.value)}
                  placeholder="Tu dirección"
                  className="pl-10"
                />
              </div>
            </div>
          )}
        </div>

        {/* Campos específicos para sellers */}
        {userRole === 'seller' && (
          <div className="space-y-4">
            <h4 className="text-md font-medium text-gray-900 border-b pb-2">
              Información del Negocio
            </h4>
            
            <div>
              <Label htmlFor="business_name" className="text-sm font-medium mb-2 block">
                Nombre del negocio *
              </Label>
              <div className="relative">
                <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="business_name"
                  value={profile?.business_name || ''}
                  onChange={(e) => handleInputChange('business_name', e.target.value)}
                  placeholder="Nombre de tu negocio"
                  className="pl-10"
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="business_description" className="text-sm font-medium mb-2 block">
                Descripción del negocio
              </Label>
              <Textarea
                id="business_description"
                value={profile?.business_description || ''}
                onChange={(e) => handleInputChange('business_description', e.target.value)}
                placeholder="Describe tu negocio..."
                rows={3}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-3">
          {hasChanges && (
            <Button 
              variant="outline" 
              onClick={() => {
                fetchProfile();
                setHasChanges(false);
              }}
              disabled={saving}
            >
              Cancelar
            </Button>
          )}
          <Button 
            onClick={handleSave} 
            disabled={saving || !hasChanges}
            className={hasChanges ? 'bg-green-600 hover:bg-green-700' : ''}
          >
            {saving ? 'Guardando...' : hasChanges ? 'Guardar cambios' : 'Sin cambios'}
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default ProfileEditor;
