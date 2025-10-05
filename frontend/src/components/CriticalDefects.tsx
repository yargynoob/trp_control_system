"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "./ui/card";
import { Button } from "./ui/button";

interface DefectItem {
  id: string;
  title: string;
  location: string;
  assignee: string;
  overdueDays: number;
}

interface CriticalDefectsProps {
  projectId: string;
}

function DefectCard({ defect }: {defect: DefectItem;}) {
  return (
    <Card className="p-3 md:p-4 bg-white border border-[#dee2e6] rounded-lg shadow-sm mb-3">
      <div className="flex items-start space-x-2 md:space-x-3">
        <div className="w-2.5 h-2.5 md:w-3 md:h-3 bg-[#dc3545] rounded-full mt-1 flex-shrink-0"></div>
        <div className="flex-1 space-y-1.5 md:space-y-2 min-w-0">
          <div>
            <div className="text-xs text-[#6c757d] font-medium">{defect.id}</div>
            <h4 className="text-sm font-medium text-[#212529] leading-tight">{defect.title}</h4>
          </div>
          
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-xs text-[#6c757d]">
              <span className="truncate">{defect.location}</span>
            </div>
            
            <div className="flex items-center space-x-2 text-xs text-[#6c757d]">
              <span className="truncate">{defect.assignee}</span>
            </div>
            
            {defect.overdueDays > 0 &&
            <div className="flex items-center space-x-2 text-xs text-[#dc3545]">
                <span>Просрочено на {defect.overdueDays} дн.</span>
              </div>
            }
          </div>
        </div>
      </div>
    </Card>);

}

export function CriticalDefects({ projectId }: CriticalDefectsProps) {
  const [defects, setDefects] = useState<DefectItem[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const handleShowAllCritical = () => {
    const searchParams = new URLSearchParams({
      priority: 'critical',
      status: 'all'
    });
    router.push(`/dashboard/${projectId}/defects?${searchParams.toString()}`);
  };

  useEffect(() => {
    const fetchCriticalDefects = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await fetch(`/api/dashboard/${projectId}/critical-defects`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
        if (response.ok) {
          const data = await response.json();
          setDefects(data);
        }
      } catch (error) {
        console.error('Error fetching critical defects:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCriticalDefects();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex-1">
        <h3 className="text-[16px] md:text-[18px] font-semibold text-[#212529] mb-3 md:mb-4">
          КРИТИЧЕСКИЕ ДЕФЕКТЫ
        </h3>
        <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
          {[1, 2, 3].map((i) =>
          <div key={i} className="h-[100px] bg-[#f8f9fa] rounded-lg animate-pulse"></div>
          )}
        </div>
      </div>);

  }

  return (
    <div className="flex-1">
      <h3 className="text-[16px] md:text-[18px] font-semibold text-[#212529] mb-3 md:mb-4">
        КРИТИЧЕСКИЕ ДЕФЕКТЫ
      </h3>
      
      <div className="space-y-2 md:space-y-3 mb-3 md:mb-4">
        {defects.length > 0 ?
        defects.map((defect) =>
        <DefectCard key={defect.id} defect={defect} />
        ) :

        <Card className="p-4 text-center text-[#6c757d]">
            Критических дефектов не найдено
          </Card>
        }
      </div>
      
      {defects.length > 0 &&
      <Button 
        variant="ghost" 
        onClick={handleShowAllCritical}
        className="text-[#007bff] p-0 h-auto text-xs md:text-sm hover:underline">
          Показать все критические
        </Button>
      }
    </div>);

}