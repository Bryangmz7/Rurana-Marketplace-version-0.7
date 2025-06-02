
import React, { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Upload, X, Image } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface ImageUploadProps {
  bucket: 'store-logos' | 'product-images';
  onImageUploaded: (url: string) => void;
  currentImages?: string[];
  maxImages?: number;
  userId: string;
}

const ImageUpload = ({ bucket, onImageUploaded, currentImages = [], maxImages = 5, userId }: ImageUploadProps) => {
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();

  const uploadImage = async (file: File) => {
    try {
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
      if (currentImages.length >= maxImages) {
        toast({
          title: "Límite alcanzado",
          description: `Solo puedes subir máximo ${maxImages} imágenes`,
          variant: "destructive",
        });
        return;
      }
      uploadImage(file);
    }
  };

  const removeImage = async (imageUrl: string) => {
    try {
      // Extraer el path de la URL
      const urlParts = imageUrl.split('/');
      const path = urlParts.slice(-2).join('/'); // userId/filename
      
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);

      if (error) throw error;
      
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
            disabled={uploading || currentImages.length >= maxImages}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload">
            <Button
              type="button"
              variant="outline"
              disabled={uploading || currentImages.length >= maxImages}
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
          {currentImages.length}/{maxImages} imágenes
        </span>
      </div>

      {currentImages.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {currentImages.map((imageUrl, index) => (
            <div key={index} className="relative group">
              <img
                src={imageUrl}
                alt={`Imagen ${index + 1}`}
                className="w-full h-24 object-cover rounded-lg border"
              />
              <button
                onClick={() => removeImage(imageUrl)}
                className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ImageUpload;
