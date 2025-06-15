
import React from "react";
import { AuthProvider } from "@/context/AuthContext";
import { ShopProvider } from "@/context/ShopContext";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "@/pages/LandingPage";
import AuthPage from "@/pages/AuthPage";
import Marketplace from "@/pages/Marketplace";
import ProfilePage from "@/pages/ProfilePage";
import SellerDashboard from "@/pages/SellerDashboard";
import AdminPage from "@/pages/AdminPage";
import CartPage from "@/pages/CartPage";

// Rutas simuladas
const App = () => (
  <AuthProvider>
    <ShopProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/cart" element={<CartPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/seller-dashboard" element={<SellerDashboard />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </ShopProvider>
  </AuthProvider>
);

export default App;
