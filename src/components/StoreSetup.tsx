
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';

interface StoreSetupProps {
  userId: string;
  onStoreCreated: (store: any) => void;
}

interface Department {
  id: string;
  name: string;
}

const StoreSetup = ({ userId, onStoreCreated }: StoreSetupProps) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    department_name: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const { toast } = useToast();

  const categories = [
    'Peluches',
    'Arte Digital',
    'Cerámica',
    'Textil',
    'Bordados',
    'Joyería',
    'Decoración',
    'Otros'
  ];

  // Departamentos predefinidos del Perú
  const peruDepartments = [
    { id: 'amazonas', name: 'Amazonas' },
    { id: 'ancash', name: 'Áncash' },
    { id: 'apurimac', name: 'Apurímac' },
    { id: 'arequipa', name: 'Arequipa' },
    { id: 'ayacucho', name: 'Ayacucho' },
    { id: 'cajamarca', name: 'Cajamarca' },
    { id: 'callao', name: 'Callao' },
    { id: 'cusco', name: 'Cusco' },
    { id: 'huancavelica', name: 'Huancavelica' },
    { id: 'huanuco', name: 'Huánuco' },
    { id: 'ica', name: 'Ica' },
    { id: 'junin', name: 'Junín' },
    { id: 'la-libertad', name: 'La Libertad' },
    { id: 'lambayeque', name: 'Lambayeque' },
    { id: 'lima', name: 'Lima' },
    { id: 'loreto', name: 'Loreto' },
    { id: 'madre-de-dios', name: 'Madre de Dios' },
    { id: 'moquegua', name: 'Moquegua' },
    { id: 'pasco', name: 'Pasco' },
    { id: 'piura', name: 'Piura' },
    { id: 'puno', name: 'Puno' },
    { id: 'san-martin', name: 'San Martín' },
    { id: 'tacna', name: 'Tacna' },
    { id: 'tumbes', name: 'Tumbes' },
    { id: 'ucayali', name: 'Ucayali' }
  ];

  useEffect(() => {
    console.log('Inicializando departamentos predefinidos');
    setDepartments(peruDepartments);
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('Intentando cargar departamentos desde DB...');
      
      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      console.log('Respuesta de departamentos:', { data, error });

      if (error) {
        console.error('Error al cargar departamentos de la DB:', error);
        console.log('Manteniendo departamentos predefinidos del Perú');
      } else if (data && data.length > 0) {
        console.log('Departamentos cargados desde la DB:', data.length);
        setDepartments(data);
      } else {
        console.log('No hay departamentos en la DB, manteniendo predefinidos');
      }
    } catch (error) {
      console.error('Error en fetchDepartments:', error);
      console.log('Manteniendo departamentos predefinidos por error');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa el nombre, descripción y categoría",
        variant: "destructive",
      });
      return;
    }

    if (!formData.department_name) {
      toast({
        title: "Campo requerido",
        description: "Por favor selecciona un departamento",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Creando tienda con datos:', {
        user_id: userId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        department: formData.department_name,
        rating: 0
      });
      
      const { data, error } = await supabase
        .from('stores')
        .insert([
          {
            user_id: userId,
            name: formData.name,
            description: formData.description,
            category: formData.category,
            department: formData.department_name,
            rating: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creando tienda:', error);
        throw error;
      }

      console.log('Tienda creada exitosamente:', data);
      onStoreCreated(data);
      
      toast({
        title: "¡Tienda creada!",
        description: "Tu tienda se ha configurado correctamente",
      });
    } catch (error: any) {
      console.error('Error creando tienda:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la tienda. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    console.log(`Actualizado ${field}:`, value);
  };

  const handleDepartmentChange = (value: string) => {
    console.log('Departamento seleccionado:', value);
    handleInputChange('department_name', value);
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Configura tu tienda
        </h1>
        <p className="text-lg text-gray-600">
          Completa la información básica para comenzar a vender
        </p>
      </div>

      <Card className="p-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
              Nombre comercial *
            </label>
            <Input
              id="name"
              type="text"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              placeholder="Ej: ArteCusco"
              required
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
              Descripción breve *
            </label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              placeholder="Describe qué productos vendes y qué te hace único..."
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Categoría principal *
              </label>
              <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value)}>
                <SelectTrigger className="bg-white border border-gray-300">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100]">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="hover:bg-gray-100 cursor-pointer">
                      {category}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Departamento *
              </label>
              <Select 
                value={formData.department_name} 
                onValueChange={handleDepartmentChange}
              >
                <SelectTrigger className="bg-white border border-gray-300">
                  <SelectValue placeholder="Selecciona un departamento" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-[100] max-h-60 overflow-y-auto">
                  {departments.map((department) => (
                    <SelectItem 
                      key={department.id} 
                      value={department.name} 
                      className="hover:bg-gray-100 cursor-pointer"
                    >
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-600 mt-1">
                {departments.length} departamentos disponibles
              </p>
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
            >
              Crear mi tienda
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StoreSetup;
