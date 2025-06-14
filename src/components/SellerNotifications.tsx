
import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Bell } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const SellerNotifications = ({ userId }: { userId: string }) => {
  const [notifications, setNotifications] = useState<
    Array<{ id: string; title: string; message: string; read: boolean; created_at: string; related_order_id: string | null }>
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNotifications();
    // eslint-disable-next-line
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("notifications")
      .select("id, title, message, read, created_at, related_order_id")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(10);
    if (!error && data) setNotifications(data);
    setLoading(false);
  };

  return (
    <div className="relative">
      <Bell className="h-6 w-6 text-primary" />
      {notifications.some((noti) => !noti.read) && (
        <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-0.5 rounded-full">
          {notifications.filter((noti) => !noti.read).length}
        </Badge>
      )}
      {/* Puedes expandir aquí para renderizar la lista de notificaciones */}
    </div>
  );
};

export default SellerNotifications;
