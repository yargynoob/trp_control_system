"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { useAuth } from "@/contexts/AuthContext";

interface CreateOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
}

interface SelectedUser {
  userId: string;
  role: string;
  userName: string;
}

const roles = [
{ value: 'manager', label: 'Менеджер' },
{ value: 'engineer', label: 'Инженер' },
{ value: 'supervisor', label: 'Руководитель' }];


export function CreateOrganizationModal({ isOpen, onClose, onSuccess }: CreateOrganizationModalProps) {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: ""
  });

  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const isSuperuser = user?.is_superuser || false;

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    let filtered = users.filter((u) =>
      (u.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (u.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    
    if (!isSuperuser && user) {
      filtered = filtered.filter((u) => String(u.id) !== String(user.id));
    }
    
    setFilteredUsers(filtered);
  }, [users, searchQuery, isSuperuser, user]);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users', {
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

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleAddUser = (user: User, role: string) => {
    const isAlreadySelected = selectedUsers.some((su) => String(su.userId) === String(user.id));
    if (isAlreadySelected) {
      console.log('User already selected:', user.id);
      return;
    }

    const newSelectedUser: SelectedUser = {
      userId: user.id,
      role: role,
      userName: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.username
    };

    setSelectedUsers((prev) => [...prev, newSelectedUser]);
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers((prev) => prev.filter((su) => su.userId !== userId));
  };

  const handleRoleChange = (userId: string, newRole: string) => {
    setSelectedUsers((prev) =>
    prev.map((su) =>
    su.userId === userId ? { ...su, role: newRole } : su
    )
    );
  };

  const handleSubmit = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch('http://localhost:8000/api/v1/organizations/', {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          user_roles: selectedUsers
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create organization');
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
      name: "",
      description: "",
      address: ""
    });
    setSelectedUsers([]);
    setSearchQuery("");
    setError(null);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[450px] max-w-none max-h-[85vh] p-0"> 
        

        <div className="p-6 space-y-6">
          {error &&
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          }

          <div className="space-y-6">
            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] uppercase tracking-wide mb-4">
                Создание новой организации
              </h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-[#212529]">
                    Название организации: <span className="text-[#dc3545]">*</span>
                  </Label>
                  <Input
                    id="name"
                    placeholder="Введите название..."
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="text-[#212529] mt-1 bg-white border-[#ced4da]" />

                </div>

                <div>
                  <Label htmlFor="description" className="text-sm font-medium text-[#212529]">
                    Описание:
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Описание деятельности организации..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="text-[#212529] mt-1 h-[100px] bg-white border-[#ced4da] resize-none" />

                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-[#212529]">
                    Адрес:
                  </Label>
                  <Input
                    id="address"
                    placeholder="Адрес организации..."
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="text-[#212529] mt-1 bg-white border-[#ced4da]" />

                </div>

              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-[16px] font-semibold text-[#212529] uppercase tracking-wide mb-4">
                ПОИСК СОТРУДНИКОВ
              </h3>

              <div>
                <Label htmlFor="userSearch" className="text-sm font-medium text-[#212529]">
                  Поиск сотрудников:
                </Label>
                <Input
                  id="userSearch"
                  placeholder="Поиск сотрудника..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="text-[#212529] mt-1 bg-white border-[#ced4da]" />

              </div>

              <div className="border border-[#dee2e6] rounded-md scrollbar-hide" style={{ maxHeight: '200px', overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {filteredUsers.length === 0 &&
                <div className="p-4 text-center text-[#6c757d]">
                    {users.length === 0 ? 'Загрузка пользователей...' : 'Пользователи не найдены'}
                  </div>
                }
                {filteredUsers.map((user) =>
                <div key={user.id} className="flex items-center justify-between p-3 border-b border-[#f8f9fa] last:border-b-0">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-[#212529]">
                        {user.firstName && user.lastName ? `${user.firstName} ${user.lastName}` : user.username}
                      </div>
                      <div className="text-xs text-[#6c757d]">ID: {user.id} • {user.email}</div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleAddUser(user, 'engineer')}
                      disabled={selectedUsers.some((su) => String(su.userId) === String(user.id))}
                      className="text-xs text-[#212529] h-7 px-3">

                        {selectedUsers.some((su) => String(su.userId) === String(user.id)) ? 'Добавлен' : 'Добавить'}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              </div>

              <div className="space-y-4">
                <h3 className="text-[16px] font-semibold text-[#212529] uppercase tracking-wide mb-4">
                  НАЗНАЧЕННЫЕ СОТРУДНИКИ
                </h3>
                
                {selectedUsers.length === 0 ?
              <div className="p-4 text-center text-[#6c757d] border border-[#dee2e6] rounded-md">
                    Пока никто не назначен
                  </div> :

              <div className="border border-[#dee2e6] rounded-md scrollbar-hide" style={{ maxHeight: '200px', overflowY: 'scroll', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                    {selectedUsers.map((selectedUser) =>
                <div key={selectedUser.userId} className="flex items-center justify-between p-3 border-b border-[#f8f9fa] last:border-b-0">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-[#212529]">
                            {selectedUser.userName}
                          </div>
                          <div className="text-xs text-[#6c757d]">
                            ID: {selectedUser.userId} • Роль: {roles.find((r) => r.value === selectedUser.role)?.label}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                      value={selectedUser.role}
                      onChange={(e) => handleRoleChange(selectedUser.userId, e.target.value)}
                      className="text-xs border border-[#ced4da] rounded px-2 py-1 h-7">

                            {roles.map((role) =>
                      <option key={role.value} value={role.value}>
                                {role.label}
                              </option>
                      )}
                          </select>
                          <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveUser(selectedUser.userId)}
                      className="text-[#dc3545] hover:text-[#dc3545] hover:bg-red-50 h-7 w-7 p-0">

                            ×
                          </Button>
                        </div>
                      </div>
                )}  
                  </div>
              }
              </div>
          </div>
        </div>  
        <div className="p-6 border-t border-[#dee2e6]">
          <div className="flex items-center justify-between ">
            <Button variant="outline" onClick={onClose} disabled={loading} className="text-[#212529]">
              Отмена
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.name.trim() || loading}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white">

              {loading ? 'Создание...' : 'Создать организацию'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>);

}