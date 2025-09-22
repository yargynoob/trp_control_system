"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Input } from "./ui/input";

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

export function ProjectSelector({ onProjectSelect }: ProjectSelectorProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('/api/organizations');
        if (!response.ok) {
          throw new Error('Failed to fetch organizations');
        }
        const data = await response.json();
        setProjects(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching projects:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, []);

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    project.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="p-3 md:p-6">
        <div className="text-center py-12">
          <p className="text-[#6c757d] text-lg">Загрузка предприятий...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-3 md:p-6">
        <div className="text-center py-12">
          <p className="text-[#dc3545] text-lg">Ошибка: {error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-[#007bff] text-white rounded hover:bg-[#0056b3]"
          >
            Попробовать снова
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 md:p-6">
      <div className="mb-6">
        <h1 className="text-[24px] font-bold text-[#212529] mb-2">
          Выбор предприятия
        </h1>
        <p className="text-[#6c757d]">
          Выберите промышленное предприятие для управления дефектами и контроля качества производства
        </p>
      </div>

      <div className="mb-6">
        <div className="relative max-w-md">
          <Input
            placeholder="Поиск предприятий..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="border-[#dee2e6] focus:border-[#007bff] focus:ring-[#007bff]"
          />
        </div>
      </div>

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

      {filteredProjects.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-[18px] font-semibold text-[#212529] mb-2">
            Предприятия не найдены
          </h3>
          <p className="text-[#6c757d]">
            Попробуйте изменить поисковый запрос
          </p>
        </div>
      )}
    </div>
  );
}
