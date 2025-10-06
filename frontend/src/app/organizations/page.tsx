"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectSelector } from '@/components/ProjectSelector';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MultiProjectExportModal } from '@/components/MultiProjectExportModal';
import { Button } from '@/components/ui/button';

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  defectsCount: number;
  teamSize: number;
  lastDefectDate: string | null;
}

export default function OrganizationsPage() {
  const router = useRouter();
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSupervisor, setIsSupervisor] = useState(false);
  const [checkingRole, setCheckingRole] = useState(true);

  useEffect(() => {
    checkSupervisorRole();
  }, []);

  const checkSupervisorRole = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch('/api/users/me/supervisor-projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const projects = await response.json();
        setIsSupervisor(projects.length > 0);
      }
    } catch (error) {
      console.error('Error checking supervisor role:', error);
    } finally {
      setCheckingRole(false);
    }
  };

  const handleProjectSelect = (project: Project) => {
    console.log('Выбрано предприятие:', project);
    router.push(`/dashboard/${project.id}`);
  };

  const handleExportSuccess = () => {
    router.push('/reports');
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Header />
        <Navigation 
          activeTab="projects" 
          projectSelected={false}
          isSupervisorAnywhere={isSupervisor}
        />
        <div className="px-6 py-6">
          <ProjectSelector 
            onProjectSelect={handleProjectSelect}
            isSupervisor={!checkingRole && isSupervisor}
            onExportClick={() => setIsExportModalOpen(true)}
          />
        </div>
        
        {isSupervisor && (
          <MultiProjectExportModal
            isOpen={isExportModalOpen}
            onClose={() => setIsExportModalOpen(false)}
            onSuccess={handleExportSuccess}
          />
        )}
      </main>
    </ProtectedRoute>
  );
}