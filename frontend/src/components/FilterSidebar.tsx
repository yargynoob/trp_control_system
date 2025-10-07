"use client";

import { Calendar } from "lucide-react";
import { Checkbox } from "./ui/checkbox";
import { Button } from "./ui/button";
import { Input } from "./ui/input";

interface FilterState {
  status: {
    open: boolean;
    in_progress: boolean;
    resolved: boolean;
    closed: boolean;
    rejected: boolean;
  };
  priority: {
    low: boolean;
    medium: boolean;
    high: boolean;
    critical: boolean;
  };
}

interface FilterSidebarProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  dateFrom: string;
  dateTo: string;
  onDateFromChange: (date: string) => void;
  onDateToChange: (date: string) => void;
}

export function FilterSidebar({ 
  filters, 
  onFiltersChange, 
  dateFrom, 
  dateTo, 
  onDateFromChange, 
  onDateToChange 
}: FilterSidebarProps) {
  const handleStatusChange = (status: keyof FilterState['status'], checked: boolean) => {
    onFiltersChange({
      ...filters,
      status: {
        ...filters.status,
        [status]: checked,
      },
    });
  };

  const handlePriorityChange = (priority: keyof FilterState['priority'], checked: boolean) => {
    onFiltersChange({
      ...filters,
      priority: {
        ...filters.priority,
        [priority]: checked,
      },
    });
  };

  const clearAllFilters = () => {
    onFiltersChange({
      status: {
        open: false,
        in_progress: false,
        resolved: false,
        closed: false,
        rejected: false,
      },
      priority: {
        low: false,
        medium: false,
        high: false,
        critical: false,
      },
    });
  };

  const selectAllFilters = () => {
    onFiltersChange({
      status: {
        open: true,
        in_progress: true,
        resolved: true,
        closed: true,
        rejected: true,
      },
      priority: {
        low: true,
        medium: true,
        high: true,
        critical: true,
      },
    });
  };

  return (
    <div className="w-[200px] lg:w-[250px] bg-[#f8f9fa] border-r border-[#dee2e6] p-3 lg:p-4 h-full">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-3 lg:mb-4">
        <h3 className="text-xs lg:text-sm font-bold uppercase text-[#212529] tracking-wide mb-2 lg:mb-0">
          ФИЛЬТРЫ
        </h3>
        <div className="flex space-x-1 lg:space-x-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={selectAllFilters}
            className="text-xs h-5 lg:h-6 px-1 lg:px-2 text-[#007bff] hover:text-[#0056b3]"
          >
            Все
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="text-xs h-5 lg:h-6 px-1 lg:px-2 text-[#6c757d] hover:text-[#495057]"
          >
            Сброс
          </Button>
        </div>
      </div>

      <div className="space-y-3 lg:space-y-4">
        <div>
          <h4 className="text-xs lg:text-sm font-medium text-[#212529] mb-2 lg:mb-3">Статус:</h4>
          <div className="space-y-1.5 lg:space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-open"
                checked={filters.status.open}
                onCheckedChange={(checked) => handleStatusChange('open', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
              />
              <label htmlFor="status-open" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Новый
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-in-progress"
                checked={filters.status.in_progress}
                onCheckedChange={(checked) => handleStatusChange('in_progress', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
              />
              <label htmlFor="status-in-progress" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                В работе
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-resolved"
                checked={filters.status.resolved}
                onCheckedChange={(checked) => handleStatusChange('resolved', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
              />
              <label htmlFor="status-resolved" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Решен
              </label>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="status-closed"
                checked={filters.status.closed}
                onCheckedChange={(checked) => handleStatusChange('closed', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]"
              />
              <label htmlFor="status-closed" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Закрыт
              </label>
            </div>

            
          </div>
        </div>

        <div className="pt-3 lg:pt-4 border-t border-[#dee2e6]">
          <h4 className="text-xs lg:text-sm font-medium text-[#212529] mb-2 lg:mb-3">Приоритет:</h4>
          <div className="space-y-1.5 lg:space-y-2">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="priority-critical" 
                checked={filters.priority.critical}
                onCheckedChange={(checked) => handlePriorityChange('critical', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]" 
              />
              <label htmlFor="priority-critical" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Критический
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="priority-high" 
                checked={filters.priority.high}
                onCheckedChange={(checked) => handlePriorityChange('high', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]" 
              />
              <label htmlFor="priority-high" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Высокий
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="priority-medium" 
                checked={filters.priority.medium}
                onCheckedChange={(checked) => handlePriorityChange('medium', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]" 
              />
              <label htmlFor="priority-medium" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Средний
              </label>
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="priority-low" 
                checked={filters.priority.low}
                onCheckedChange={(checked) => handlePriorityChange('low', checked as boolean)}
                className="h-3 w-3 lg:h-4 lg:w-4 data-[state=checked]:bg-[#007bff] data-[state=checked]:text-white border-[#007bff]" 
              />
              <label htmlFor="priority-low" className="text-xs lg:text-sm text-[#212529] cursor-pointer">
                Низкий
              </label>
            </div>
          </div>
        </div>

        <div className="pt-3 lg:pt-4 border-t border-[#dee2e6]">
          <h4 className="text-xs lg:text-sm font-medium text-[#212529] mb-2 lg:mb-3">Период:</h4>
          <div className="space-y-2">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d] w-3 h-3" />
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => onDateFromChange(e.target.value)}
                className="pl-8 w-full h-8 text-xs bg-white"
                placeholder="От"
              />
            </div>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d] w-3 h-3" />
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => onDateToChange(e.target.value)}
                className="pl-8 w-full h-8 text-xs bg-white"
                placeholder="До"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
