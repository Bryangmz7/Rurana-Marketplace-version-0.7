
import React, { useState } from 'react';
import { supabase, notifySupabaseMissing } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Upload, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ProductImageUploadProps {
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  userId: string;
}

const ProductImageUpload = ({ onImageUploaded, currentImage, userId }: ProductImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    if (!supabase) {
      notifySupabaseMissing();
      return;
    }
    // Verificar tamaño del archivo (5MB máximo)
    const maxSize = 5 * 1024 * 1024; // 5MB en bytes
    if (file.size > maxSize) {
      toast({
        title: "Archivo demasiado grande",
        description: "El archivo debe ser menor a 5MB",
        variant: "destructive",
      });
      return;
    }

    // Verificar tipo de archivo
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Tipo de archivo inválido",
        description: "Solo se permiten archivos de imagen",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      
      toast({
        title: "Imagen subida correctamente",
        description: "La imagen se ha agregado al producto",
      });
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Error",
        description: "No se pudo subir la imagen",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(false);
    
    const file = event.dataTransfer.files[0];
    if (file) {
      uploadImage(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const removeImage = async () => {
    if (!currentImage) return;

    if (!supabase) {
      notifySupabaseMissing();
      return;
    }
    
    try {
      const urlParts = currentImage.split('/');
      const path = urlParts.slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from('product-images')
        .remove([path]);

      if (error) throw error;
      
      onImageUploaded('');
      toast({
        title: "Imagen eliminada",
        description: "La imagen se eliminó correctamente",
      });
    } catch (error) {
      console.error('Error removing image:', error);
      toast({
        title: "Error",
        description: "No se pudo eliminar la imagen",
        variant: "destructive",
      });
    }
  };

  if (currentImage) {
    return (
      <div className="space-y-4">
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Imagen del producto"
            className="w-full max-w-md h-48 object-cover rounded-lg border shadow-sm"
          />
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={removeImage}
            className="absolute top-2 right-2"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
        <p className="text-sm text-gray-600">
          Solo se permite una imagen por producto (máximo 5MB)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          dragOver ? 'border-primary bg-primary/5' : 'border-gray-300'
        }`}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
        <div className="space-y-2">
          <div>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              disabled={uploading}
              className="hidden"
              id="product-image-upload"
            />
            <label htmlFor="product-image-upload">
              <Button
                type="button"
                variant="outline"
                disabled={uploading}
                asChild
              >
                <span className="cursor-pointer">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {uploading ? 'Subiendo...' : 'Seleccionar imagen'}
                </span>
              </Button>
            </label>
          </div>
          <p className="text-gray-500">o arrastra y suelta aquí</p>
        </div>
        <p className="text-xs text-gray-500 mt-2">
          PNG, JPG, GIF • Máximo 5MB • Solo 1 imagen
        </p>
      </div>
    </div>
  );
};

export default ProductImageUpload;
