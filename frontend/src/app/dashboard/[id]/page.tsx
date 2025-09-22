"use client";

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/Header';
import { MetricCards } from '@/components/MetricCards';
import { CriticalDefects } from '@/components/CriticalDefects';
import { RecentActions } from '@/components/RecentActions';

interface Project {
  id: string;
  name: string;
  description: string;
  status: "active" | "planning" | "completed";
  defectsCount: number;
  teamSize: number;
  lastDefectDate: string | null;
  address?: string;
  clientName?: string;
}

export default function DashboardPage() {
  const params = useParams();
  const router = useRouter();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await fetch(`/api/organizations/${params.id}`);
        if (!response.ok) {
          if (response.status === 404) {
            setError('Предприятие не найдено');
          } else {
            throw new Error('Failed to fetch organization');
          }
          return;
        }
        const data = await response.json();
        setProject(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
        console.error('Error fetching project:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchProject();
  }, [params.id]);

  if (loading) {
    return (
      <main className="min-h-screen bg-white">
        <Header />
        <div className="container mx-auto px-4 py-8">
          <div className="text-center">
            <p className="text-[#6c757d] text-lg">Загрузка...</p>
          </div>
        </div>
      </main>
    );
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
              className="text-[#007bff] hover:text-[#0056b3]"
            >
              ← Вернуться к списку предприятий
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-white">
      <Header />
      
      <div className="bg-white border-b border-[#dee2e6] px-4 py-3">
        <div className="flex items-center justify-between">
          <div>
            <button 
              onClick={() => router.push('/organizations')}
              className="text-[#007bff] hover:text-[#0056b3] mb-2 text-sm"
            >
              ← Назад к предприятиям
            </button>
            <h1 className="text-xl font-bold text-[#212529]">
              {project.name}
            </h1>
            <p className="text-sm text-[#6c757d]">
              {project.description}
            </p>
          </div>
        </div>
      </div>

      <MetricCards projectId={params.id as string} />
      
      <div className="px-3 md:px-6 pb-4 md:pb-6">
        <div className="flex flex-col lg:flex-row space-y-4 lg:space-y-0 lg:space-x-6">
          <CriticalDefects projectId={params.id as string} />
          <RecentActions projectId={params.id as string} />
        </div>
      </div>
    </main>
  );
}
