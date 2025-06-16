
import { Order } from '@/types/order';

export const getStatusColor = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'confirmed': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'in_progress': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'completed': return 'bg-green-100 text-green-800 border-green-200';
    case 'cancelled': return 'bg-red-100 text-red-800 border-red-200';
    default: return 'bg-gray-100 text-gray-800 border-gray-200';
  }
};

export const getStatusText = (status: Order['status']) => {
  switch (status) {
    case 'pending': return 'Pendiente';
    case 'confirmed': return 'Confirmado';
    case 'in_progress': return 'En Progreso';
    case 'completed': return 'Completado';
    case 'cancelled': return 'Cancelado';
    default: return status;
  }
};

export const contactBuyer = (order: Order, toast: any) => {
  // Priorizar teléfono de entrega, luego teléfono del perfil
  const phone = order.delivery_phone || order.buyer_profile?.phone;
  
  if (!phone) {
    toast({
      title: "Sin número de contacto",
      description: "Este comprador no tiene número de WhatsApp registrado",
      variant: "destructive",
    });
    return;
  }

  const cleanPhone = phone.replace(/[^\d]/g, '');
  let whatsappNumber = cleanPhone;
  if (!whatsappNumber.startsWith('51') && whatsappNumber.length === 9) {
    whatsappNumber = '51' + whatsappNumber;
  }

  const customerName = order.buyer_profile?.name || 'Cliente';
  const orderId = order.id.slice(-6);
  const orderTotal = order.total.toFixed(2);
  const orderDate = new Date(order.created_at).toLocaleDateString('es-PE');
  const deliveryAddress = order.delivery_address || 'Sin dirección';
  const deliveryNotes = order.delivery_notes ? `\n📝 Notas: ${order.delivery_notes}` : '';
  const products = order.order_items.map(item => {
    const base = `- ${item.product.name} (x${item.quantity})`;
    const url = item.product.image_urls?.[0];
    return url ? `${base}\n  ${url}` : base;
  }).join('\n');

  const message = `¡Hola ${customerName}! 👋\n\nTe contacto por tu pedido #${orderId} realizado el ${orderDate}.\n📍 Dirección de entrega: ${deliveryAddress}${deliveryNotes}\n\n📦 *Productos:*\n${products}\n\n💰 *Total:* S/${orderTotal}\n\nPor favor confirma si los datos son correctos para continuar con la preparación del pedido.`;
  
  const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
};
