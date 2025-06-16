
export interface Order {
  id: string;
  buyer_id: string;
  total: number;
  status: 'pending' | 'confirmed' | 'in_progress' | 'completed' | 'cancelled';
  delivery_address: string | null;
  delivery_phone: string | null;
  delivery_notes: string | null;
  customer_notes: string | null;
  created_at: string;
  order_items: Array<{
    id: string;
    quantity: number;
    unit_price: number;
    product: {
      id: string;
      name: string;
      image_urls: string[] | null;
    };
  }>;
  buyer_profile?: {
    name: string;
    phone: string | null;
    email: string | null;
    address: string | null;
    avatar_url: string | null;
  };
}
