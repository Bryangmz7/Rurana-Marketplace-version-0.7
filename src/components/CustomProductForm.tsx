import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { supabase, notifySupabaseMissing } from '@/integrations/supabase/client';
import { X, Plus, Palette, Ruler, Package, Clock, DollarSign } from 'lucide-react';
import ImageUpload from './ImageUpload';

interface CustomProductFormProps {
  storeId: string;
  onProductCreated?: () => void;
  onCancel?: () => void;
}

interface CustomizationOption {
  type: 'color' | 'size' | 'material' | 'text' | 'other';
  label: string;
  options?: string[];
  required?: boolean;
  priceModifier?: number;
}

const CustomProductForm = ({ storeId, onProductCreated, onCancel }: CustomProductFormProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    base_price: '',
    stock: '',
    category: '',
    min_order_quantity: 1,
    max_order_quantity: '',
    preparation_time_days: 7,
    is_customizable: true,
    requires_approval: false,
    image_urls: [] as string[]
  });

  const [customizationOptions, setCustomizationOptions] = useState<CustomizationOption[]>([]);
  const [newOption, setNewOption] = useState<CustomizationOption>({
    type: 'color',
    label: '',
    options: [],
    required: false,
    priceModifier: 0
  });
  const [newOptionValue, setNewOptionValue] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addCustomizationOption = () => {
    if (!newOption.label.trim()) {
      toast({
        title: "Error",
        description: "El nombre de la opción es requerido",
        variant: "destructive",
      });
      return;
    }

    setCustomizationOptions(prev => [...prev, { ...newOption }]);
    setNewOption({
      type: 'color',
      label: '',
      options: [],
      required: false,
      priceModifier: 0
    });
    setNewOptionValue('');
  };

  const removeCustomizationOption = (index: number) => {
    setCustomizationOptions(prev => prev.filter((_, i) => i !== index));
  };

  const addOptionValue = () => {
    if (!newOptionValue.trim()) return;
    
    setNewOption(prev => ({
      ...prev,
      options: [...(prev.options || []), newOptionValue.trim()]
    }));
    setNewOptionValue('');
  };

  const removeOptionValue = (value: string) => {
    setNewOption(prev => ({
      ...prev,
      options: (prev.options || []).filter(opt => opt !== value)
    }));
  };

  const handleImageUpload = (url: string) => {
    setFormData(prev => ({ ...prev, image_urls: [url] }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (!supabase) {
      notifySupabaseMissing();
      setLoading(false);
      return;
    }

    try {
      // Convertir las opciones de personalización al formato JSON correcto
      const customizationData = {
        options: customizationOptions.map(option => ({
          type: option.type,
          label: option.label,
          options: option.options || [],
          required: option.required || false,
          priceModifier: option.priceModifier || 0
        })),
        text_options: {
          max_length: 100,
          fonts: ['Arial', 'Times New Roman', 'Helvetica']
        }
      };

      const productData = {
        store_id: storeId,
        name: formData.name,
        description: formData.description,
        price: parseFloat(formData.price),
        base_price: formData.base_price ? parseFloat(formData.base_price) : parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category || null,
        image_urls: formData.image_urls,
        is_customizable: formData.is_customizable,
        customization_options: formData.is_customizable ? customizationData : null,
        min_order_quantity: formData.min_order_quantity,
        max_order_quantity: formData.max_order_quantity ? parseInt(formData.max_order_quantity) : null,
        preparation_time_days: formData.preparation_time_days,
        requires_approval: formData.requires_approval
      };

      const { error } = await supabase
        .from('products')
        .insert(productData);

      if (error) throw error;

      toast({
        title: "Producto creado",
        description: "El producto personalizable ha sido creado exitosamente",
      });

      if (onProductCreated) {
        onProductCreated();
      }
    } catch (error) {
      console.error('Error creating product:', error);
      toast({
        title: "Error",
        description: "No se pudo crear el producto",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Crear Producto Personalizable</h2>
          <p className="text-gray-600">Configura un producto con opciones de personalización</p>
        </div>
        {onCancel && (
          <Button onClick={onCancel} variant="outline">
            <X className="h-4 w-4 mr-2" />
            Cancelar
          </Button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Información básica */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Package className="h-5 w-5" />
              Información Básica
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nombre del producto *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="Ej: Taza Personalizada"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ropa">Ropa y Accesorios</SelectItem>
                    <SelectItem value="hogar">Hogar y Decoración</SelectItem>
                    <SelectItem value="tecnologia">Tecnología</SelectItem>
                    <SelectItem value="arte">Arte y Manualidades</SelectItem>
                    <SelectItem value="regalos">Regalos Personalizados</SelectItem>
                    <SelectItem value="otros">Otros</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Descripción</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe tu producto personalizable..."
                rows={4}
              />
            </div>

            <div>
              <Label className="mb-4 block">Imágenes del producto</Label>
              <ImageUpload
                bucket="product-images"
                currentImage={formData.image_urls[0]}
                onImageUploaded={handleImageUpload}
                userId={storeId}
              />
            </div>
          </CardContent>
        </Card>

        {/* Precios y cantidades */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Precios y Cantidades
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="base_price">Precio base *</Label>
                <Input
                  id="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.base_price}
                  onChange={(e) => handleInputChange('base_price', e.target.value)}
                  placeholder="0.00"
                  required
                />
                <p className="text-xs text-gray-500">Precio sin personalizaciones</p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Precio final *</Label>
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
                <p className="text-xs text-gray-500">Precio con personalizaciones incluidas</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stock">Stock disponible *</Label>
                <Input
                  id="stock"
                  type="number"
                  min="0"
                  value={formData.stock}
                  onChange={(e) => handleInputChange('stock', e.target.value)}
                  placeholder="100"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="min_order">Cantidad mínima</Label>
                <Input
                  id="min_order"
                  type="number"
                  min="1"
                  value={formData.min_order_quantity}
                  onChange={(e) => handleInputChange('min_order_quantity', parseInt(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="max_order">Cantidad máxima</Label>
                <Input
                  id="max_order"
                  type="number"
                  min="1"
                  value={formData.max_order_quantity}
                  onChange={(e) => handleInputChange('max_order_quantity', e.target.value)}
                  placeholder="Sin límite"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Opciones de personalización */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Palette className="h-5 w-5" />
              Opciones de Personalización
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Switch
                  id="is_customizable"
                  checked={formData.is_customizable}
                  onCheckedChange={(checked) => handleInputChange('is_customizable', checked)}
                />
                <Label htmlFor="is_customizable">Producto personalizable</Label>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch
                  id="requires_approval"
                  checked={formData.requires_approval}
                  onCheckedChange={(checked) => handleInputChange('requires_approval', checked)}
                />
                <Label htmlFor="requires_approval">Requiere aprobación</Label>
              </div>
            </div>

            {formData.is_customizable && (
              <>
                {/* Opciones existentes */}
                {customizationOptions.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="font-medium">Opciones configuradas:</h4>
                    {customizationOptions.map((option, index) => (
                      <div key={index} className="p-4 border rounded-lg bg-gray-50">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{option.type}</Badge>
                            <span className="font-medium">{option.label}</span>
                            {option.required && <Badge variant="destructive" className="text-xs">Requerido</Badge>}
                          </div>
                          <Button
                            type="button"
                            onClick={() => removeCustomizationOption(index)}
                            variant="ghost"
                            size="sm"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                        {option.options && option.options.length > 0 && (
                          <div className="flex flex-wrap gap-1">
                            {option.options.map((opt, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {opt}
                              </Badge>
                            ))}
                          </div>
                        )}
                        {option.priceModifier !== 0 && (
                          <p className="text-xs text-gray-600 mt-2">
                            Modificador de precio: S/{option.priceModifier}
                          </p>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* Agregar nueva opción */}
                <div className="border-t pt-4">
                  <h4 className="font-medium mb-4">Agregar nueva opción:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tipo de opción</Label>
                      <Select
                        value={newOption.type}
                        onValueChange={(value: any) => setNewOption(prev => ({ ...prev, type: value }))}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="color">Color</SelectItem>
                          <SelectItem value="size">Tamaño</SelectItem>
                          <SelectItem value="material">Material</SelectItem>
                          <SelectItem value="text">Texto</SelectItem>
                          <SelectItem value="other">Otro</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Nombre de la opción</Label>
                      <Input
                        value={newOption.label}
                        onChange={(e) => setNewOption(prev => ({ ...prev, label: e.target.value }))}
                        placeholder="Ej: Color del producto"
                      />
                    </div>
                  </div>

                  {newOption.type !== 'text' && (
                    <div className="mt-4">
                      <Label>Valores disponibles</Label>
                      <div className="flex gap-2 mt-2">
                        <Input
                          value={newOptionValue}
                          onChange={(e) => setNewOptionValue(e.target.value)}
                          placeholder="Ej: Rojo, Azul, Verde..."
                          onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addOptionValue())}
                        />
                        <Button type="button" onClick={addOptionValue} variant="outline">
                          <Plus className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      {newOption.options && newOption.options.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {newOption.options.map((value, i) => (
                            <Badge
                              key={i}
                              variant="secondary"
                              className="cursor-pointer hover:bg-red-100"
                              onClick={() => removeOptionValue(value)}
                            >
                              {value} <X className="h-3 w-3 ml-1" />
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        checked={newOption.required}
                        onCheckedChange={(checked) => setNewOption(prev => ({ ...prev, required: checked }))}
                      />
                      <Label>Opción requerida</Label>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Costo adicional (S/)</Label>
                      <Input
                        type="number"
                        step="0.01"
                        value={newOption.priceModifier}
                        onChange={(e) => setNewOption(prev => ({ ...prev, priceModifier: parseFloat(e.target.value) || 0 }))}
                        placeholder="0.00"
                      />
                    </div>
                  </div>

                  <Button
                    type="button"
                    onClick={addCustomizationOption}
                    variant="outline"
                    className="mt-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar opción
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Tiempo de preparación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Tiempo de Preparación
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="preparation_time">Días de preparación</Label>
              <Input
                id="preparation_time"
                type="number"
                min="1"
                value={formData.preparation_time_days}
                onChange={(e) => handleInputChange('preparation_time_days', parseInt(e.target.value))}
              />
              <p className="text-xs text-gray-500">
                Tiempo estimado para preparar el producto personalizado
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex gap-4">
          <Button type="submit" disabled={loading} className="flex-1">
            {loading ? 'Creando...' : 'Crear Producto'}
          </Button>
          {onCancel && (
            <Button type="button" onClick={onCancel} variant="outline">
              Cancelar
            </Button>
          )}
        </div>
      </form>
    </div>
  );
};

export default CustomProductForm;
