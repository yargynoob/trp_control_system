"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { CriticalDefects } from '@/components/CriticalDefects';
import { RecentActions } from '@/components/RecentActions';
import { EditOrganizationModal } from '@/components/EditOrganizationModal';
import { MetricCards } from '@/components/MetricCards';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

interface Project {
  id: string;
  name: string;
  description: string;
  defectsCount: number;
  teamSize: number;
  lastDefectDate: string | null;
  address?: string;
  clientName?: string;
  users?: Array<{
    userId: string;
    role: string;
    userName: string;
  }>;
  currentUserRole?: string | null;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  
  const canEditOrganization = user?.is_superuser === true 
    ? true 
    : project?.currentUserRole === 'supervisor';

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/v1/organizations/${params.id}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) {
          if (response.status === 404) {
            setError('Предприятие не найдено');
          } else if (response.status === 403) {
            setError('У вас нет доступа к этому предприятию');
          } else {
            setError('Ошибка загрузки данных предприятия');
          }
          setLoading(false);
          return;
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError('Не удалось подключиться к серверу');
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  const handleEditSuccess = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`http://localhost:8000/api/v1/organizations/${params.id}`, {
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setProject(data);
      } else {
        console.error('Failed to refresh project:', response.statusText);
      }
    } catch (error) {
      console.error('Failed to refresh project:', error);
    }
  };

  const handleDeleteOrganization = async () => {
    if (!project) return;
    setDeleteLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/organizations/${params.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to delete organization');
      }


      router.push('/?message=organization-deleted');
    } catch (err) {
      console.error('Error deleting organization:', err);
      setError(err instanceof Error ? err.message : 'Ошибка удаления организации');
    } finally {
      setDeleteLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-[#6c757d] text-lg">Загрузка...</p>
          </div>
        </div>
      </main>);

  }

  if (error || !project) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-[#212529] mb-4">
              {error || 'Предприятие не найдено'}
            </h1>
            <button
              onClick={() => router.push('/organizations')}
              className="text-[#007bff] hover:text-[#0056b3]">

              ← Вернуться к списку предприятий
            </button>
          </div>
        </div>
      </main>);

  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Header />
      <Navigation
        activeTab="dashboard"
        projectSelected={!!project}
        projectName={project?.name}
        userRole={project?.currentUserRole || undefined} />

      
      <div className="bg-white border-b border-[#dee2e6]">
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-[#dee2e6] bg-white">
          <div>
            <h1 className="text-[18px] md:text-[24px] font-bold text-[#212529] flex items-center space-x-2">
              Панель управления
            </h1>
           
          </div>
          {canEditOrganization && (
            <Button
              onClick={() => setIsEditModalOpen(true)}
              variant="outline"
              className="text-[#007bff] border-[#007bff] hover:bg-[#007bff] hover:text-white"
            >
              Редактировать
            </Button>
          )}
        </div>
      </div>

      <MetricCards projectId={params.id as string} />
      
      <div className="px-3 md:px-6 pb-4 md:pb-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
          <CriticalDefects projectId={params.id as string} />
          <RecentActions projectId={params.id as string} />
        </div>
      </div>

      {canEditOrganization && (
        <div className="px-3 md:px-6 pb-6 border-t border-[#dee2e6] pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Опасная зона
            </h3>
            <p className="text-sm text-red-700 mb-4">
              Удаление организации приведет к безвозвратной потере всех данных, включая дефекты, комментарии и файлы.
            </p>
          
          {!showDeleteConfirm ?
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">

              Удалить организацию
            </button> :

          <div className="space-y-4">
              <div className="p-4 bg-red-100 border border-red-300 rounded-md">
                <p className="text-red-800 font-medium mb-2">
                  Вы уверены, что хотите удалить организацию "{project?.name}"?
                </p>
                <p className="text-sm text-red-700">
                  Это действие нельзя отменить. Все данные будут удалены навсегда.
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                onClick={handleDeleteOrganization}
                disabled={deleteLoading}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">

                  {deleteLoading ? 'Удаление...' : 'Да, удалить'}
                </button>
                <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={deleteLoading}
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors">

                  Отмена
                </button>
              </div>
            </div>
          }
        </div>
      </div>
      )}

      <EditOrganizationModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={handleEditSuccess}
        organization={project ? {
          id: project.id,
          name: project.name,
          description: project.description || "",
          address: project.address || "",
          users: project.users || []
        } : null}
      />
      </main>
    </ProtectedRoute>
  );
}