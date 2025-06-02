
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import FeaturesSection from '@/components/FeaturesSection';
import CustomizationPreview from '@/components/CustomizationPreview';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <HeroSection />
      <CustomizationPreview />
      <FeaturesSection />
      <Footer />
    </div>
  );
};

export default Index;
