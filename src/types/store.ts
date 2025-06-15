
export interface Store {
  id: string;
  name: string;
  description: string;
  logo_url?: string;
  rating: number;
  category?: string;
  department?: string;
  created_at: string;
  product_count?: number;
}
