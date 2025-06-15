
import React from "react";
import { useAuth } from "@/context/AuthContext";
import { mockUsers } from "@/mocks/users";
import { useNavigate } from "react-router-dom";

const AuthPage = () => {
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleLogin = (id: string) => {
    login(id);
    navigate("/");
  };

  return (
    <div className="max-w-sm mx-auto mt-16 p-6 border rounded">
      <h2 className="font-bold text-xl mb-4">Simular Login</h2>
      {mockUsers.map(user => (
        <button
          key={user.id}
          className="block w-full border px-4 py-2 mb-2 rounded hover:bg-primary hover:text-white"
          onClick={() => handleLogin(user.id)}
        >
          Entrar como {user.name} ({user.role})
        </button>
      ))}
    </div>
  );
};

export default AuthPage;
