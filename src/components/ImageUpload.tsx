
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  bucket: 'store-logos' | 'product-images' | 'user-avatars';
  onImageUploaded: (url: string) => void;
  currentImage?: string;
  userId: string;
  singleImage?: boolean;
}

const ImageUpload = ({ 
  bucket, 
  onImageUploaded, 
  currentImage, 
  userId, 
  singleImage = false 
}: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
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
      
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(fileName);

      onImageUploaded(publicUrl);
      
      toast({
        title: "Imagen subida",
        description: "La imagen se subió correctamente",
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

  const removeImage = async () => {
    if (!currentImage) return;
    
    try {
      const urlParts = currentImage.split('/');
      const path = urlParts.slice(-2).join('/');
      
      const { error } = await supabase.storage
        .from(bucket)
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

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative">
          <Input
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading || (singleImage && !!currentImage)}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading || (singleImage && !!currentImage)}
              asChild
            >
              <span className="cursor-pointer">
                {uploading ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary mr-2"></div>
                ) : (
                  <Upload className="h-4 w-4 mr-2" />
                )}
                {uploading ? 'Subiendo...' : 'Subir imagen'}
              </span>
            </Button>
          </label>
        </div>
        <span className="text-sm text-gray-500">
          Máximo 5MB • Solo 1 imagen
        </span>
      </div>

      {currentImage && (
        <div className="relative inline-block">
          <img
            src={currentImage}
            alt="Imagen cargada"
            className="w-32 h-32 object-cover rounded-lg border"
          />
          <button
            onClick={removeImage}
            className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
