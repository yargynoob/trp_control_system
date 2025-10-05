"use client";

import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Shield } from "lucide-react";

export default function LoginPage() {
  const { login } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username.trim() || !password.trim()) {
      setError("Пожалуйста, заполните все поля");
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      await login(username, password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Неверный логин или пароль");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-[#007bff] rounded-lg mb-4">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-[24px] font-bold text-[#212529] mb-2">
            Система управления дефектами
          </h1>
          <p className="text-[#6c757d]">
            Войдите в свою учетную запись
          </p>
        </div>

        <Card className="border border-[#dee2e6] shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#212529]">
              Вход в систему
            </CardTitle>
            <CardDescription className="text-[#6c757d]">
              Введите ваши учетные данные для доступа к дашборду
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#212529]">
                  Логин
                </Label>
                <Input
                  id="username"
                  type="text"
                  placeholder="Введите логин"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529]"
                  disabled={isLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#212529]">
                  Пароль
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Введите пароль"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529] pr-10"
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#212529] transition-colors"
                    disabled={isLoading}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-[#007bff] hover:bg-[#0056b3] text-white"
                disabled={isLoading || !username.trim() || !password.trim()}
              >
                {isLoading ? "Вход..." : "Войти в систему"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-[#6c757d]">
                  Нет аккаунта?{" "}
                  <a href="/register" className="text-[#007bff] hover:text-[#0056b3] font-medium">
                    Зарегистрироваться
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        <div className="text-center mt-6">
          <p className="text-[14px] text-[#6c757d]">
            © 2024 Система управления дефектами
          </p>
        </div>
      </div>
    </div>
  );
}
