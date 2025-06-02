
import { Facebook, Instagram, Twitter, Mail } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="space-y-4">
            <div className="flex items-center">
              <span className="text-3xl font-bold text-white">RURANA</span>
              <span className="ml-2 text-xs bg-primary text-white px-2 py-1 rounded-full">
                AI Powered
              </span>
            </div>
            <p className="text-gray-400">
              La plataforma que conecta tu creatividad con artesanos peruanos, 
              potenciada por inteligencia artificial.
            </p>
            <div className="flex space-x-4">
              <Facebook className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" />
              <Instagram className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" />
              <Twitter className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" />
              <Mail className="h-6 w-6 text-gray-400 hover:text-white cursor-pointer" />
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Productos</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Peluches</a></li>
              <li><a href="#" className="hover:text-white">Arte Digital</a></li>
              <li><a href="#" className="hover:text-white">Cerámica</a></li>
              <li><a href="#" className="hover:text-white">Textil</a></li>
              <li><a href="#" className="hover:text-white">Bordados</a></li>
            </ul>
          </div>

          {/* Company */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Empresa</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Sobre nosotros</a></li>
              <li><a href="#" className="hover:text-white">Únete como vendedor</a></li>
              <li><a href="#" className="hover:text-white">Blog</a></li>
              <li><a href="#" className="hover:text-white">Carreras</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-lg font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2 text-gray-400">
              <li><a href="#" className="hover:text-white">Centro de ayuda</a></li>
              <li><a href="#" className="hover:text-white">Política de privacidad</a></li>
              <li><a href="#" className="hover:text-white">Términos de servicio</a></li>
              <li><a href="#" className="hover:text-white">Contacto</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-12 pt-8 text-center text-gray-400">
          <p>&copy; 2024 RURANA. Todos los derechos reservados. Hecho con ❤️ en Perú.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
