"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { Search, Calendar } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { FilterSidebar } from "./FilterSidebar";
import { DefectsTable } from "./DefectsTable";
import { CreateDefectModal } from "./CreateDefectModal";


interface FilterState {
  status: {
    new: boolean;
    in_progress: boolean;
    review: boolean;
    closed: boolean;
    cancelled: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

interface DefectsListProps {
  projectId: string;
  canCreateDefect?: boolean;
  userRole?: string;
}

export function DefectsList({ projectId, canCreateDefect = true, userRole }: DefectsListProps) {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const [filters, setFilters] = useState<FilterState>({
    status: {
      new: true,
      in_progress: true,
      review: true,
      closed: true,
      cancelled: true,
    },
    priority: {
      low: true,
      medium: true,
      high: true,
      critical: true,
    },
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const updateOverdueDefects = async () => {
      try {
        const token = localStorage.getItem('token');
        await fetch('/api/defects/update-overdue', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        console.error('Error updating overdue defects:', error);
      }
    };

    const priority = searchParams.get('priority');
    const status = searchParams.get('status');
    
    updateOverdueDefects();
    
    if (priority === 'critical') {
      setPriorityFilter('critical');
      setFilters(prev => ({
        ...prev,
        priority: {
          low: false,
          medium: false,
          high: false,
          critical: true,
        }
      }));
    }
    
    if (status === 'all') {
      setStatusFilter('all');
      setFilters(prev => ({
        ...prev,
        status: {
          new: true,
          in_progress: true,
          review: true,
          closed: true,
          cancelled: true,
        }
      }));
    }
  }, [searchParams]);


  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  const handleSearch = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-95px)] md:h-[calc(100vh-110px)]">
      {showFilters && (
        <div className="hidden lg:block">
          <FilterSidebar
            filters={filters}
            onFiltersChange={setFilters}
            dateFrom={dateFrom}
            dateTo={dateTo}
            onDateFromChange={setDateFrom}
            onDateToChange={setDateTo}
          />
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <div className="flex items-center justify-between p-3 md:p-6 border-b border-[#dee2e6] bg-white">
          <h1 className="text-[18px] md:text-[24px] font-bold text-[#212529] flex items-center space-x-2">
            <span>Дефекты</span>
          </h1>
          <div className="flex items-center space-x-2">
            <Button
              onClick={() => setShowFilters(!showFilters)}
              variant="outline"
              className="text-[#212529] px-3 md:px-4 py-1.5 md:py-2.5 text-xs md:text-sm"
            >
              {showFilters ? 'Скрыть фильтры' : 'Показать фильтры'}
            </Button>
            {canCreateDefect && (
              <Button
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-[#007bff] hover:bg-[#0056b3] text-white px-3 md:px-5 py-1.5 md:py-2.5 text-xs md:text-sm"
              >
                + Создать дефект
              </Button>
            )}
          </div>
        </div>

        <div className="p-3 md:p-6 bg-[#f8f9fa] border-b border-[#dee2e6] space-y-3 md:space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d] w-4 h-4" />
            <Input
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-9 md:h-10 bg-white border-[#ced4da] text-sm"
            />
          </div>

        </div>

        <div className="flex-1 p-3 md:p-6 bg-white overflow-auto scrollbar-hide">
          <DefectsTable
            projectId={projectId}
            searchQuery={searchQuery}
            statusFilter={statusFilter}
            priorityFilter={priorityFilter}
            dateFrom={dateFrom}
            dateTo={dateTo}
            filters={filters}
            refreshKey={refreshKey}
            canEditDefect={canCreateDefect}
            userRole={userRole}
          />
        </div>
      </div>

      <CreateDefectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        projectId={projectId}
        userRole={userRole}
      />
    </div>
  );
}