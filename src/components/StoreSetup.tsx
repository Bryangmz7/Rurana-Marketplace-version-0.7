
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
    department_id: ''
  });
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(false);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
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

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      console.log('Fetching departments...');
      setDepartmentsLoading(true);
      
      // Verificar conexión a Supabase
      const { data: testData, error: testError } = await supabase
        .from('departments')
        .select('count')
        .limit(1);

      if (testError) {
        console.error('Supabase connection error:', testError);
        // Si no hay conexión, crear departamentos por defecto
        const defaultDepartments = [
          { id: '1', name: 'Amazonas' },
          { id: '2', name: 'Áncash' },
          { id: '3', name: 'Apurímac' },
          { id: '4', name: 'Arequipa' },
          { id: '5', name: 'Ayacucho' },
          { id: '6', name: 'Cajamarca' },
          { id: '7', name: 'Callao' },
          { id: '8', name: 'Cusco' },
          { id: '9', name: 'Huancavelica' },
          { id: '10', name: 'Huánuco' },
          { id: '11', name: 'Ica' },
          { id: '12', name: 'Junín' },
          { id: '13', name: 'La Libertad' },
          { id: '14', name: 'Lambayeque' },
          { id: '15', name: 'Lima' },
          { id: '16', name: 'Loreto' },
          { id: '17', name: 'Madre de Dios' },
          { id: '18', name: 'Moquegua' },
          { id: '19', name: 'Pasco' },
          { id: '20', name: 'Piura' },
          { id: '21', name: 'Puno' },
          { id: '22', name: 'San Martín' },
          { id: '23', name: 'Tacna' },
          { id: '24', name: 'Tumbes' },
          { id: '25', name: 'Ucayali' }
        ];
        setDepartments(defaultDepartments);
        console.log('Using default departments:', defaultDepartments.length);
        return;
      }

      const { data, error } = await supabase
        .from('departments')
        .select('id, name')
        .order('name');

      console.log('Departments response:', { data, error });

      if (error) {
        console.error('Error fetching departments:', error);
        throw error;
      }
      
      if (!data || data.length === 0) {
        console.log('No departments found, using default departments');
        const defaultDepartments = [
          { id: '1', name: 'Amazonas' },
          { id: '2', name: 'Áncash' },
          { id: '3', name: 'Apurímac' },
          { id: '4', name: 'Arequipa' },
          { id: '5', name: 'Ayacucho' },
          { id: '6', name: 'Cajamarca' },
          { id: '7', name: 'Callao' },
          { id: '8', name: 'Cusco' },
          { id: '9', name: 'Huancavelica' },
          { id: '10', name: 'Huánuco' },
          { id: '11', name: 'Ica' },
          { id: '12', name: 'Junín' },
          { id: '13', name: 'La Libertad' },
          { id: '14', name: 'Lambayeque' },
          { id: '15', name: 'Lima' },
          { id: '16', name: 'Loreto' },
          { id: '17', name: 'Madre de Dios' },
          { id: '18', name: 'Moquegua' },
          { id: '19', name: 'Pasco' },
          { id: '20', name: 'Piura' },
          { id: '21', name: 'Puno' },
          { id: '22', name: 'San Martín' },
          { id: '23', name: 'Tacna' },
          { id: '24', name: 'Tumbes' },
          { id: '25', name: 'Ucayali' }
        ];
        setDepartments(defaultDepartments);
      } else {
        setDepartments(data);
      }
      console.log('Departments loaded:', departments.length || data?.length || 0);
    } catch (error) {
      console.error('Error fetching departments:', error);
      // En caso de error, usar departamentos por defecto
      const defaultDepartments = [
        { id: '1', name: 'Amazonas' },
        { id: '2', name: 'Áncash' },
        { id: '3', name: 'Apurímac' },
        { id: '4', name: 'Arequipa' },
        { id: '5', name: 'Ayacucho' },
        { id: '6', name: 'Cajamarca' },
        { id: '7', name: 'Callao' },
        { id: '8', name: 'Cusco' },
        { id: '9', name: 'Huancavelica' },
        { id: '10', name: 'Huánuco' },
        { id: '11', name: 'Ica' },
        { id: '12', name: 'Junín' },
        { id: '13', name: 'La Libertad' },
        { id: '14', name: 'Lambayeque' },
        { id: '15', name: 'Lima' },
        { id: '16', name: 'Loreto' },
        { id: '17', name: 'Madre de Dios' },
        { id: '18', name: 'Moquegua' },
        { id: '19', name: 'Pasco' },
        { id: '20', name: 'Piura' },
        { id: '21', name: 'Puno' },
        { id: '22', name: 'San Martín' },
        { id: '23', name: 'Tacna' },
        { id: '24', name: 'Tumbes' },
        { id: '25', name: 'Ucayali' }
      ];
      setDepartments(defaultDepartments);
      toast({
        title: "Información",
        description: "Se están usando departamentos por defecto. La funcionalidad está disponible.",
      });
    } finally {
      setDepartmentsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.description || !formData.category || !formData.department_id) {
      toast({
        title: "Campos requeridos",
        description: "Por favor completa todos los campos obligatorios",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Obtener el nombre del departamento seleccionado
      const selectedDepartment = departments.find(d => d.id === formData.department_id);
      
      console.log('Creating store with data:', {
        user_id: userId,
        name: formData.name,
        description: formData.description,
        category: formData.category,
        department: selectedDepartment?.name || null,
        department_id: formData.department_id,
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
            department: selectedDepartment?.name || null,
            department_id: formData.department_id,
            rating: 0
          }
        ])
        .select()
        .single();

      if (error) {
        console.error('Error creating store:', error);
        throw error;
      }

      console.log('Store created successfully:', data);
      onStoreCreated(data);
      
      toast({
        title: "¡Tienda creada!",
        description: "Tu tienda se ha configurado correctamente",
      });
    } catch (error: any) {
      console.error('Error creating store:', error);
      toast({
        title: "Error",
        description: error.message || "No se pudo crear la tienda. Inténtalo de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value });
    console.log(`Updated ${field}:`, value);
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
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Selecciona una categoría" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50">
                  {categories.map((category) => (
                    <SelectItem key={category} value={category} className="hover:bg-gray-100">
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
                value={formData.department_id} 
                onValueChange={(value) => handleInputChange('department_id', value)}
                disabled={departmentsLoading}
              >
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder={
                    departmentsLoading ? "Cargando..." : 
                    departments.length === 0 ? "No hay departamentos" : 
                    "Selecciona un departamento"
                  } />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-200 shadow-lg z-50 max-h-60 overflow-y-auto">
                  {departments.map((department) => (
                    <SelectItem key={department.id} value={department.id} className="hover:bg-gray-100">
                      {department.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {departments.length === 0 && !departmentsLoading && (
                <p className="text-sm text-red-600 mt-1">
                  No se pudieron cargar los departamentos. 
                  <Button 
                    type="button" 
                    variant="link" 
                    className="p-0 h-auto text-sm"
                    onClick={fetchDepartments}
                  >
                    Reintentar
                  </Button>
                </p>
              )}
            </div>
          </div>

          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              className="flex-1 bg-primary hover:bg-primary/90"
              disabled={loading || departmentsLoading}
            >
              {loading ? 'Creando tienda...' : 'Crear mi tienda'}
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
};

export default StoreSetup;
