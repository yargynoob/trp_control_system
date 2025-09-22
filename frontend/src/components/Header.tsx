"use client";

interface HeaderProps {
  userName?: string;
  userRole?: string;
}

export function Header({ userName = "Иван Петров", userRole = "Менеджер" }: HeaderProps) {
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
            <div className="text-sm font-semibold text-[#212529]">{userName}</div>
            <div className="text-xs text-[#6c757d]">{userRole}</div>
          </div>
          <div className="relative">
            <button className="flex items-center space-x-2 p-2 rounded-lg hover:bg-[#f8f9fa] transition-colors">
              <div className="w-8 h-8 bg-[#e9ecef] rounded-full"></div>
              <span className="text-[#6c757d] hidden sm:block">▼</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
