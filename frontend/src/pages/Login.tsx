import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext'; // Importar o hook

const Login: React.FC = () => { // Remover props
  const { login } = useAuth(); // Usar o hook
  const [email, setEmail] = useState('admin@glgarantias.com');
  const [password, setPassword] = useState('Admin123');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('http://localhost:3010/api/v1/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data) {
        // Acessar a estrutura aninhada correta
        login(data.data.token, data.data.user);
      } else {
        setError(data.error || 'Erro ao fazer login');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
                 <Card className="shadow-lg border-2 border-black bg-white">
          <CardHeader className="space-y-6 pb-8">
            <div className="flex flex-col items-center space-y-3">
              <img 
                src="/images/logo.png" 
                alt="GL Garantias Logo" 
                className="h-16 w-auto"
              />
              <CardDescription className="text-gray-600 text-center">
                Sistema GLúcio de Garantias
              </CardDescription>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Email
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10 h-11"
                    placeholder="seu@email.com"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700">
                  Senha
                </label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10 pr-10 h-11"
                    placeholder="••••••••"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <Alert className="border-red-200 bg-red-50">
                  <AlertDescription className="text-red-700">
                    {error}
                  </AlertDescription>
                </Alert>
              )}

              <Button
                type="submit"
                className="w-full h-11 bg-black hover:bg-gray-800 text-white font-medium"
                disabled={loading}
              >
                {loading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Entrando...
                  </div>
                ) : (
                  'Entrar'
                )}
              </Button>
            </form>

            <div className="text-center text-xs text-gray-500 pt-4 border-t">
              <p>Credenciais padrão:</p>
                             <p className="font-mono bg-gray-100 p-2 rounded mt-1">
                 admin@glgarantias.com / Admin123
               </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;