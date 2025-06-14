
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Star } from "lucide-react";

interface ProductReviewsProps {
  productId: string;
}

type Review = {
  id: string;
  rating: number;
  comment?: string | null;
  created_at: string;
  reviewer?: { name: string; avatar_url: string | null };
};

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId }) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line
  }, [productId]);

  const fetchReviews = async () => {
    setLoading(true);
    // Trae reviews más nombre/avatar del reviewer
    const { data, error } = await supabase
      .from("reviews")
      .select(
        `
        id, rating, comment, created_at, 
        reviewer:reviewer_id (name, avatar_url)
      `
      )
      .eq("product_id", productId)
      .order("created_at", { ascending: false });

    if (!error && data) setReviews(data as Review[]);
    setLoading(false);
  };

  if (loading)
    return <div className="py-6 text-center text-gray-500">Cargando reseñas...</div>;

  if (!reviews.length)
    return (
      <div className="py-6 text-center text-gray-500">
        Este producto aún no tiene reseñas.
      </div>
    );

  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / reviews.length
      : 0;

  // Mini estrellas
  const Stars = ({ value }: { value: number }) => (
    <span className="inline-flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((num) => (
        <Star
          key={num}
          fill={value >= num ? "#eab308" : "none"}
          className={`h-4 w-4 ${value >= num ? "text-yellow-500" : "text-gray-400"}`}
        />
      ))}
      <span className="ml-1 font-medium text-base">{value.toFixed(1)}/5</span>
    </span>
  );

  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <Stars value={avgRating} />
        <span className="text-gray-500">
          {reviews.length} {reviews.length === 1 ? "reseña" : "reseñas"}
        </span>
      </div>
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="border rounded-lg p-3 bg-gray-50">
            <div className="flex items-center gap-2 mb-1">
              {r.reviewer?.avatar_url && (
                <img
                  src={r.reviewer.avatar_url}
                  alt={r.reviewer.name}
                  className="w-7 h-7 rounded-full object-cover"
                />
              )}
              <span className="font-medium">{r.reviewer?.name ?? "Usuario"}</span>
              <Stars value={r.rating} />
            </div>
            {r.comment && (
              <div className="text-gray-700 text-sm mt-2">{r.comment}</div>
            )}
            <div className="text-xs text-gray-400 mt-1">
              {new Date(r.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
