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
      </main>);

  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Navigation
        activeTab="defects"
        projectSelected={!!project}
        projectName={project?.name} />

      
      
      <DefectsList projectId={projectId} />
    </main>);

}