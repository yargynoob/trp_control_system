"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";

interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  file: File;
}

interface ExistingFile {
  id: number;
  filename: string;
  original_name: string;
  file_path: string;
  file_size: number;
  content_type: string;
  uploaded_at: string;
}

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

interface EditDefectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  defect: Defect | null;
  userRole?: string;
  projectId?: string;
}

interface Priority {
  id: number;
  name: string;
  display_name: string;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface Comment {
  id: number;
  defect_id: number;
  author_id: number;
  author_name: string;
  content: string;
  created_at: string;
  updated_at: string;
}

export function EditDefectModal({ isOpen, onClose, onSuccess, defect, userRole, projectId }: EditDefectModalProps) {
  const { user } = useAuth();
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [priorityId, setPriorityId] = useState<number | null>(null);
  const [assigneeId, setAssigneeId] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([]);
  const [existingFiles, setExistingFiles] = useState<ExistingFile[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [priorities, setPriorities] = useState<Priority[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  
  const isEngineer = userRole === 'engineer';
  const isManager = userRole === 'manager';
  const isSupervisor = userRole === 'supervisor';
  
  const isDefectClosed = defect?.status === 'closed';
  const isReadOnly = isSupervisor || isDefectClosed;
  
  const canEditDescription = (isEngineer || isManager) && !isDefectClosed;
  const canEditPriority = isManager && !isDefectClosed;
  const canEditAssignee = isManager && !isDefectClosed;
  const canEditDueDate = isManager && !isDefectClosed;
  const canAddFiles = (isEngineer || isManager) && !isDefectClosed;
  const canDeleteFiles = isManager && !isDefectClosed;
  const canComment = (isEngineer || isManager) && !isDefectClosed;
  
  const canEditStatus = (() => {
    if (isDefectClosed || isSupervisor) return false;
    if (defect?.status === 'new' || defect?.status === 'in_progress') {
      return isEngineer || isManager;
    }
    if (defect?.status === 'review') {
      return isManager;
    }
    return false;
  })();
  
  const getAvailableStatuses = () => {
    if (!defect) return [];
    
    const currentStatus = defect.status;
    
    if (currentStatus === 'new') {
      return ['new', 'in_progress'];
    }
    if (currentStatus === 'in_progress') {
      return ['in_progress', 'review'];
    }
    if (currentStatus === 'review' && isManager) {
      return ['review', 'closed'];
    }
    return [currentStatus];
  };
  
  const statusLabels: Record<string, string> = {
    'new': 'Новый',
    'in_progress': 'В работе',
    'review': 'На проверке',
    'closed': 'Закрыт',
    'cancelled': 'Отменен'
  };

  const filteredUsers = users.filter((user) =>
    (user.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  useEffect(() => {
    if (defect && isOpen) {
      setDescription(defect.description || "");
      setDueDate(defect.dueDate || "");
      setStatus(defect.status || "new");
      setSearchQuery("");
      if (defect.assigneeId) {
        setAssigneeId(defect.assigneeId.toString());
      } else {
        setAssigneeId("");
      }
      fetchPriorities();
      fetchUsers();
      fetchExistingFiles();
      fetchComments();
    }
  }, [defect, isOpen]);
  
  const fetchPriorities = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/defects/priorities', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setPriorities(data);
        const currentPriority = data.find((p: Priority) => p.name === defect?.priority);
        if (currentPriority) {
          setPriorityId(currentPriority.id);
        }
      }
    } catch (error) {
      console.error('Error fetching priorities:', error);
    }
  };
  
  const fetchUsers = async () => {
    if (!projectId) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users?project_id=${projectId}&roles=manager,engineer`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };
  
  const fetchExistingFiles = async () => {
    if (!defect) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/files/defect/${defect.id}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setExistingFiles(data);
      }
    } catch (error) {
      console.error('Error fetching files:', error);
    }
  };
  
  const fetchComments = async () => {
    if (!defect) return;
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/defects/${defect.id}/comments`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    }
  };
  
  const handleAddComment = async () => {
    if (!defect || !newComment.trim()) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/defects/${defect.id}/comments`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ content: newComment }),
      });
      
      if (response.ok) {
        setNewComment('');
        await fetchComments();
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Не удалось добавить комментарий');
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      setError('Не удалось добавить комментарий');
    }
  };
  
  const handleDeleteComment = async (commentId: number) => {
    if (!defect || !window.confirm('Вы уверены, что хотите удалить этот комментарий?')) return;
    
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/defects/${defect.id}/comments?commentId=${commentId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      
      if (response.ok || response.status === 204) {
        await fetchComments();
      } else {
        const errorData = await response.json().catch(() => ({ error: 'Failed to delete' }));
        setError(errorData.detail || 'Не удалось удалить комментарий');
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
      setError('Не удалось удалить комментарий');
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    
    files.forEach(file => {
      if (!file.type.startsWith('image/')) {
        setError('Можно загружать только изображения');
        return;
      }
      
      const newFile: AttachedFile = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        size: file.size,
        type: 'image',
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
  
  const handleExistingFileRemove = async (fileId: number) => {
    if (!canDeleteFiles) return;
    
    if (window.confirm('Вы уверены, что хотите удалить этот файл?')) {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/files/${fileId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        
        if (response.ok || response.status === 204) {
          setExistingFiles((prev) => prev.filter((file) => file.id !== fileId));
        } else {
          const errorData = await response.json().catch(() => ({ error: 'Failed to delete file' }));
          setError(errorData.error || 'Не удалось удалить файл');
        }
      } catch (error) {
        console.error('Error deleting file:', error);
        setError('Не удалось удалить файл');
      }
    }
  };

  const uploadFiles = async (defectId: string) => {
    const token = localStorage.getItem('token');
    const uploadPromises = attachedFiles.map(async (attachedFile) => {
      const formData = new FormData();
      formData.append('file', attachedFile.file);
      formData.append('defect_id', defectId);
      formData.append('user_id', user?.id?.toString() || '1');

      try {
        const response = await fetch('/api/defects/upload', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
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
    if (!defect || isReadOnly) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const updateData: any = {};
      
      if (canEditDescription && description !== defect.description) {
        updateData.description = description;
      }
      
      if (canEditPriority && priorityId) {
        updateData.priority_id = priorityId;
      }
      
      if (canEditDueDate && dueDate) {
        updateData.due_date = dueDate;
      }
      
      if (canEditAssignee && assigneeId) {
        updateData.assignee_id = parseInt(assigneeId);
      }
      
      if (canEditStatus && status !== defect.status) {
        updateData.status = status;
      }

      if (Object.keys(updateData).length > 0) {
        const response = await fetch(`/api/defects/${defect.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          },
          body: JSON.stringify(updateData)
        });

        if (!response.ok) {
          throw new Error('Failed to update defect');
        }
      }

      if (attachedFiles.length > 0 && canAddFiles) {
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
          
          {isDefectClosed && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
              <p className="text-sm text-blue-700 font-medium">
                ℹ️ Этот дефект закрыт и больше не может быть изменён. Доступен только просмотр.
              </p>
            </div>
          )}

          <div className="space-y-4">
            {/* Неизменяемая информация */}
            <div className="p-4 bg-[#f8f9fa] border border-[#dee2e6] rounded-md">
              <h4 className="text-sm font-medium text-[#212529] mb-2">Основная информация (не редактируется)</h4>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-[#6c757d]">Название:</span>
                  <div className="font-medium text-[#212529]">{defect.title}</div>
                </div>
                <div>
                  <span className="text-[#6c757d]">Местоположение:</span>
                  <div className="font-medium text-[#212529]">{defect.location || 'Не указано'}</div>
                </div>
                <div>
                  <span className="text-[#6c757d]">Дата нахождения:</span>
                  <div className="font-medium text-[#212529]">
                    {defect.createdAt ? new Date(defect.createdAt).toLocaleDateString('ru-RU') : 'Не указана'}
                  </div>
                </div>
                {/* Дополнительная информация для инженера */}
                {isEngineer && (
                  <>
                    <div>
                      <span className="text-[#6c757d]">Ответственный:</span>
                      <div className="font-medium text-[#212529]">{defect.assignee || 'Не назначен'}</div>
                    </div>
                    <div>
                      <span className="text-[#6c757d]">Срок выполнения:</span>
                      <div className="font-medium text-[#212529]">
                        {defect.dueDate ? new Date(defect.dueDate).toLocaleDateString('ru-RU') : 'Не указан'}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Статус - для всех ролей */}
            <div>
              <Label className="text-sm font-medium text-[#212529]">
                Статус {isDefectClosed && '(дефект закрыт)'}
              </Label>
              {canEditStatus ? (
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="mt-1 w-full h-10 rounded-md border border-[#ced4da] bg-white px-3 py-2 text-sm"
                >
                  {getAvailableStatuses().map((statusOption) => (
                    <option key={statusOption} value={statusOption}>
                      {statusLabels[statusOption]}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mt-1 p-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-md text-sm">
                  {statusLabels[defect.status] || defect.statusDisplay}
                </div>
              )}
            </div>

            {/* Описание - доступно для редактирования инженерам и менеджерам */}
            <div>
              <Label htmlFor="description" className="text-sm font-medium text-[#212529]">
                Описание дефекта {isReadOnly && '(только просмотр)'}
              </Label>
              <Textarea
                id="description"
                placeholder="Подробное описание проблемы и необходимых работ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                disabled={!canEditDescription}
                className="mt-1 h-[120px] bg-white border-[#ced4da] resize-none"
              />
            </div>

            {/* Поля для менеджеров */}
            {(isManager || isSupervisor) && (
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-[#212529] border-b border-[#dee2e6] pb-2">
                  {isSupervisor ? 'Параметры дефекта' : 'Редактируемые параметры'}
                </h4>
                
                {/* Приоритет */}
                <div>
                  <Label className="text-sm font-medium text-[#212529]">Приоритет</Label>
                  {canEditPriority ? (
                    <select
                      value={priorityId || ''}
                      onChange={(e) => setPriorityId(parseInt(e.target.value))}
                      className="mt-1 w-full h-10 rounded-md border border-[#ced4da] bg-white px-3 py-2 text-sm"
                    >
                      {priorities.map((priority) => (
                        <option key={priority.id} value={priority.id}>
                          {priority.display_name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="mt-1 p-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-md text-sm">
                      {defect.priorityDisplay}
                    </div>
                  )}
                </div>

                {/* Ответственный */}
                <div>
                  <Label className="text-sm font-medium text-[#212529]">Ответственный</Label>
                  {canEditAssignee ? (
                    <div className="mt-1 space-y-2">
                      {!assigneeId && (
                        <Input
                          placeholder="Поиск исполнителя..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="bg-white border-[#ced4da]"
                        />
                      )}
                      
                      {assigneeId ? (
                        <div className="p-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-md flex items-center justify-between">
                          <span className="text-sm">
                            {(() => {
                              const selectedUser = users.find((u) => u.id.toString() === assigneeId);
                              return selectedUser?.firstName && selectedUser?.lastName 
                                ? `${selectedUser.firstName} ${selectedUser.lastName}` 
                                : selectedUser?.username || 'Неизвестный пользователь';
                            })()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setAssigneeId('')}
                            className="text-[#212529] hover:text-[#dc3545] h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        </div>
                      ) : (
                        <div 
                          className="border border-[#dee2e6] rounded-md scrollbar-hide" 
                          style={{ maxHeight: '120px', overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                        >
                          {filteredUsers.length === 0 && (
                            <div className="p-2 text-center text-[#6c757d] text-xs">
                              {users.length === 0 ? 'Загрузка пользователей...' : 'Пользователи не найдены'}
                            </div>
                          )}
                          {filteredUsers.slice(0, 5).map((user) => (
                            <div
                              key={user.id}
                              className="flex items-center justify-between p-2 border-b border-[#f8f9fa] last:border-b-0 cursor-pointer hover:bg-[#f8f9fa]"
                              onClick={() => {
                                setAssigneeId(user.id);
                                setSearchQuery('');
                              }}
                            >
                              <div>
                                <div className="text-xs font-medium text-[#212529]">
                                  {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                                </div>
                                <div className="text-xs text-[#6c757d]">{user.email}</div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="mt-1 p-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-md text-sm">
                      {defect.assignee || 'Не назначен'}
                    </div>
                  )}
                </div>

                {/* Срок выполнения */}
                <div>
                  <Label htmlFor="dueDate" className="text-sm font-medium text-[#212529]">Срок выполнения</Label>
                  {canEditDueDate ? (
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                      className="mt-1 bg-white border-[#ced4da]"
                    />
                  ) : (
                    <div className="mt-1 p-2 bg-[#f8f9fa] border border-[#dee2e6] rounded-md text-sm">
                      {defect.dueDate ? new Date(defect.dueDate).toLocaleDateString('ru-RU') : 'Не указан'}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Уже загруженные изображения - для менеджеров и инженеров */}
          {!isSupervisor && existingFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
                ЗАГРУЖЕННЫЕ ИЗОБРАЖЕНИЯ
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingFiles.map((file) => {
                  const token = localStorage.getItem('token');
                  const imageUrl = token 
                    ? `/api/files/download/${file.id}?token=${encodeURIComponent(token)}`
                    : `/api/files/download/${file.id}`;
                  
                  return (
                    <div key={file.id} className="relative group border border-[#dee2e6] rounded-md overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={file.original_name}
                        className="w-full h-40 object-cover"
                      />
                    <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                      <div className="text-xs truncate">{file.original_name}</div>
                      <div className="text-xs text-gray-300">{formatFileSize(file.file_size)}</div>
                    </div>
                    {canDeleteFiles && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleExistingFileRemove(file.id)}
                        className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        ×
                      </Button>
                    )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Вложения - доступно для добавления инженерам и менеджерам */}
          {canAddFiles && (
            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
                ДОБАВИТЬ ВЛОЖЕНИЯ (только изображения)
              </h3>
              
              <div className="border-2 border-dashed border-[#dee2e6] rounded-lg p-6 text-center hover:border-[#007bff] transition-colors">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload"
                />
                <label htmlFor="file-upload" className="cursor-pointer">
                  <div className="w-8 h-8 text-[#6c757d] mx-auto mb-2">🖼️</div>
                  <p className="text-[#6c757d]">
                    Нажмите для выбора изображений или перетащите их сюда
                  </p>
                  <p className="text-xs text-[#6c757d] mt-1">
                    Поддерживаемые форматы: JPG, PNG, GIF, WEBP
                  </p>
                </label>
              </div>

              {attachedFiles.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {attachedFiles.map((file) => (
                    <div key={file.id} className="relative group border border-[#dee2e6] rounded-md overflow-hidden">
                      <img
                        src={URL.createObjectURL(file.file)}
                        alt={file.name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                        <div className="text-xs truncate">{file.name}</div>
                        <div className="text-xs text-gray-300">{formatFileSize(file.size)}</div>
                      </div>
                      {canDeleteFiles && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleFileRemove(file.id)}
                          className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          ×
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
          
          {/* Просмотр вложений для руководителя */}
          {isSupervisor && existingFiles.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
                ЗАГРУЖЕННЫЕ ИЗОБРАЖЕНИЯ (только просмотр)
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {existingFiles.map((file) => {
                  const token = localStorage.getItem('token');
                  const imageUrl = token 
                    ? `/api/files/download/${file.id}?token=${encodeURIComponent(token)}`
                    : `/api/files/download/${file.id}`;
                  
                  return (
                    <div key={file.id} className="relative border border-[#dee2e6] rounded-md overflow-hidden">
                      <img
                        src={imageUrl}
                        alt={file.original_name}
                        className="w-full h-40 object-cover"
                      />
                      <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-70 text-white p-2">
                        <div className="text-xs truncate">{file.original_name}</div>
                        <div className="text-xs text-gray-300">{formatFileSize(file.file_size)}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Комментарии - для всех ролей */}
          <div className="space-y-4">
            <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
              КОММЕНТАРИИ
            </h3>
            
            {/* Список комментариев */}
            {comments.length > 0 ? (
              <div className="space-y-3 max-h-[300px] overflow-y-auto">
                {comments.map((comment) => {
                  const canDeleteComment = !isSupervisor && (isManager || (isEngineer && comment.author_id === user?.id));
                  
                  return (
                    <div key={comment.id} className="p-3 bg-white border border-[#dee2e6] rounded-md group relative">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <div className="w-8 h-8 bg-[#007bff] rounded-full flex items-center justify-center text-white text-sm font-medium">
                            {comment.author_name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="text-sm font-medium text-[#212529]">{comment.author_name}</div>
                            <div className="text-xs text-[#6c757d]">
                              {new Date(comment.created_at).toLocaleString('ru-RU', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </div>
                          </div>
                        </div>
                        {canDeleteComment && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6 p-0"
                          >
                            ×
                          </Button>
                        )}
                      </div>
                      <p className="text-sm text-[#212529] whitespace-pre-wrap">{comment.content}</p>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 text-center text-[#6c757d] border border-[#dee2e6] rounded-md">
                Комментариев пока нет
              </div>
            )}
            
            {/* Добавить комментарий - только для инженеров и менеджеров */}
            {canComment && (
              <div className="space-y-2">
                <Label htmlFor="newComment" className="text-sm font-medium text-[#212529]">
                  Добавить комментарий
                </Label>
                <Textarea
                  id="newComment"
                  placeholder="Введите ваш комментарий..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  className="mt-1 h-[80px] bg-white border-[#ced4da] resize-none"
                />
                <div className="flex justify-end">
                  <Button
                    onClick={handleAddComment}
                    disabled={!newComment.trim() || loading}
                    className="bg-[#007bff] hover:bg-[#0056b3] text-white"
                    size="sm"
                  >
                    Отправить комментарий
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-[#dee2e6]">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            {isReadOnly ? 'Закрыть' : 'Отмена'}
          </Button>
          {!isReadOnly && (
            <Button
              onClick={handleSubmit}
              disabled={loading}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white"
            >
              {loading ? 'Сохранение...' : 'Сохранить изменения'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
