"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Checkbox } from "./ui/checkbox";

interface Project {
  id: number;
  name: string;
  description: string;
  address: string;
}

interface MultiProjectExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function MultiProjectExportModal({ isOpen, onClose, onSuccess }: MultiProjectExportModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"csv" | "excel">("excel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProjects, setSelectedProjects] = useState<number[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);

  useEffect(() => {
    if (isOpen) {
      fetchSupervisorProjects();
    }
  }, [isOpen]);

  const fetchSupervisorProjects = async () => {
    try {
      setLoadingProjects(true);
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/users/me/supervisor-projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setProjects(data);
        setSelectedProjects(data.map((p: Project) => p.id));
      } else {
        setError('Не удалось загрузить список проектов');
      }
    } catch (error) {
      console.error('Error fetching projects:', error);
      setError('Ошибка при загрузке проектов');
    } finally {
      setLoadingProjects(false);
    }
  };

  const toggleProject = (projectId: number) => {
    setSelectedProjects(prev =>
      prev.includes(projectId)
        ? prev.filter(id => id !== projectId)
        : [...prev, projectId]
    );
  };

  const toggleAll = () => {
    if (selectedProjects.length === projects.length) {
      setSelectedProjects([]);
    } else {
      setSelectedProjects(projects.map(p => p.id));
    }
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Введите название отчета");
      return;
    }

    if (selectedProjects.length === 0) {
      setError("Выберите хотя бы один проект");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          project_ids: selectedProjects,
          title,
          description,
          format
        }),
      });

      if (response.ok) {
        setTitle("");
        setDescription("");
        setFormat("excel");
        setSelectedProjects([]);
        onSuccess();
        onClose();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Не удалось создать отчет');
      }
    } catch (error) {
      console.error('Error creating report:', error);
      setError('Не удалось создать отчет');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setFormat("excel");
    setSelectedProjects([]);
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[600px] max-w-none px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold text-[#212529]">
            ЭКСПОРТ ОБЩЕГО ОТЧЕТА
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[600px] overflow-y-auto scrollbar-hide">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div>
            <Label htmlFor="title" className="text-sm font-medium text-[#212529]">
              Название отчета <span className="text-red-500">*</span>
            </Label>
            <Input
              id="title"
              placeholder="Введите название отчета..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 border-[#ced4da] focus:border-[#007bff] focus:ring-[#007bff]"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-sm font-medium text-[#212529]">
              Описание (необязательно)
            </Label>
            <Textarea
              id="description"
              placeholder="Добавьте описание отчета..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 h-[80px] border-[#ced4da] focus:border-[#007bff] focus:ring-[#007bff] resize-none"
            />
          </div>

          <div>
            <Label className="text-sm font-medium text-[#212529] mb-2 block">
              Выберите проекты <span className="text-red-500">*</span>
            </Label>
            
            {loadingProjects ? (
              <div className="p-4 text-center text-[#6c757d]">
                Загрузка проектов...
              </div>
            ) : projects.length === 0 ? (
              <div className="p-4 text-center text-[#6c757d]">
                У вас нет проектов в роли руководителя
              </div>
            ) : (
              <div className="border border-[#ced4da] rounded-md p-3 space-y-2 max-h-[200px] overflow-y-auto">
                <div className="flex items-center space-x-2 pb-2 border-b border-[#dee2e6]">
                  <Checkbox
                    id="select-all"
                    checked={selectedProjects.length === projects.length}
                    onCheckedChange={toggleAll}
                    className="data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
                  />
                  <label
                    htmlFor="select-all"
                    className="text-sm font-medium text-[#212529] cursor-pointer"
                  >
                    Выбрать все ({projects.length})
                  </label>
                </div>
                
                {projects.map((project) => (
                  <div key={project.id} className="flex items-start space-x-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedProjects.includes(project.id)}
                      onCheckedChange={() => toggleProject(project.id)}
                      className="mt-1 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="flex-1 cursor-pointer"
                    >
                      <div className="text-sm font-medium text-[#212529]">
                        {project.name}
                      </div>
                      {project.description && (
                        <div className="text-xs text-[#6c757d]">
                          {project.description}
                        </div>
                      )}
                    </label>
                  </div>
                ))}
              </div>
            )}
            
            {selectedProjects.length > 0 && (
              <div className="mt-2 text-sm text-[#6c757d]">
                Выбрано проектов: {selectedProjects.length} из {projects.length}
              </div>
            )}
          </div>

          <div>
            <Label className="text-sm font-medium text-[#212529] mb-2 block">
              Формат файла <span className="text-red-500">*</span>
            </Label>
            <div className="space-y-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="excel"
                  checked={format === "excel"}
                  onChange={(e) => setFormat(e.target.value as "excel")}
                  className="w-4 h-4 text-[#007bff] border-[#ced4da] focus:ring-[#007bff]"
                />
                <span className="text-sm text-[#212529]">
                  Excel (.xlsx) - с форматированием
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="radio"
                  name="format"
                  value="csv"
                  checked={format === "csv"}
                  onChange={(e) => setFormat(e.target.value as "csv")}
                  className="w-4 h-4 text-[#007bff] border-[#ced4da] focus:ring-[#007bff]"
                />
                <span className="text-sm text-[#212529]">
                  CSV (.csv) - универсальный формат
                </span>
              </label>
            </div>
          </div>

          <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
            <p className="text-sm text-blue-700">
              Отчет будет содержать все дефекты выбранных проектов с указанием проекта для каждого дефекта
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[#dee2e6] text-[#212529]">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim() || selectedProjects.length === 0 || loadingProjects}
            className="bg-[#28a745] hover:bg-[#218838] text-white"
          >
            {loading ? 'Создание...' : 'Создать отчет'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
