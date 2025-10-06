"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Eye, EyeOff, Shield, ArrowLeft } from "lucide-react";
import { BACKEND_API_URL } from '@/utils/config';

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
    firstName: "",
    lastName: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const validateForm = () => {
    if (!formData.username.trim()) {
      setError("Введите логин");
      return false;
    }
    if (formData.username.length < 3) {
      setError("Логин должен содержать минимум 3 символа");
      return false;
    }
    if (!formData.email.trim()) {
      setError("Введите email");
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      setError("Введите корректный email");
      return false;
    }
    if (!formData.password) {
      setError("Введите пароль");
      return false;
    }
    if (formData.password.length < 6) {
      setError("Пароль должен содержать минимум 6 символов");
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      setError("Пароли не совпадают");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${BACKEND_API_URL}/auth/register`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          first_name: formData.firstName || undefined,
          last_name: formData.lastName || undefined,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка регистрации');
      }

      const data = await response.json();
      
      localStorage.setItem('token', data.access_token);
      localStorage.setItem('user', JSON.stringify(data.user));
      
      router.push('/organizations');
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка при регистрации");
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
            Создайте новую учетную запись
          </p>
        </div>

        <Card className="border border-[#dee2e6] shadow-sm">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-[18px] font-semibold text-[#212529]">
              Регистрация
            </CardTitle>
            <CardDescription className="text-[#6c757d]">
              Заполните форму для создания аккаунта
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-sm text-red-800">{error}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="firstName" className="text-[#212529]">
                    Имя
                  </Label>
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Иван"
                    value={formData.firstName}
                    onChange={handleChange}
                    className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529]"
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName" className="text-[#212529]">
                    Фамилия
                  </Label>
                  <Input
                    id="lastName"
                    name="lastName"
                    type="text"
                    placeholder="Петров"
                    value={formData.lastName}
                    onChange={handleChange}
                    className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529]"
                    disabled={isLoading}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="username" className="text-[#212529]">
                  Логин <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Введите логин"
                  value={formData.username}
                  onChange={handleChange}
                  className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529]"
                  disabled={isLoading}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[#212529]">
                  Email <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="example@mail.com"
                  value={formData.email}
                  onChange={handleChange}
                  className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529]"
                  disabled={isLoading}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="text-[#212529]">
                  Пароль <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Минимум 6 символов"
                    value={formData.password}
                    onChange={handleChange}
                    className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529] pr-10"
                    disabled={isLoading}
                    required
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

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-[#212529]">
                  Подтвердите пароль <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Повторите пароль"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529] pr-10"
                    disabled={isLoading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#6c757d] hover:text-[#212529] transition-colors"
                    disabled={isLoading}
                  >
                    {showConfirmPassword ? (
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
                disabled={isLoading}
              >
                {isLoading ? "Регистрация..." : "Зарегистрироваться"}
              </Button>

              <div className="text-center mt-4">
                <p className="text-sm text-[#6c757d]">
                  Уже есть аккаунт?{" "}
                  <a href="/login" className="text-[#007bff] hover:text-[#0056b3] font-medium">
                    Войти
                  </a>
                </p>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Back to Login Link */}
        <div className="text-center mt-4">
          <button
            onClick={() => router.push('/login')}
            className="inline-flex items-center space-x-2 text-sm text-[#007bff] hover:text-[#0056b3] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Вернуться к входу</span>
          </button>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-[14px] text-[#6c757d]">
            © 2024 Система управления дефектами
          </p>
        </div>
      </div>
    </div>
  );
}
