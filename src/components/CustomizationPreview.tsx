
import { useState } from 'react';
import { Upload, Palette, Eye, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const CustomizationPreview = () => {
  const [selectedStyle, setSelectedStyle] = useState('');
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [generatedPreview, setGeneratedPreview] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  // Mapeo de estilos a las imágenes que subiste
  const styleToImageMap = {
    'caricatura': '/lovable-uploads/e5d1a5f1-33c8-4b69-9c93-b74fef073671.png',
    'peluche': '/lovable-uploads/cc203e8b-7ece-4f03-9c64-8a2f1df7ef81.png',
    'bordado': '/lovable-uploads/4352885c-c893-42e2-8be2-f2ebcefb4a20.png',
    'ceramica': '/lovable-uploads/9355ef8b-f2bb-427e-be86-c1dbc36a2fbd.png',
    'digital': '/lovable-uploads/28b08f91-2bd0-49c8-b5c0-91cd5e81918c.png'
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
        // Reset preview when new image is uploaded
        setGeneratedPreview(null);
      };
      reader.readAsDataURL(file);
    }
  };

  const generatePreview = async () => {
    if (!uploadedImage || !selectedStyle) return;
    
    setIsGenerating(true);
    // Simular procesamiento de IA con un delay
    setTimeout(() => {
      // Obtener la imagen correspondiente al estilo seleccionado
      const previewImage = styleToImageMap[selectedStyle as keyof typeof styleToImageMap];
      setGeneratedPreview(previewImage);
      setIsGenerating(false);
    }, 3000); // 3 segundos para simular procesamiento
  };

  return (
    <section id="try-ai" className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Prueba nuestra IA
          </h2>
          <p className="text-xl text-gray-600">
            Experimenta el poder de la personalización instantánea
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
          {/* Step 1: Upload Image - Más pequeño */}
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg font-bold">1</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Sube tu imagen</h3>
            
            <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 mb-3 hover:border-primary transition-colors">
              {uploadedImage ? (
                <img 
                  src={uploadedImage} 
                  alt="Uploaded" 
                  className="w-full h-20 object-cover rounded-lg mx-auto"
                />
              ) : (
                <div className="text-gray-400">
                  <Upload className="h-8 w-8 mx-auto mb-2" />
                  <p className="text-sm">Arrastra imagen</p>
                </div>
              )}
            </div>
            
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <Button asChild className="w-full rounded-xl text-sm" size="sm">
              <label htmlFor="image-upload" className="cursor-pointer">
                Cambiar imagen
              </label>
            </Button>
          </div>

          {/* Step 2: Choose Style - Más pequeño */}
          <div className="bg-gray-50 rounded-2xl p-6 text-center">
            <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white text-lg font-bold">2</span>
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">Elige tu estilo</h3>
            <p className="text-gray-600 mb-4 text-sm">Estilo de personalización</p>
            
            <Select value={selectedStyle} onValueChange={setSelectedStyle}>
              <SelectTrigger className="w-full mb-3">
                <SelectValue placeholder="Selecciona un estilo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="caricatura">Caricatura</SelectItem>
                <SelectItem value="peluche">Peluche</SelectItem>
                <SelectItem value="bordado">Bordado</SelectItem>
                <SelectItem value="ceramica">Cerámica</SelectItem>
                <SelectItem value="digital">Arte Digital</SelectItem>
              </SelectContent>
            </Select>
            
            {selectedStyle && (
              <div className="bg-primary-50 rounded-lg p-3 text-left">
                <div className="flex items-center space-x-2 mb-1">
                  <Palette className="h-4 w-4 text-primary" />
                  <span className="font-medium text-primary text-sm">Seleccionado:</span>
                </div>
                <p className="text-xs text-gray-600 capitalize">{selectedStyle}</p>
              </div>
            )}
          </div>

          {/* Step 3: Preview - Mucho más grande, ocupa 2 columnas */}
          <div className="lg:col-span-2 bg-gray-50 rounded-2xl p-8 text-center">
            <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-6">
              <span className="text-white text-2xl font-bold">3</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">Vista Previa</h3>
            <p className="text-gray-600 mb-6">Sube una imagen y selecciona un estilo para ver la vista previa</p>
            
            <div className="border-2 border-gray-300 rounded-xl p-8 mb-6 min-h-[400px] flex items-center justify-center">
              {generatedPreview ? (
                <img 
                  src={generatedPreview} 
                  alt="Generated preview" 
                  className="max-w-full max-h-[350px] object-contain rounded-lg shadow-lg"
                />
              ) : isGenerating ? (
                <div className="text-primary">
                  <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-lg">Procesando con IA...</p>
                  <p className="text-sm text-gray-500 mt-2">Esto puede tomar unos segundos</p>
                </div>
              ) : (
                <div className="text-gray-400">
                  <Eye className="h-16 w-16 mx-auto mb-4" />
                  <p className="text-lg">Tu producto personalizado se verá así</p>
                  <p className="text-sm text-gray-500 mt-2">Sube una imagen y selecciona un estilo</p>
                </div>
              )}
            </div>
            
            <Button 
              onClick={generatePreview}
              disabled={!uploadedImage || !selectedStyle || isGenerating}
              className="w-full rounded-xl text-lg py-3"
              size="lg"
            >
              <Eye className="h-5 w-5 mr-2" />
              {isGenerating ? 'Generando...' : 'Generar Vista Previa'}
            </Button>
            
            {generatedPreview && (
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-green-600 text-lg font-medium">¡Vista previa lista!</p>
                <p className="text-green-600 text-sm">Tu producto personalizado estilo {selectedStyle}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CustomizationPreview;
