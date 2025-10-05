"use client";

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User } from 'lucide-react';

export function Header() {
  const { user, logout } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  const displayName = user?.first_name && user?.last_name 
    ? `${user.first_name} ${user.last_name}` 
    : user?.username || 'Пользователь';

  return (
    <header className="bg-white border-b border-[#dee2e6] px-4 py-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-[#007bff] rounded-lg"></div>
          <div>
            <h1 className="text-lg font-bold text-[#212529]">
              Система управления дефектами
            </h1>
            <p className="text-sm text-[#6c757d]">
              Контроль качества производства
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-[#212529]">{displayName}</div>
            <div className="text-xs text-[#6c757d]">{user?.email}</div>
          </div>
          <div className="relative">
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#f8f9fa] transition-colors"
            >
              <div className="w-8 h-8 bg-[#007bff] rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <span className="text-[#6c757d] hidden sm:block">▼</span>
            </button>

            {showMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-[#dee2e6] rounded-lg shadow-lg z-50">
                <button
                  onClick={() => {
                    setShowMenu(false);
                    logout();
                  }}
                  className="w-full flex items-center space-x-2 px-4 py-3 text-left hover:bg-[#f8f9fa] transition-colors"
                >
                  <LogOut className="w-4 h-4 text-[#6c757d]" />
                  <span className="text-sm text-[#212529]">Выйти</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}