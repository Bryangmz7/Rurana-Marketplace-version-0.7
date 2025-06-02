
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Edit, Save, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  created_at: string;
}

interface StoreManagementProps {
  store: Store;
  onStoreUpdated: (store: Store) => void;
}

const StoreManagement = ({ store, onStoreUpdated }: StoreManagementProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: store.name,
    description: store.description || ''
  });
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const categories = [
    'Peluches',
    'Arte Digital',
    'Cerámica',
    'Textil',
    'Bordados',
    'Joyería',
    'Decoración',
    'Otros'
  ];

  const handleSave = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('stores')
        .update({
          name: formData.name,
          description: formData.description
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
      description: store.description || ''
    });
    setIsEditing(false);
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

        <div className="space-y-4">
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

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Configuración adicional</h3>
        <div className="text-gray-600">
          <p className="mb-2">• Logo de la tienda: Próximamente disponible</p>
          <p className="mb-2">• Políticas de envío: Configura en el futuro</p>
          <p>• Métodos de pago: Se configurarán más adelante</p>
        </div>
      </Card>
    </div>
  );
};

export default StoreManagement;
