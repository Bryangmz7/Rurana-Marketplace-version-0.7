
import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Star } from "lucide-react";

interface ProductReviewFormProps {
  productId: string;
  orderId?: string;
  onReviewSubmitted?: () => void;
}

const ProductReviewForm: React.FC<ProductReviewFormProps> = ({
  productId,
  orderId,
  onReviewSubmitted,
}) => {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // Estrellas interactivas
  const StarRating = () => (
    <div className="flex space-x-1 mb-2">
      {[1, 2, 3, 4, 5].map((num) => (
        <button
          type="button"
          key={num}
          onClick={() => setRating(num)}
          className={`transition-colors ${rating >= num ? "text-yellow-500" : "text-gray-400"}`}
        >
          <Star fill={rating >= num ? "#eab308" : "none"} className="h-6 w-6" />
        </button>
      ))}
    </div>
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    try {
      if (!user) {
        toast({
          title: "Inicia sesión",
          description: "Debes iniciar sesión para dejar una reseña.",
          variant: "destructive",
        });
        return;
      }
      // No permitir spameo
      // @ts-ignore: "reviews" table no está en las types
      const { data: existing } = await supabase
        .from("reviews" as any)
        .select("id")
        .eq("reviewer_id", user.id)
        .eq("product_id", productId)
        .maybeSingle();
      if (existing) {
        toast({
          title: "Ya dejaste una reseña",
          description: "Solo puedes dejar una reseña por producto.",
          variant: "destructive",
        });
        return;
      }
      // @ts-ignore: "reviews" table no está aún en las types
      const { error } = await supabase.from("reviews" as any).insert({
        reviewer_id: user.id,
        product_id: productId,
        order_id: orderId ?? null,
        rating,
        comment: comment.trim() ? comment : null,
      });
      if (error) throw error;
      toast({ title: "¡Gracias!", description: "Tu reseña ha sido enviada." });
      setComment("");
      setRating(5);
      if (onReviewSubmitted) onReviewSubmitted();
    } catch (err: any) {
      toast({
        title: "Error al enviar la reseña",
        description: err.message ?? "Intenta de nuevo.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form className="space-y-3 border rounded-lg p-4 bg-white" onSubmit={handleSubmit}>
      <div>
        <label className="block mb-1 font-medium">Tu calificación</label>
        <StarRating />
      </div>
      <div>
        <Textarea
          placeholder="Agrega un comentario (opcional)"
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={2}
          maxLength={512}
        />
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? "Enviando..." : "Enviar Reseña"}
      </Button>
    </form>
  );
};

export default ProductReviewForm;
