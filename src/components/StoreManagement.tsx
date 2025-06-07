
import { useState } from 'react';
import { supabase, notifySupabaseMissing } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ImageUpload from './ImageUpload';

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  created_at: string;
  user_id: string;
}

interface StoreManagementProps {
  store: Store;
  onStoreUpdated: (store: Store) => void;
}

const StoreManagement = ({ store, onStoreUpdated }: StoreManagementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: store.name,
    description: store.description || '',
    logo_url: store.logo_url || ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    setLoading(true);

    if (!supabase) {
      notifySupabaseMissing();
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          description: formData.description,
          logo_url: formData.logo_url
        })
        .eq('id', store.id)
        .select()
        .single();

      if (error) throw error;

      onStoreUpdated(data);
      setIsEditing(false);
      toast({
        title: "Tienda actualizada",
        description: "Los cambios se han guardado correctamente.",
      });
    } catch (error) {
      console.error('Error updating store:', error);
      toast({
        title: "Error",
        description: "No se pudo actualizar la tienda.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: store.name,
      description: store.description || '',
      logo_url: store.logo_url || ''
    });
    setIsEditing(false);
  };

  const handleLogoUpload = (url: string) => {
    setFormData({ ...formData, logo_url: url });
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex justify-between items-start mb-6">
          <h3 className="text-lg font-semibold">Información de la tienda</h3>
          {!isEditing ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditing(true)}
            >
              <Edit className="h-4 w-4 mr-2" />
              Editar
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={handleSave}
                disabled={loading}
              >
                <Save className="h-4 w-4 mr-2" />
                {loading ? 'Guardando...' : 'Guardar'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleCancel}
                disabled={loading}
              >
                <X className="h-4 w-4 mr-2" />
                Cancelar
              </Button>
            </div>
          )}
        </div>

        <div className="space-y-6">
          {/* Logo de la tienda */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Logo de la tienda
            </label>
            {isEditing ? (
              <ImageUpload
                bucket="store-logos"
                currentImage={formData.logo_url}
                onImageUploaded={handleLogoUpload}
                userId={store.user_id}
                singleImage={true}
              />
            ) : (
              <div className="flex items-center gap-4">
                {store.logo_url ? (
                  <img
                    src={store.logo_url}
                    alt="Logo de la tienda"
                    className="w-16 h-16 object-cover rounded-lg border"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg border flex items-center justify-center">
                    <span className="text-gray-400 text-xs">Sin logo</span>
                  </div>
                )}
                <p className="text-gray-600 text-sm">
                  {store.logo_url ? 'Logo actual' : 'No hay logo configurado'}
                </p>
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Nombre de la tienda
            </label>
            {isEditing ? (
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Nombre de tu tienda"
              />
            ) : (
              <p className="text-gray-900 font-medium">{store.name}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descripción
            </label>
            {isEditing ? (
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe tu tienda y lo que vendes..."
                rows={4}
              />
            ) : (
              <p className="text-gray-700">{store.description || 'Sin descripción'}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Calificación
              </label>
              <p className="text-lg font-semibold text-yellow-600">
                ⭐ {store.rating.toFixed(1)}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha de creación
              </label>
              <p className="text-gray-700">
                {new Date(store.created_at).toLocaleDateString()}
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                Activa
              </span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default StoreManagement;
