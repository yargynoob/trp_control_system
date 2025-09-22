"use client";

import { useState, useEffect } from "react";
import { Input } from "./ui/input";
import { DefectsTable } from "./DefectsTable";

interface DefectsListProps {
  projectId: string;
}

export function DefectsList({ projectId }: DefectsListProps) {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div className="flex flex-col h-[calc(100vh-140px)]">
      <div className="flex-1 flex flex-col min-w-0">
        <div className="p-3 md:p-6 bg-[#f8f9fa] border-b border-[#dee2e6]">
          <div className="relative max-w-md">
            <Input
              placeholder="Поиск по названию или описанию..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-white border-[#ced4da] text-sm"
            />
          </div>
        </div>

        <div className="flex-1 p-3 md:p-6 bg-white overflow-auto">
          <DefectsTable
            projectId={projectId}
            searchQuery={searchQuery}
          />
        </div>
      </div>
    </div>
  );
}
