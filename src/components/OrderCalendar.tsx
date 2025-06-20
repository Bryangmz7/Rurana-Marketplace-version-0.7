
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { CalendarDays, Package, Clock, CheckCircle, Truck, Plus } from 'lucide-react';
import { format, isSameDay, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';

interface CalendarEvent {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  order_id: string | null;
  user_id: string;
  start_date: string;
  end_date: string | null;
  status: string;
  created_at: string;
  order_number?: string;
}

interface OrderCalendarProps {
  userId: string;
  userRole: 'buyer' | 'seller';
}

const OrderCalendar = ({ userId, userRole }: OrderCalendarProps) => {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
    
    // Configurar suscripción en tiempo real
    const channel = supabase
      .channel('calendar-events')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('New calendar event:', payload);
          setEvents(prev => [...prev, payload.new as CalendarEvent]);
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'calendar_events',
          filter: `user_id=eq.${userId}`
        },
        (payload) => {
          console.log('Updated calendar event:', payload);
          setEvents(prev => prev.map(event => 
            event.id === payload.new.id ? payload.new as CalendarEvent : event
          ));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const fetchEvents = async () => {
    try {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', userId)
        .order('start_date', { ascending: true });

      if (error) throw error;
      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast({
        title: "Error",
        description: "No se pudieron cargar los eventos del calendario",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const createOrderEvents = async () => {
    try {
      // Obtener pedidos del usuario
      let query = supabase.from('orders').select('*');
      
      if (userRole === 'seller') {
        // Para vendedores, obtener pedidos de su tienda
        const { data: storeData } = await supabase
          .from('stores')
          .select('id')
          .eq('user_id', userId)
          .single();
        
        if (storeData) {
          query = query.eq('store_id', storeData.id);
        }
      } else {
        // Para compradores, obtener sus pedidos
        query = query.eq('buyer_id', userId);
      }

      const { data: orders, error } = await query;
      if (error) throw error;

      // Crear eventos para cada pedido
      const eventsToCreate = [];
      for (const order of orders || []) {
        const orderDate = new Date(order.created_at);
        
        // Evento de creación del pedido
        eventsToCreate.push({
          title: `Pedido ${order.order_number}`,
          description: `Pedido por S/${order.total}`,
          event_type: 'order_created',
          order_id: order.id,
          user_id: userId,
          start_date: order.created_at,
          status: 'completed'
        });

        // Evento de entrega estimada (7 días después por defecto)
        if (order.status !== 'cancelled') {
          const deliveryDate = new Date(orderDate);
          deliveryDate.setDate(deliveryDate.getDate() + 7);
          
          eventsToCreate.push({
            title: `Entrega ${order.order_number}`,
            description: `Entrega estimada del pedido`,
            event_type: 'delivery',
            order_id: order.id,
            user_id: userId,
            start_date: deliveryDate.toISOString(),
            status: order.status === 'delivered' ? 'completed' : 'pending'
          });
        }
      }

      if (eventsToCreate.length > 0) {
        const { error: insertError } = await supabase
          .from('calendar_events')
          .insert(eventsToCreate);

        if (insertError) throw insertError;

        toast({
          title: "Eventos creados",
          description: `Se crearon ${eventsToCreate.length} eventos del calendario`,
        });
        
        fetchEvents();
      }
    } catch (error) {
      console.error('Error creating order events:', error);
      toast({
        title: "Error",
        description: "No se pudieron crear los eventos automáticamente",
        variant: "destructive",
      });
    }
  };

  const getEventIcon = (eventType: string, status: string) => {
    if (status === 'completed') {
      return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
    
    switch (eventType) {
      case 'order_created':
        return <Package className="h-4 w-4 text-blue-600" />;
      case 'delivery':
        return <Truck className="h-4 w-4 text-orange-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getEventTypeText = (eventType: string) => {
    switch (eventType) {
      case 'order_created':
        return 'Pedido Creado';
      case 'delivery':
        return 'Entrega';
      default:
        return 'Evento';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const eventsForSelectedDate = events.filter(event => 
    isSameDay(parseISO(event.start_date), selectedDate)
  );

  const daysWithEvents = events.reduce((acc, event) => {
    const eventDate = parseISO(event.start_date);
    const dateKey = format(eventDate, 'yyyy-MM-dd');
    acc[dateKey] = true;
    return acc;
  }, {} as Record<string, boolean>);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Calendario */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <CalendarDays className="h-5 w-5" />
              Calendario de Pedidos
            </CardTitle>
            <Button onClick={createOrderEvents} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Sincronizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => date && setSelectedDate(date)}
            className="rounded-md border"
            modifiers={{
              hasEvents: (date) => {
                const dateKey = format(date, 'yyyy-MM-dd');
                return daysWithEvents[dateKey] || false;
              }
            }}
            modifiersStyles={{
              hasEvents: {
                backgroundColor: '#3b82f6',
                color: 'white',
                fontWeight: 'bold'
              }
            }}
          />
        </CardContent>
      </Card>

      {/* Eventos del día seleccionado */}
      <Card>
        <CardHeader>
          <CardTitle>
            Eventos - {format(selectedDate, "d 'de' MMMM, yyyy", { locale: es })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {eventsForSelectedDate.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CalendarDays className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No hay eventos para esta fecha</p>
            </div>
          ) : (
            <div className="space-y-4">
              {eventsForSelectedDate.map((event) => (
                <div key={event.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      {getEventIcon(event.event_type, event.status)}
                      <div className="flex-1">
                        <h4 className="font-medium">{event.title}</h4>
                        {event.description && (
                          <p className="text-sm text-muted-foreground mt-1">
                            {event.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline">
                            {getEventTypeText(event.event_type)}
                          </Badge>
                          <Badge className={getStatusColor(event.status)}>
                            {event.status === 'completed' ? 'Completado' : 
                             event.status === 'pending' ? 'Pendiente' : 'Cancelado'}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {format(parseISO(event.start_date), 'HH:mm')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OrderCalendar;
