"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface ExportReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

export function ExportReportModal({ isOpen, onClose, onSuccess, projectId }: ExportReportModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [format, setFormat] = useState<"csv" | "excel">("excel");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError("Введите название отчета");
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
          project_id: parseInt(projectId),
          title,
          description,
          format
        }),
      });

      if (response.ok) {
        setTitle("");
        setDescription("");
        setFormat("excel");
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
    setError(null);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="w-[500px] max-w-none px-6 py-4">
        <DialogHeader>
          <DialogTitle className="text-[20px] font-semibold text-[#212529]">
            Экспорт отчета
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              ℹ️ Отчет будет содержать все дефекты проекта с текущими данными
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 pt-4 border-t border-[#dee2e6]">
          <Button 
            variant="outline" 
            onClick={handleClose}
            disabled={loading}
          >
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading || !title.trim()}
            className="bg-[#28a745] hover:bg-[#218838] text-white"
          >
            {loading ? 'Создание...' : 'Создать отчет'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
