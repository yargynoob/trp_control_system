"use client";

import { useState, useEffect } from "react";
import { EditDefectModal } from "@/components/EditDefectModal";

interface Defect {
  id: string;
  title: string;
  description: string;
  status: "new" | "in_progress" | "review" | "closed" | "cancelled";
  statusDisplay: string;
  priority: "low" | "medium" | "high" | "critical";
  priorityDisplay: string;
  assignee: string;
  reporter: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

interface DefectsTableProps {
  projectId: string;
  searchQuery: string;
  refreshKey?: number;
}

const statusColors = {
  new: "bg-[#6c757d] text-white",
  in_progress: "bg-[#007bff] text-white",
  review: "bg-[#ffc107] text-[#212529]",
  closed: "bg-[#28a745] text-white",
  cancelled: "bg-[#dc3545] text-white"
};

const priorityColors = {
  low: "text-[#28a745]",
  medium: "text-[#ffc107]",
  high: "text-[#fd7e14]",
  critical: "text-[#dc3545]"
};

export function DefectsTable({ projectId, searchQuery, refreshKey }: DefectsTableProps) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);

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
  }, [projectId, searchQuery, refreshKey]);

  const handleDefectClick = (defect: Defect) => {
    setSelectedDefect(defect);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    // Перезагружаем данные дефектов после успешного редактирования
    try {
      const response = await fetch(`/api/dashboard/${projectId}/defects?search=${encodeURIComponent(searchQuery)}`);
      if (response.ok) {
        const data = await response.json();
        setDefects(data);
      }
    } catch (err) {
      console.error('Error refreshing defects:', err);
    }
  };

  const handleDeleteDefect = async (defectId: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить дефект TRP-${defectId}?`)) {
      try {
        const response = await fetch(`/api/defects/${defectId}`, {
          method: 'DELETE'
        });

        if (response.ok) {

          setDefects(defects.filter((d) => d.id !== defectId));
        } else {
          console.error('Failed to delete defect');
        }
      } catch (error) {
        console.error('Error deleting defect:', error);
      }
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) =>
        <div key={i} className="h-16 bg-[#f8f9fa] rounded animate-pulse"></div>
        )}
      </div>);

  }

  if (error) {
    return (
      <div className="text-center py-8">
        <p className="text-[#dc3545] mb-4">Ошибка: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-[#007bff] text-white rounded hover:bg-[#0056b3]">

          Попробовать снова
        </button>
      </div>);

  }

  if (defects.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-[#6c757d] text-lg">
          {searchQuery ? 'Дефекты не найдены' : 'Дефекты отсутствуют'}
        </p>
      </div>);

  }

  return (
    <>
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
              <th className="text-left py-3 px-4 font-semibold text-[#212529] text-sm">Действия</th>
            </tr>
          </thead>
          <tbody>
            {defects.map((defect) =>
            <tr 
              key={defect.id} 
              className="border-b border-[#f8f9fa] hover:bg-[#f8f9fa] cursor-pointer"
              onClick={() => handleDefectClick(defect)}
            >
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
                    {defect.statusDisplay}
                  </span>
                </td>
                <td className="py-3 px-4">
                  <span className={`text-sm font-medium ${priorityColors[defect.priority]}`}>
                    {defect.priorityDisplay}
                  </span>
                </td>
                <td className="py-3 px-4 text-sm text-[#212529]">
                  {defect.assignee || 'Не назначен'}
                </td>
                <td className="py-3 px-4 text-sm text-[#6c757d] max-w-xs truncate">
                  {defect.location}
                </td>
                <td className="py-3 px-4 text-sm text-[#6c757d]">
                  {defect.createdAt ? new Date(defect.createdAt).toLocaleDateString('ru-RU') : '—'}
                </td>
                <td className="py-3 px-4">
                  <button
                    onClick={(e) => {
                      e.stopPropagation(); // Предотвращаем срабатывание клика по строке
                      handleDeleteDefect(defect.id);
                    }}
                    className="text-[#dc3545] hover:text-[#b02a37] text-lg font-bold p-1"
                    title="Удалить дефект"
                  >
                    ×
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
      
      {/* Модальное окно редактирования дефекта */}
      <EditDefectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDefect(null);
        }}
        onSuccess={handleEditSuccess}
        defect={selectedDefect}
      />
    </>
  );

}