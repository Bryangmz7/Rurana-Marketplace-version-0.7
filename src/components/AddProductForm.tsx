
import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { X, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AddProductFormProps {
  storeId: string;
  onProductAdded: (product: any) => void;
  onCancel: () => void;
}

const AddProductForm = ({ storeId, onProductAdded, onCancel }: AddProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    delivery_time: ''
  });
  const [images, setImages] = useState<File[]>([]);
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

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (images.length + files.length > 5) {
      toast({
        title: "Límite de imágenes",
        description: "Puedes subir máximo 5 imágenes por producto.",
        variant: "destructive",
      });
      return;
    }
    setImages([...images, ...files]);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // For now, we'll create the product without image upload
      // In a real implementation, you'd upload images to Supabase Storage first
      const { data, error } = await supabase
        .from('products')
        .insert([
          {
            store_id: storeId,
            name: formData.name,
            description: formData.description,
            price: parseFloat(formData.price),
            category: formData.category,
            delivery_time: parseInt(formData.delivery_time),
            image_urls: [] // Will be populated when image upload is implemented
          }
        ])
        .select()
        .single();

      if (error) throw error;

      onProductAdded(data);
    } catch (error: any) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Agregar nuevo producto</h2>
        <Button variant="ghost" size="sm" onClick={onCancel}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre del producto *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ej: Peluche personalizado"
              required
            />
          </div>

          <div>
            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-2">
              Precio (S/) *
            </label>
            <Input
              id="price"
              type="number"
              step="0.01"
              min="0"
              value={formData.price}
              onChange={(e) => handleInputChange('price', e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción *
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe tu producto, materiales, proceso de personalización..."
            rows={4}
            required
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
              Categoría *
            </label>
            <select
              id="category"
              value={formData.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              required
            >
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="delivery_time" className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de entrega (días) *
            </label>
            <Input
              id="delivery_time"
              type="number"
              min="1"
              value={formData.delivery_time}
              onChange={(e) => handleInputChange('delivery_time', e.target.value)}
              placeholder="7"
              required
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imágenes del producto (máximo 5)
          </label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-6">
            <div className="text-center">
              <Upload className="mx-auto h-12 w-12 text-gray-400" />
              <div className="mt-2">
                <label htmlFor="images" className="cursor-pointer">
                  <span className="text-primary hover:text-primary-600 font-medium">
                    Seleccionar archivos
                  </span>
                  <input
                    id="images"
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500">o arrastra y suelta aquí</p>
              </div>
              <p className="text-xs text-gray-500 mt-2">PNG, JPG, GIF hasta 10MB</p>
            </div>
          </div>

          {images.length > 0 && (
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {images.map((image, index) => (
                <div key={index} className="relative">
                  <img
                    src={URL.createObjectURL(image)}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-20 object-cover rounded-md"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeImage(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 p-0"
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4 pt-6">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            className="flex-1"
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            className="flex-1 bg-primary hover:bg-primary-600"
            disabled={loading}
          >
            {loading ? 'Agregando...' : 'Agregar producto'}
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default AddProductForm;
