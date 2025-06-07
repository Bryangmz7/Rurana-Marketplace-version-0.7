
import { useState } from 'react';
import { supabase, notifySupabaseMissing } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import ProductImageUpload from './ProductImageUpload';

interface Product {
  id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  delivery_time: number;
  image_urls?: string[];
}

interface ProductFormProps {
  storeId: string;
  product?: Product;
  onSave: (product: Product) => void;
  onCancel: () => void;
}

const ProductForm = ({ storeId, product, onSave, onCancel }: ProductFormProps) => {
  const [formData, setFormData] = useState({
    name: product?.name || '',
    description: product?.description || '',
    price: product?.price?.toString() || '',
    stock: product?.stock?.toString() || '',
    category: product?.category || '',
    delivery_time: product?.delivery_time?.toString() || ''
  });
  const [imageUrl, setImageUrl] = useState(product?.image_urls?.[0] || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.price || !formData.stock || !formData.category) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    if (!supabase) {
      notifySupabaseMissing();
      setLoading(false);
      return;
    }

    try {
      const productData = {
        store_id: storeId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
        delivery_time: parseInt(formData.delivery_time) || 7,
        image_urls: imageUrl ? [imageUrl] : []
      };

      let data;
      if (product?.id) {
        // Actualizar producto existente
        const { data: updatedProduct, error } = await supabase
          .from('products')
          .update(productData)
          .eq('id', product.id)
          .select()
          .single();
        
        if (error) throw error;
        data = updatedProduct;
      } else {
        // Crear nuevo producto
        const { data: newProduct, error } = await supabase
          .from('products')
          .insert([productData])
          .select()
          .single();
        
        if (error) throw error;
        data = newProduct;
      }

      onSave(data);
      toast({
        title: product?.id ? "Producto actualizado" : "Producto creado",
        description: `El producto se ha ${product?.id ? 'actualizado' : 'creado'} correctamente.`,
      });
    } catch (error: any) {
      console.error('Error saving product:', error);
      toast({
        title: "Error",
        description: "No se pudo guardar el producto. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">
          {product?.id ? 'Editar producto' : 'Agregar nuevo producto'}
        </h2>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="stock" className="block text-sm font-medium text-gray-700 mb-2">
              Stock disponible *
            </label>
            <Input
              id="stock"
              type="number"
              min="0"
              value={formData.stock}
              onChange={(e) => handleInputChange('stock', e.target.value)}
              placeholder="10"
              required
            />
          </div>

          <div>
            <label htmlFor="delivery_time" className="block text-sm font-medium text-gray-700 mb-2">
              Tiempo de entrega (días)
            </label>
            <Input
              id="delivery_time"
              type="number"
              min="1"
              value={formData.delivery_time}
              onChange={(e) => handleInputChange('delivery_time', e.target.value)}
              placeholder="7"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Categoría *
          </label>
          <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
            <SelectTrigger>
              <SelectValue placeholder="Selecciona una categoría" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
            Descripción corta *
          </label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            placeholder="Describe tu producto, materiales, proceso de personalización..."
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Imagen del producto *
          </label>
          <ProductImageUpload
            onImageUploaded={setImageUrl}
            currentImage={imageUrl}
            userId={storeId}
          />
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
            {loading 
              ? (product?.id ? 'Actualizando...' : 'Agregando...') 
              : (product?.id ? 'Actualizar producto' : 'Agregar producto')
            }
          </Button>
        </div>
      </form>
    </Card>
  );
};

export default ProductForm;
