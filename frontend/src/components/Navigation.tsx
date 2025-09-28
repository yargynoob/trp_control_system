"use client";

import { useRouter, useParams } from 'next/navigation';

interface NavigationProps {
  activeTab: string;
  projectSelected?: boolean;
  projectName?: string;
}

export function Navigation({ activeTab, projectSelected = false, projectName }: NavigationProps) {
  const router = useRouter();
  const params = useParams();
  const projectId = params?.id as string;

  const tabs = [
  { id: 'projects', label: 'Проекты', path: '/organizations' },
  { id: 'dashboard', label: 'Дашборд', path: `/dashboard/${projectId}`, requiresProject: true },
  { id: 'defects', label: 'Дефекты', path: `/dashboard/${projectId}/defects`, requiresProject: true },
  { id: 'reports', label: 'Отчеты', path: `/dashboard/${projectId}/reports`, requiresProject: true }];


  const handleTabClick = (tab: any) => {
    if (tab.requiresProject && !projectSelected) {
      return;
    }
    router.push(tab.path);
  };

  return (
    <nav className="bg-white border-b border-[#dee2e6]">
      <div className="px-4">
        <div className="flex items-center space-x-1">
          {tabs.map((tab) => {
            const isDisabled = tab.requiresProject && !projectSelected;
            const isActive = activeTab === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleTabClick(tab)}
                disabled={isDisabled}
                className={`
                  px-4 py-3 text-sm font-medium border-b-2 transition-colors
                  ${isActive ?
                'text-[#007bff] border-[#007bff]' :
                isDisabled ?
                'text-[#6c757d] border-transparent cursor-not-allowed opacity-50' :
                'text-[#6c757d] border-transparent hover:text-[#007bff] hover:border-[#dee2e6]'}
                `
                }>

                {tab.label}
              </button>);

          })}
        </div>
        
        {projectSelected && projectName &&
        <div className="py-2 text-xs text-[#6c757d]">
            Проект: <span className="font-medium text-[#212529]">{projectName}</span>
          </div>
        }
      </div>
    </nav>);

}