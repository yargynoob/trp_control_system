"use client";

import { useState, useEffect } from "react";

interface Defect {
  id: string;
  title: string;
  description: string;
  status: "open" | "in_progress" | "resolved" | "closed";
  priority: "critical" | "high" | "medium" | "low";
  severity: "minor" | "major" | "critical" | "blocker";
  assignee: string;
  reporter: string;
  location: string;
  equipment: string;
  defectType: string;
  foundDate: string;
  updatedAt: string;
}

interface DefectsTableProps {
  projectId: string;
  searchQuery: string;
}

const statusLabels = {
  open: "Открыт",
  in_progress: "В работе",
  resolved: "Решен",
  closed: "Закрыт"
};

const priorityLabels = {
  critical: "Критический",
  high: "Высокий", 
  medium: "Средний",
  low: "Низкий"
};

const statusColors = {
  open: "bg-[#dc3545] text-white",
  in_progress: "bg-[#ffc107] text-[#212529]",
  resolved: "bg-[#28a745] text-white",
  closed: "bg-[#6c757d] text-white"
};

const priorityColors = {
  critical: "text-[#dc3545]",
  high: "text-[#fd7e14]",
  medium: "text-[#ffc107]", 
  low: "text-[#28a745]"
};

export function DefectsTable({ projectId, searchQuery }: DefectsTableProps) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        setLoading(true);
        const response = await fetch(`/api/dashboard/${projectId}/defects?search=${encodeURIComponent(searchQuery)}`);
        if (!response.ok) {
          throw new Error('Failed to fetch defects');
        }
        const data = await response.json();
        setDefects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching defects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchDefects();
  }, [projectId, searchQuery]);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-16 bg-[#f8f9fa] rounded animate-pulse"></div>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[#dc3545] mb-4">Ошибка: {error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#007bff] text-white rounded hover:bg-[#0056b3]"
        >
          Попробовать снова
        </button>
      </div>
    );
  }

  if (defects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#6c757d] text-lg">
          {searchQuery ? 'Дефекты не найдены' : 'Дефекты отсутствуют'}
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          <tr className="border-b border-[#dee2e6]">
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">ID</th>
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Название</th>
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Статус</th>
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Приоритет</th>
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Ответственный</th>
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Местоположение</th>
            <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Дата</th>
          </tr>
        </thead>
        <tbody>
          {defects.map((defect) => (
            <tr key={defect.id} className="border-b border-[#f8f9fa] hover:bg-[#f8f9fa]">
              <td className="py-3 px-4 text-sm font-medium text-[#007bff]">
                TRP-{defect.id}
              </td>
              <td className="py-3 px-4">
                <div>
                  <div className="text-sm font-medium text-[#212529]">{defect.title}</div>
                  <div className="text-xs text-[#6c757d] truncate max-w-xs">{defect.description}</div>
                </div>
              </td>
              <td className="py-3 px-4">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[defect.status]}`}>
                  {statusLabels[defect.status]}
                </span>
              </td>
              <td className="py-3 px-4">
                <span className={`text-sm font-medium ${priorityColors[defect.priority]}`}>
                  {priorityLabels[defect.priority]}
                </span>
              </td>
              <td className="py-3 px-4 text-sm text-[#212529]">
                {defect.assignee || 'Не назначен'}
              </td>
              <td className="py-3 px-4 text-sm text-[#6c757d] max-w-xs truncate">
                {defect.location}
              </td>
              <td className="py-3 px-4 text-sm text-[#6c757d]">
                {new Date(defect.foundDate).toLocaleDateString('ru-RU')}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
