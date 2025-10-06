"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";
import { CreateOrganizationModal } from "./CreateOrganizationModal";
import { useAuth } from "@/contexts/AuthContext";

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  defectsCount: number;
  teamSize: number;
  lastDefectDate: string | null;
}

interface ProjectSelectorProps {
  onProjectSelect: (project: Project) => void;
  isSupervisor?: boolean;
  onExportClick?: () => void;
}

const statusColors = {
  active: "bg-[#28a745] text-white",
  planning: "bg-[#ffc107] text-[#212529]",
  completed: "bg-[#6c757d] text-white"
};

const statusLabels = {
  active: "Активный",
  planning: "Планирование",
  completed: "Завершен"
};

export function ProjectSelector({ onProjectSelect, isSupervisor = false, onExportClick }: ProjectSelectorProps) {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const isAdmin = user?.is_superuser === true;

  const fetchProjects = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        window.location.href = '/login';
        return;
      }
      
      const response = await fetch('http://localhost:8000/api/v1/organizations/', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          window.location.href = '/login';
          return;
        }
        throw new Error('Не удалось загрузить список организаций');
      }
      
      const data = await response.json();
      
      const mappedProjects = data.map((project: any) => ({
        id: String(project.id),
        name: project.name,
        description: project.description || '',
        status: project.status,
        defectsCount: project.defects_count || 0,
        teamSize: project.team_size || 0,
        lastDefectDate: project.last_defect_date || null
      }));
      
      setProjects(mappedProjects);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Произошла ошибка');
      console.error('Error fetching projects:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleCreateSuccess = () => {
    fetchProjects();
  };

  const filteredProjects = projects.filter((project) =>
  project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
  project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-3 md:p-6">
        <div className="text-center py-12">
          <p className="text-[#6c757d] text-lg">Загрузка предприятий...</p>
        </div>
      </div>);

  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#212529] mb-2">
          Выбор предприятия
        </h1>
        <p className="text-[#6c757d]">
          Выберите промышленное предприятие для управления дефектами и контроля качества производства
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-800">{error}</p>
          <button
            onClick={fetchProjects}
            className="mt-2 text-sm text-[#007bff] hover:text-[#0056b3] font-medium"
          >
            Попробовать снова
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="relative max-w-md">
          <Input
            placeholder="Поиск предприятий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff] text-[#212529]"
          />
        </div>
        <div className="flex gap-2">
          {isSupervisor && onExportClick && (
            <Button
              onClick={onExportClick}
              className="bg-[#28a745] hover:bg-[#218838] text-white"
            >
              Экспорт общего отчета
            </Button>
          )}
          <Button
            onClick={() => setIsCreateModalOpen(true)}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white"
          >
            + Добавить организацию
          </Button>
        </div>
      </div>

      {projects.length === 0 && !error ? (
        <div className="text-center py-12 bg-[#f8f9fa] rounded-lg border border-[#dee2e6]">
          <div className="max-w-md mx-auto">
            <div className="w-16 h-16 bg-[#007bff] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-[#007bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 className="text-[20px] font-semibold text-[#212529] mb-2">
              Вы пока не состоите ни в одной организации
            </h3>
            <p className="text-[#6c757d] mb-6">
              Создайте новую организацию для начала работы или дождитесь приглашения от других пользователей
            </p>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white"
            >
              Создать организацию
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="border border-[#dee2e6] hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => onProjectSelect(project)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={`text-xs px-2 py-1 ${statusColors[project.status]}`}>
                      {statusLabels[project.status]}
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-[#6c757d]">Дефекты</div>
                    <div className="font-semibold text-[#dc3545]">{project.defectsCount}</div>
                  </div>
                </div>
                <CardTitle className="text-[18px] font-semibold text-[#212529] leading-tight">
                  {project.name}
                </CardTitle>
                <CardDescription className="text-[#6c757d] text-sm leading-relaxed">
                  {project.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-3">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-[#6c757d]">
                      <div className="font-medium text-[#212529]">{project.teamSize}</div>
                      <div className="text-xs">Сотрудников</div>
                    </div>
                    <div className="text-[#6c757d] text-right">
                      <div className="font-medium text-[#212529]">
                        {project.lastDefectDate
                          ? new Date(project.lastDefectDate).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' })
                          : 'Нет дефектов'
                        }
                      </div>
                      <div className="text-xs">Последний дефект</div>
                    </div>
                  </div>

                  <Button
                    className="w-full bg-[#007bff] hover:bg-[#0056b3] text-white"
                    onClick={(e) => {
                      e.stopPropagation();
                      onProjectSelect(project);
                    }}
                  >
                    Выбрать предприятие
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {projects.length > 0 && filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-[18px] font-semibold text-[#212529] mb-2">
            Предприятия не найдены
          </h3>
          <p className="text-[#6c757d]">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}

      <CreateOrganizationModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess} />

    </div>);
}