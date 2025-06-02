
import StoreCard from './StoreCard';
import { Button } from '@/components/ui/button';

const featuredStores = [
  {
    id: '1',
    name: 'ArteCusco',
    description: 'Especialistas en textiles y bordados tradicionales peruanos con técnicas ancestrales',
    rating: 4.9,
    reviewCount: 127,
    location: 'Cusco, Perú',
    productCount: 45,
    imageUrl: '/placeholder-store.jpg',
    category: 'Textil'
  },
  {
    id: '2',
    name: 'CreativaCerámica',
    description: 'Artesanías en cerámica personalizadas con diseños únicos y modernos',
    rating: 4.8,
    reviewCount: 89,
    location: 'Lima, Perú',
    productCount: 32,
    imageUrl: '/placeholder-store.jpg',
    category: 'Cerámica'
  },
  {
    id: '3',
    name: 'DigitalArt Peru',
    description: 'Arte digital personalizado, ilustraciones y diseños para productos únicos',
    rating: 4.7,
    reviewCount: 156,
    location: 'Arequipa, Perú',
    productCount: 78,
    imageUrl: '/placeholder-store.jpg',
    category: 'Arte Digital'
  }
];

const MarketplaceSection = () => {
  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
            Marketplace
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto mb-8">
            Descubre emprendedores verificados que crean productos únicos y personalizados
          </p>
          
          {/* Category Filter */}
          <div className="flex flex-wrap justify-center gap-4 mb-12">
            <Button variant="default" className="rounded-full">Todos</Button>
            <Button variant="outline" className="rounded-full">Peluches</Button>
            <Button variant="outline" className="rounded-full">Arte Digital</Button>
            <Button variant="outline" className="rounded-full">Cerámica</Button>
            <Button variant="outline" className="rounded-full">Textil</Button>
            <Button variant="outline" className="rounded-full">Bordados</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
          {featuredStores.map((store) => (
            <StoreCard key={store.id} {...store} />
          ))}
        </div>
        
        <div className="text-center">
          <Button size="lg" variant="outline" className="rounded-xl">
            Ver todas las tiendas
          </Button>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceSection;
