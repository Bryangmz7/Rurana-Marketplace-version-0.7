
import { Zap, Clock, Shield, Heart } from 'lucide-react';

const features = [
  {
    icon: Zap,
    title: "IA Instantánea",
    description: "Visualiza tu producto personalizado en segundos con nuestra inteligencia artificial avanzada"
  },
  {
    icon: Clock,
    title: "Entrega Rápida",
    description: "Conectamos directamente con artesanos locales para entregas en tiempo récord"
  },
  {
    icon: Shield,
    title: "Compra Segura",
    description: "Pagos protegidos y garantía de calidad en todos nuestros productos"
  },
  {
    icon: Heart,
    title: "Apoya Local",
    description: "Cada compra apoya a emprendedores y artesanos peruanos verificados"
  }
];

const FeaturesSection = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            ¿Por qué elegir RURANA?
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            La plataforma que revoluciona la personalización de productos con tecnología de punta
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              className="text-center group hover:scale-105 transition-transform duration-200"
            >
              <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:bg-primary group-hover:text-white transition-colors duration-200">
                <feature.icon className="h-8 w-8 text-primary group-hover:text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                {feature.title}
              </h3>
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
