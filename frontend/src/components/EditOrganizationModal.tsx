"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  username: string;
  email: string;
}

interface SelectedUser {
  userId: string;
  role: string;
  userName: string;
}

interface Organization {
  id: string;
  name: string;
  description: string;
  address: string;
  users: SelectedUser[];
}

interface EditOrganizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  organization: Organization | null;
}

const roles = [
  { value: 'manager', label: 'Менеджер' },
  { value: 'engineer', label: 'Инженер' },
  { value: 'supervisor', label: 'Руководитель' }
];

export function EditOrganizationModal({ isOpen, onClose, onSuccess, organization }: EditOrganizationModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    address: ""
  });
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<SelectedUser[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (organization && isOpen) {
      setFormData({
        name: organization.name,
        description: organization.description || "",
        address: organization.address || ""
      });
      setSelectedUsers(organization.users || []);
      setSearchQuery("");
      setError(null);
    }
  }, [organization, isOpen]);

  useEffect(() => {
    if (isOpen) {
      fetchUsers();
    }
  }, [isOpen]);

  useEffect(() => {
    const filtered = users.filter((user) =>
      (user.firstName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.lastName || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
      (user.username || '').toLowerCase().includes(searchQuery.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [users, searchQuery]);

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
    if (!organization) return;

    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/organizations/${organization.id}`, {
        method: 'PUT',
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
        throw new Error('Failed to update organization');
      }

      onSuccess();
      handleClose();
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

  const handleClose = () => {
    resetForm();
    onClose();
  };

  if (!organization) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !loading && handleClose()}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <div className="p-6 space-y-6">
          {error &&
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          }

          <div className="space-y-6">
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name" className="text-sm font-medium text-[#212529]">
                    Название организации *
                  </Label>
                  <Input
                    id="name"
                    placeholder="Введите название..."
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="mt-1 bg-white border-[#ced4da]"
                  />
                </div>

                <div>
                  <Label htmlFor="address" className="text-sm font-medium text-[#212529]">
                    Адрес
                  </Label>
                  <Input
                    id="address"
                    placeholder="Адрес организации..."
                    value={formData.address}
                    onChange={(e) => handleInputChange('address', e.target.value)}
                    className="mt-1 bg-white border-[#ced4da]"
                  />
                </div>

                <div className="md:col-span-2">
                  <Label htmlFor="description" className="text-sm font-medium text-[#212529]">
                    Описание
                  </Label>
                  <Textarea
                    id="description"
                    placeholder="Описание деятельности организации..."
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    className="mt-1 h-[100px] bg-white border-[#ced4da] resize-none"
                  />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
                  ДОБАВИТЬ СОТРУДНИКОВ
                </h3>

                <div>
                  <Label htmlFor="userSearch" className="text-sm font-medium text-[#212529]">
                    Поиск сотрудников
                  </Label>
                  <Input
                    id="userSearch"
                    placeholder="Поиск сотрудника..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="mt-1 bg-white border-[#ced4da]"
                  />
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
                        <div className="text-xs text-[#6c757d]">{user.email}</div>
                      </div>
                      <div className="text-[#212529] flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleAddUser(user, 'engineer')}
                          disabled={selectedUsers.some((su) => String(su.userId) === String(user.id))}
                          className="text-xs h-7 px-3"
                        >
                          {selectedUsers.some((su) => String(su.userId) === String(user.id)) ? 'Добавлен' : 'Добавить'}
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-[16px] font-semibold text-[#212529] border-b border-[#dee2e6] pb-2">
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
                          <div className="mx-2 text-sm font-medium text-[#212529]">
                            {selectedUser.userName}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <select
                            value={selectedUser.role}
                            onChange={(e) => handleRoleChange(selectedUser.userId, e.target.value)}
                            className="text-xs border border-[#ced4da] rounded px-2 py-1 h-7"
                          >
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
                            className="text-[#dc3545] hover:text-[#dc3545] hover:bg-red-50 h-7 w-7 p-0"
                          >
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
        </div>

        <div className="text-[#212529] flex justify-end space-x-3 p-6 border-t border-[#dee2e6]">
          <Button variant="outline" onClick={handleClose} disabled={loading}>
            Отмена
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={!formData.name.trim() || loading}
            className="bg-[#007bff] hover:bg-[#0056b3] text-white"
          >
            {loading ? 'Сохранение...' : 'Сохранить изменения'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}