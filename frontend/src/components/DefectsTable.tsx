"use client";

import { useState, useEffect } from "react";
import { ChevronUp, ChevronDown, Trash2, FileText } from "lucide-react";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
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
  assigneeId?: number;
  reporter: string;
  location: string;
  createdAt: string;
  updatedAt: string;
  dueDate?: string;
}

interface FilterState {
  status: {
    new: boolean;
    in_progress: boolean;
    review: boolean;
    closed: boolean;
    cancelled: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

interface DefectsTableProps {
  projectId: string;
  searchQuery: string;
  statusFilter: string;
  priorityFilter: string;
  dateFrom: string;
  dateTo: string;
  filters: FilterState;
  refreshKey?: number;
  canEditDefect?: boolean;
  userRole?: string;
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

const statusDisplayMapping: { [key: string]: string } = {
  "Новая": "Новый",
  "Закрыта": "Закрыт", 
  "Отменена": "Отменен"
};

export function DefectsTable({ 
  projectId, 
  searchQuery, 
  statusFilter, 
  priorityFilter, 
  dateFrom, 
  dateTo, 
  filters,
  canEditDefect = true,
  refreshKey,
  userRole
}: DefectsTableProps) {
  const [defects, setDefects] = useState<Defect[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedDefect, setSelectedDefect] = useState<Defect | null>(null);
  const [selectedDefects, setSelectedDefects] = useState<string[]>([]);
  const [sortField, setSortField] = useState<keyof Defect>("dueDate");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const fetchDefects = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashboard/${projectId}/defects?search=${encodeURIComponent(searchQuery)}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
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
  }, [projectId, searchQuery, statusFilter, priorityFilter, dateFrom, dateTo, refreshKey]);

  const handleDefectClick = (defect: Defect) => {
    // Everyone can view defects, even supervisors (they just can't edit)
    setSelectedDefect(defect);
    setIsEditModalOpen(true);
  };

  const handleEditSuccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/dashboard/${projectId}/defects?search=${encodeURIComponent(searchQuery)}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setDefects(data);
      }
    } catch (err) {
      console.error('Error refreshing defects:', err);
    }
  };

const handleSort = (field: keyof Defect) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const getSortIcon = (field: keyof Defect) => {
    if (sortField !== field) {
      return <ChevronUp className="w-3 h-3 text-[#6c757d]" />;
    }
    return sortDirection === "asc" ? (
      <ChevronUp className="w-3 h-3 text-[#007bff]" />
    ) : (
      <ChevronDown className="w-3 h-3 text-[#007bff]" />
    );
  };

  const handleSelectDefect = (defectId: string) => {
    setSelectedDefects((prev) =>
      prev.includes(defectId)
        ? prev.filter((id) => id !== defectId)
        : [...prev, defectId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDefects.length === filteredDefects.length) {
      setSelectedDefects([]);
    } else {
      setSelectedDefects(filteredDefects.map((d) => d.id));
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedDefects.length === 0) return;
    
    if (window.confirm(`Вы уверены, что хотите удалить выбранные дефекты (${selectedDefects.length})?`)) {
      try {
        const token = localStorage.getItem('token');
        const deletePromises = selectedDefects.map(defectId => 
          fetch(`/api/defects/${defectId}`, { 
            method: 'DELETE',
            headers: {
              'Authorization': `Bearer ${token}`
            }
          })
        );
        
        await Promise.all(deletePromises);
        setDefects(defects.filter((d) => !selectedDefects.includes(d.id)));
        setSelectedDefects([]);
      } catch (error) {
        console.error('Error deleting defects:', error);
      }
    }
  };

  const filteredDefects = defects.filter((defect) => {
    if (searchQuery && 
        !defect.title.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !defect.description.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !defect.id.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }

    if (statusFilter !== "all" && defect.status !== statusFilter) {
      return false;
    }

    if (priorityFilter !== "all" && defect.priority !== priorityFilter) {
      return false;
    }

    if (filters.status && !filters.status[defect.status]) {
      return false;
    }

    if (filters.priority && !filters.priority[defect.priority]) {
      return false;
    }

    if (dateFrom && defect.createdAt < dateFrom) {
      return false;
    }

    if (dateTo && defect.createdAt > dateTo) {
      return false;
    }

    return true;
  }).sort((a, b) => {
    const aValue = a[sortField];
    const bValue = b[sortField];
    
    if (!aValue && !bValue) return 0;
    if (!aValue) return 1;
    if (!bValue) return -1;
    
    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  const totalPages = Math.ceil(filteredDefects.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedDefects = filteredDefects.slice(startIndex, startIndex + itemsPerPage);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3, 4, 5].map((i) =>
          <div key={i} className="h-16 bg-[#f8f9fa] rounded animate-pulse"></div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-[#dc3545] text-center py-8">
        Ошибка загрузки дефектов: {error}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-[18px] font-semibold text-[#212529]">
          СПИСОК ДЕФЕКТОВ ({filteredDefects.length} найдено)
        </h3>
      </div>

      <div className="bg-white border border-[#dee2e6] rounded-lg overflow-hidden">
        <div className="overflow-auto scrollbar-hide">
          <table className="w-full border-collapse table-fixed">
            <thead>
              <tr className="bg-[#f8f9fa]">
              {canEditDefect && (
                <th className="w-12 py-3 pl-6 pr-4 text-left">
                  <Checkbox
                    checked={selectedDefects.length === filteredDefects.length && filteredDefects.length > 0}
                    onCheckedChange={handleSelectAll}
                    className="data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
                  />
                </th>
              )}
                <th 
                  className="w-20 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("id")}
                >
                  <div className="flex items-center space-x-1">
                    <span>№</span>
                    {getSortIcon("id")}
                  </div>
                </th>
                <th 
                  className="w-44 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("title")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Название</span>
                    {getSortIcon("title")}
                  </div>
                </th>
                <th 
                  className="w-24 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("status")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Статус</span>
                    {getSortIcon("status")}
                  </div>
                </th>
                <th 
                  className="w-20 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("priority")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Приоритет</span>
                    {getSortIcon("priority")}
                  </div>
                </th>
                <th 
                  className="w-24 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("assignee")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Исполнитель</span>
                    {getSortIcon("assignee")}
                  </div>
                </th>
                <th 
                  className="w-24 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("location")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Местоположение</span>
                    {getSortIcon("location")}
                  </div>
                </th>
                <th 
                  className="w-20 text-left py-3 px-4 font-semibold text-[#212529] text-sm cursor-pointer"
                  onClick={() => handleSort("dueDate")}
                >
                  <div className="flex items-center space-x-1">
                    <span>Дедлайн</span>
                    {getSortIcon("dueDate")}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedDefects.map((defect) => (
                <tr 
                  key={defect.id} 
                  className="border-b border-[#f8f9fa] hover:bg-[#f8f9fa] transition-colors"
                >
                  {canEditDefect && (
                    <td className="py-3 pl-6 pr-4 w-12">
                      <Checkbox
                        checked={selectedDefects.includes(defect.id)}
                        onCheckedChange={() => handleSelectDefect(defect.id)}
                        className="data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
                      />
                    </td>
                  )}
                  <td 
                    className={`py-3 px-4 text-sm font-medium text-[#007bff] ${canEditDefect ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => handleDefectClick(defect)}
                  >
                    TRP-{defect.id}
                  </td>
                  <td 
                    className={`py-3 px-4 ${canEditDefect ? 'cursor-pointer' : 'cursor-default'}`}
                    onClick={() => handleDefectClick(defect)}
                  >
                    <div>
                      <div className="text-sm font-medium text-[#212529] truncate">{defect.title}</div>
                      <div className="text-xs text-[#6c757d] truncate">{defect.description}</div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColors[defect.status]}`}>
                      {statusDisplayMapping[defect.statusDisplay] || defect.statusDisplay}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`text-sm font-medium ${priorityColors[defect.priority]}`}>
                      {defect.priorityDisplay}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-[#212529] truncate">
                    {defect.assignee || 'Не назначен'}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6c757d] truncate">
                    {defect.location}
                  </td>
                  <td className="py-3 px-4 text-sm text-[#6c757d]">
                    {defect.dueDate ? new Date(defect.dueDate).toLocaleDateString('ru-RU') : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          >
            Пред
          </Button>
          <span className="text-sm text-[#6c757d]">
            Страница {currentPage} из {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
          >
            След
          </Button>
        </div>

        <div className="flex space-x-2">
          {(!userRole || userRole === 'supervisor') && (
            <Button variant="outline" size="sm">
              <FileText className="w-4 h-4 mr-2" />
              Экспорт
            </Button>
          )}
          {canEditDefect && userRole !== 'engineer' && (
            <Button
              variant="outline"
              size="sm"
              disabled={selectedDefects.length === 0}
              className="text-[#dc3545] hover:text-[#dc3545] hover:bg-red-50"
              onClick={handleDeleteSelected}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Удалить ({selectedDefects.length})
            </Button>
          )}
        </div>
      </div>

      <EditDefectModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedDefect(null);
        }}
        onSuccess={handleEditSuccess}
        defect={selectedDefect}
        userRole={userRole}
        projectId={projectId}
      />
    </div>
  );
}