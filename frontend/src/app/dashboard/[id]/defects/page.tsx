"use client";

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';
import { DefectsList } from '@/components/DefectsList';

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
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/organizations/${projectId}`);
        if (response.ok) {
          const data = await response.json();
          setProject(data);
        }
      } catch (error) {
        console.error('Error fetching project:', error);
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
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Navigation 
        activeTab="defects" 
        projectSelected={!!project} 
        projectName={project?.name}
      />
      
      <div className="p-3 md:p-6 border-b border-[#dee2e6] bg-white">
        <h1 className="text-[18px] md:text-[24px] font-bold text-[#212529]">
          Дефекты
        </h1>
        {project && (
          <p className="text-sm text-[#6c757d] mt-1">
            {project.name}
          </p>
        )}
      </div>

      <DefectsList projectId={projectId} />
    </main>
  );
}
