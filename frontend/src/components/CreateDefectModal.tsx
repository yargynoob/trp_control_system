"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";

interface CreateDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  projectId: string;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface AttachedFile {
  id: string;
  name: string;
  size: string;
  type: 'image' | 'document';
  file: File;
}

const priorities = [
{ value: 'low', label: 'Низкий' },
{ value: 'medium', label: 'Средний' },
{ value: 'high', label: 'Высокий' },
{ value: 'critical', label: 'Критический' }];


const severities = [
{ value: 'minor', label: 'Незначительный' },
{ value: 'major', label: 'Значительный' },
{ value: 'critical', label: 'Критический' },
{ value: 'blocker', label: 'Блокирующий' }];


const defectTypes = [
{ value: 'defect', label: 'Дефект' },
{ value: 'malfunction', label: 'Неисправность' },
{ value: 'wear', label: 'Износ' },
{ value: 'damage', label: 'Повреждение' },
{ value: 'leak', label: 'Утечка' },
{ value: 'crack', label: 'Трещина' },
{ value: 'corrosion', label: 'Коррозия' },
{ value: 'other', label: 'Другое' }];


export function CreateDefectModal({ isOpen, onClose, onSuccess, projectId }: CreateDefectModalProps) {
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    location: "",
    defectType: "defect",
    priority: "medium",
    assigneeId: "",
    deadline: ""
  });

  const [users, setUsers] = useState<User[]>([]);
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const filteredUsers = users.filter((user) =>
  user.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
  user.username.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files) return;

    Array.from(files).forEach((file) => {
      const fileType = file.type.startsWith('image/') ? 'image' : 'document';
      const newFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: formatFileSize(file.size),
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
    if (attachedFiles.length === 0) return;

    for (const attachedFile of attachedFiles) {
      const formData = new FormData();
      formData.append('file', attachedFile.file);
      formData.append('defectId', defectId);

      try {
        const response = await fetch('/api/defects/upload', {
          method: 'POST',
          body: formData
        });

        if (!response.ok) {
          console.error('Failed to upload file:', attachedFile.name);
        }
      } catch (error) {
        console.error('Error uploading file:', error);
      }
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      if (!formData.title.trim()) {
        throw new Error('Название дефекта обязательно');
      }

      const response = await fetch('/api/defects', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          projectId: parseInt(projectId),
          assigneeId: formData.assigneeId ? parseInt(formData.assigneeId) : null,
          deadline: formData.deadline || null
        })
      });

      if (!response.ok) {
        throw new Error('Failed to create defect');
      }

      const result = await response.json();

      if (attachedFiles.length > 0) {
        await uploadFiles(result.id.toString());
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
    setFormData({
      title: "",
      description: "",
      location: "",
      defectType: "defect",
      priority: "medium",
      assigneeId: "",
      deadline: ""
    });
    setAttachedFiles([]);
    setError(null);
  };

  const getFileIcon = (type: string) => {
    return type === 'image' ? '' : '';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md w-full max-h-[85vh] p-0">
        <div className="p-6 border-b border-[#dee2e6]">
          <DialogHeader>
            <DialogTitle className="text-[20px] font-semibold text-[#212529]">
              Создание нового дефекта
            </DialogTitle>
            <DialogDescription className="text-[#6c757d] text-sm">
              Заполните информацию о новом дефекте для добавления в систему управления
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="p-6 space-y-6">
          {error &&
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          }

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] uppercase tracking-wide mb-4">
                ОСНОВНАЯ ИНФОРМАЦИЯ
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title" className="text-sm font-medium text-[#212529]">
                    Заголовок: <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Input
                    id="title"
                    placeholder="Краткое описание дефекта..."
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    className="mt-1 bg-white border-[#ced4da]" />

                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-[#212529]">
                    Описание: <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Подробное описание проблемы и необходимых работ..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 h-[120px] bg-white border-[#ced4da] resize-none" />

                </div>

                <div>
                  <Label htmlFor="location" className="text-sm font-medium text-[#212529]">
                    Местоположение:
                  </Label>
                  <Input
                    id="location"
                    placeholder="Корпус 2, этаж 5, кв. 54..."
                    value={formData.location}
                    onChange={(e) => handleInputChange('location', e.target.value)}
                    className="mt-1 bg-white border-[#ced4da]" />

                </div>

                <div>
                  <Label htmlFor="deadline" className="text-sm font-medium text-[#212529]">Срок:</Label>
                  <Input
                    id="deadline"
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => handleInputChange('deadline', e.target.value)}
                    className="mt-1 bg-white border-[#ced4da]" />

                </div>

              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] uppercase tracking-wide mb-4">
                НАЗНАЧЕНИЕ И ПРИОРИТЕТ
              </h3>
              
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium text-[#212529]">Приоритет: <span className="text-[#dc3545]">*</span></Label>
                  <select
                    value={formData.priority}
                    onChange={(e) => handleInputChange('priority', e.target.value)}
                    className="mt-1 w-full h-10 rounded-md border border-[#ced4da] bg-white px-3 py-2 text-sm">

                    {priorities.map((priority) =>
                    <option key={priority.value} value={priority.value}>
                        {priority.label}
                      </option>
                    )}
                  </select>
                </div>


                <div>
                  <Label className="text-sm font-medium text-[#212529]">Исполнитель:</Label>
                  <div className="mt-1 space-y-2">
                    {!formData.assigneeId &&
                    <Input
                      placeholder="Поиск исполнителя..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="bg-white border-[#ced4da]" />

                    }
                    
                    {formData.assigneeId ?
                    <div className="p-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-md flex items-center justify-between">
                        <span className="text-sm">
                          {users.find((u) => u.id === formData.assigneeId)?.firstName} {users.find((u) => u.id === formData.assigneeId)?.lastName}
                        </span>
                        <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleInputChange('assigneeId', '')}
                        className="text-[#dc3545] hover:text-[#dc3545] h-6 w-6 p-0">

                          ×
                        </Button>
                      </div> :

                    <div className="border border-[#dee2e6] rounded-md scrollbar-hide" style={{ maxHeight: '120px', overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                        {filteredUsers.length === 0 &&
                      <div className="p-2 text-center text-[#6c757d] text-xs">
                            {users.length === 0 ? 'Загрузка пользователей...' : 'Пользователи не найдены'}
                          </div>
                      }
                        {filteredUsers.slice(0, 5).map((user) =>
                      <div
                        key={user.id}
                        className="flex items-center justify-between p-2 border-b border-[#f8f9fa] last:border-b-0 cursor-pointer hover:bg-[#f8f9fa]"
                        onClick={() => {
                          handleInputChange('assigneeId', user.id);
                          setSearchQuery('');
                        }}>

                            <div>
                              <div className="text-xs font-medium text-[#212529]">
                                {user.firstName} {user.lastName}
                              </div>
                              <div className="text-xs text-[#6c757d]">{user.email}</div>
                            </div>
                          </div>
                      )}
                      </div>
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-[16px] font-semibold text-[#212529] uppercase tracking-wide mb-4">
              ВЛОЖЕНИЯ
            </h3>

            <div className="border-2 border-dashed border-[#dee2e6] rounded-lg p-8 text-center bg-[#f8f9fa] hover:bg-[#e9ecef] transition-colors">
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload" />

              <label htmlFor="file-upload" className="cursor-pointer">
                <div className="w-8 h-8 text-[#6c757d] mx-auto mb-2">📎</div>
                <p className="text-[#6c757d]">
                  Перетащите файлы сюда или нажмите для выбора
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
                        <span className="text-sm font-medium text-[#212529]">{file.name}</span>
                        <span className="text-xs text-[#6c757d] ml-2">({file.size})</span>
                      </div>
                    </div>
                    <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleFileRemove(file.id)}
                  className="text-[#dc3545] hover:text-[#dc3545] hover:bg-red-50">

                      ×
                    </Button>
                  </div>
              )}
              </div>
            }
          </div>
        </div>

        <div className="p-6 border-t border-[#dee2e6]">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={onClose} disabled={loading}>
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title.trim() || loading}
              className="bg-[#007bff] hover:bg-[#0056b3]">

              {loading ? 'Создание...' : 'Создать дефект'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}