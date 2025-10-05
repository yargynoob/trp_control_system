"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { DefectsList } from '@/components/DefectsList';
import { ProtectedRoute } from '@/components/ProtectedRoute';

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  defectsCount: number;
  teamSize: number;
  lastDefectDate: string | null;
}

export default function DefectsPage() {
  const params = useParams();
  const projectId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [project, setProject] = useState<Project | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`http://localhost:8000/api/v1/organizations/${projectId}`, {
          headers: {
            'Authorization': token ? `Bearer ${token}` : '',
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error('Failed to fetch project:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [projectId]);
  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <Navigation activeTab="defects" projectSelected={false} />
        <div className="p-6 text-center">
          <p className="text-[#6c757d]">Загрузка...</p>
        </div>
      </main>);

  }

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Header />
        <Navigation
          activeTab="defects"
          projectSelected={!!project}
          projectName={project?.name}
        />
        <DefectsList projectId={projectId} />
      </main>
    </ProtectedRoute>
  );
}