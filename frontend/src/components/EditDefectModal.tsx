"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface Defect {
  id: string;
  title: string;
  description: string;
  location: string;
  assignee: string;
  priority: string;
  status: string;
}

interface EditDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defect: Defect | null;
}

export function EditDefectModal({ isOpen, onClose, onSuccess, defect }: EditDefectModalProps) {
  const [description, setDescription] = useState("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (defect && isOpen) {
      setDescription(defect.description || "");
    }
  }, [defect, isOpen]);

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      const newFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: fileType,
        file: file
      };
      setAttachedFiles((prev) => [...prev, newFile]);
    });

    event.target.value = '';
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleFileRemove = (fileId: string) => {
    setAttachedFiles((prev) => prev.filter((file) => file.id !== fileId));
  };

  const uploadFiles = async (defectId: string) => {
    const uploadPromises = attachedFiles.map(async (attachedFile) => {
      const formData = new FormData();
      formData.append('file', attachedFile.file);
      formData.append('defectId', defectId);

      try {
        const response = await fetch('/api/defects/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${attachedFile.name}`);
        }

        return await response.json();
      } catch (error) {
        console.error(`Error uploading ${attachedFile.name}:`, error);
        throw error;
      }
    });

    await Promise.all(uploadPromises);
  };

  const handleSubmit = async () => {
    if (!defect) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/defects/${defect.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          description: description
        })
      });

      if (!response.ok) {
        throw new Error('Failed to update defect');
      }

      if (attachedFiles.length > 0) {
        await uploadFiles(defect.id);
      }

      onSuccess();
      onClose();
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setDescription("");
    setAttachedFiles([]);
    setError(null);
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const getFileIcon = (type: string) => {
    return type === 'image' ? '' : '';
  };

  if (!defect) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => !loading && handleClose()}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        
        <div className="p-6 space-y-6">
          {error &&
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          }

          <div className="space-y-4">
            <div className="p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded-md">
              <h4 className="text-sm font-medium text-[#212529] mb-2">Информация о дефекте</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#6c757d]">Название:</span>
                  <div className="font-medium text-[#212529]">{defect.title}</div>
                </div>
                <div>
                  <span className="text-[#6c757d]">Приоритет:</span>
                  <div className="font-medium text-[#212529]">{defect.priority}</div>
                </div>
                <div>
                  <span className="text-[#6c757d]">Местоположение:</span>
                  <div className="font-medium text-[#212529]">{defect.location}</div>
                </div>
                <div>
                  <span className="text-[#6c757d]">Ответственный:</span>
                  <div className="font-medium text-[#212529]">{defect.assignee}</div>
                </div>
              </div>
            </div>

            <div>
              <Label htmlFor="description" className="text-sm font-medium text-[#212529]">
                Описание дефекта
              </Label>
              <Textarea
                id="description"
                placeholder="Подробное описание проблемы и необходимых работ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="mt-1 h-[120px] bg-white border-[#ced4da] resize-none"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
              ДОБАВИТЬ ВЛОЖЕНИЯ
            </h3>
            
            <div className="border-2 border-dashed border-[#dee2e6] rounded-lg p-6 text-center hover:border-[#007bff] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-8 h-8 text-[#6c757d] mx-auto mb-2">📎</div>
                <p className="text-[#6c757d]">
                  Нажмите для выбора файлов или перетащите их сюда
                </p>
              </label>
            </div>

            {attachedFiles.length > 0 &&
              <div className="space-y-2">
                {attachedFiles.map((file) =>
                  <div key={file.id} className="flex items-center justify-between p-3 bg-white border border-[#dee2e6] rounded-md">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">{getFileIcon(file.type)}</span>
                      <div>
                        <div className="text-sm font-medium text-[#212529]">{file.name}</div>
                        <div className="text-xs text-[#6c757d]">{formatFileSize(file.size)}</div>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleFileRemove(file.id)}
                      className="text-[#dc3545] hover:text-[#dc3545] hover:bg-red-50"
                    >
                      ×
                    </Button>
                  </div>
                )}
              </div>
            }
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-[#dee2e6]">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="bg-[#007bff] hover:bg-[#0056b3]"
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
