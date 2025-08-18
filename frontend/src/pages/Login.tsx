import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, EyeOff, Lock, User, KeyRound } from "lucide-react";
import { useAuth } from '@/contexts/AuthContext'; // Importar o hook

const Login: React.FC = () => { // Remover props
  const { login } = useAuth(); // Usar o hook
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Estados para primeiro acesso
  const [step, setStep] = useState<'email' | 'password' | 'first-password'>('email');
  const [userInfo, setUserInfo] = useState<any>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Função para verificar se usuário precisa definir senha
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3008'}/api/v1/auth/check-first-login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (data.success) {
        setUserInfo(data.data.user);
        if (data.data.requiresPasswordSetup) {
          setStep('first-password');
        } else {
          setStep('password');
        }
      } else {
        setError(data.error || 'Usuário não encontrado');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Função para login normal
  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3008'}/api/v1/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
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

  // Função para definir primeira senha
  const handleFirstPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      setError('As senhas não coincidem');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL || 'http://localhost:3008'}/api/v1/auth/set-first-password`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password: newPassword }),
      });

      const data = await response.json();

      if (data.success && data.data?.token) {
        // Login automático após definir senha
        login(data.data.token, data.data.user);
      } else {
        setError(data.error || 'Erro ao definir senha');
      }
    } catch (err) {
      console.error('Erro de conexão:', err);
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  // Função para voltar ao step anterior
  const handleBack = () => {
    if (step === 'password' || step === 'first-password') {
      setStep('email');
      setUserInfo(null);
      setPassword('');
      setNewPassword('');
      setConfirmPassword('');
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
            
            {/* Step 1: Email */}
            {step === 'email' && (
              <form onSubmit={handleEmailSubmit} className="space-y-4">
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

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <Button 
                  type="submit" 
                  className="w-full h-11 bg-black hover:bg-gray-800 text-white"
                  disabled={loading}
                >
                  {loading ? 'Verificando...' : 'Continuar'}
                </Button>
              </form>
            )}

            {/* Step 2: Senha normal */}
            {step === 'password' && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <p className="text-sm text-gray-600">
                    Olá, <strong>{userInfo?.name}</strong>
                  </p>
                  <p className="text-xs text-gray-500">{email}</p>
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
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
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

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-black hover:bg-gray-800 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Entrando...' : 'Entrar'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-full h-11"
                  >
                    Voltar
                  </Button>
                </div>
              </form>
            )}

            {/* Step 3: Definir primeira senha */}
            {step === 'first-password' && (
              <form onSubmit={handleFirstPasswordSubmit} className="space-y-4">
                <div className="text-center mb-4">
                  <KeyRound className="mx-auto h-12 w-12 text-blue-600 mb-2" />
                  <p className="text-sm text-gray-600">
                    Olá, <strong>{userInfo?.name}</strong>
                  </p>
                  <p className="text-xs text-gray-500 mb-2">{email}</p>
                  <p className="text-sm text-blue-600 font-medium">
                    Defina sua senha de acesso
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Nova Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="pl-10 pr-10 h-11"
                      placeholder="••••••••"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700">
                    Confirmar Senha
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="pl-10 h-11"
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                {error && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-3">
                  <Button 
                    type="submit" 
                    className="w-full h-11 bg-blue-600 hover:bg-blue-700 text-white"
                    disabled={loading}
                  >
                    {loading ? 'Definindo...' : 'Definir Senha e Entrar'}
                  </Button>
                  
                  <Button 
                    type="button"
                    variant="outline"
                    onClick={handleBack}
                    className="w-full h-11"
                  >
                    Voltar
                  </Button>
                </div>

                <div className="text-xs text-gray-500 text-center">
                  A senha deve ter pelo menos 6 caracteres
                </div>
              </form>
            )}
            
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export default Login;