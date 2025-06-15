
import { Button } from '@/components/ui/button';
import { Sparkles } from 'lucide-react';

const HeroSection = () => {
  return (
    <div className="relative bg-gradient-to-br from-primary-50 to-blue-100 overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8 animate-fade-in">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">
                Personalización con IA
                <br />
                <span className="text-primary">¡Haz realidad tus ideas!</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                Convierte cualquier imagen en productos únicos. Sube tu foto, 
                selecciona el estilo y ve tu producto personalizado en tiempo real con 
                nuestra IA. Conecta con emprendedores peruanos.
              </p>
            </div>
            
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary-600 text-white px-8 py-4 text-lg rounded-xl transition-all duration-200 hover:scale-105"
              onClick={() => document.getElementById('try-ai')?.scrollIntoView({ behavior: 'smooth' })}
            >
              PROBAR IA
            </Button>
          </div>

          {/* Right Content */}
          <div className="relative">
            <div className="bg-white rounded-3xl shadow-2xl p-8 space-y-6 animate-scale-in">
              <div className="text-center">
                <div className="w-20 h-20 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-10 w-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                  Personalización instantánea
                </h3>
                <p className="text-gray-600">
                  Sube tu imagen → Selecciona estilo → Ve el resultado en segundos
                </p>
              </div>
              
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">1</span>
                  </div>
                  <p className="text-sm font-medium">Sube tu imagen</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">2</span>
                  </div>
                  <p className="text-sm font-medium">Elige tu estilo</p>
                </div>
                <div className="space-y-2">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                    <span className="text-primary font-bold">3</span>
                  </div>
                  <p className="text-sm font-medium">Vista previa</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
