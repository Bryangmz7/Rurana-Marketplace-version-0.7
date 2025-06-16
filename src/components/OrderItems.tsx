
import { Order } from '@/types/order';

interface OrderItemsProps {
  orderItems: Order['order_items'];
}

const OrderItems = ({ orderItems }: OrderItemsProps) => {
  return (
    <div>
      <h4 className="font-semibold mb-3 text-gray-900">Productos del pedido:</h4>
      <div className="space-y-3">
        {orderItems.map((item) => (
          <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg border">
            {item.product.image_urls && item.product.image_urls[0] && (
              <img
                src={item.product.image_urls[0]}
                alt={item.product.name}
                className="w-16 h-16 object-cover rounded-lg border"
              />
            )}
            <div className="flex-1">
              <p className="font-medium text-gray-900">{item.product.name}</p>
              <p className="text-sm text-gray-600">
                Cantidad: {item.quantity} × S/{item.unit_price.toFixed(2)}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-lg text-gray-900">
                S/{(item.quantity * item.unit_price).toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrderItems;
