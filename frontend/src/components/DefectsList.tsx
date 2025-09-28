"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import { DefectsTable } from "./DefectsTable";
import { CreateDefectModal } from "./CreateDefectModal";

interface DefectsListProps {
  projectId: string;
}

export function DefectsList({ projectId }: DefectsListProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleCreateSuccess = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 md:p-6 bg-[#f8f9fa] border-b border-[#dee2e6]">
          <div className="flex items-center justify-between">
            <div className="relative max-w-md">
              <Input
                placeholder="Поиск дефектов..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white border-[#ced4da] text-sm" />

            </div>
            <Button
              onClick={() => setIsCreateModalOpen(true)}
              className="bg-[#007bff] hover:bg-[#0056b3] text-white">

              + Добавить дефект
            </Button>
          </div>
        </div>

        <div className="flex-1 p-3 md:p-6 bg-white overflow-auto">
          <DefectsTable
            projectId={projectId}
            searchQuery={searchQuery}
            refreshKey={refreshKey} />

        </div>
      </div>

      <CreateDefectModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSuccess={handleCreateSuccess}
        projectId={projectId} />

    </div>);

}