"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ProjectSelector } from '@/components/ProjectSelector';
import { Header } from '@/components/Header';
import { Navigation } from '@/components/Navigation';

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

  const handleProjectSelect = (project: Project) => {
    console.log('Выбрано предприятие:', project);
    router.push(`/dashboard/${project.id}`);
  };

  return (
    <main className="min-h-screen bg-white">
      <Header />
      <Navigation activeTab="projects" projectSelected={false} />
      <ProjectSelector onProjectSelect={handleProjectSelect} />
    </main>);

}