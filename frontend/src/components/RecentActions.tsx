"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/button";
import { AllActionsModal } from "./AllActionsModal";

interface ActionItem {
  id: string;
  time: string;
  user: string;
  action: string;
}

interface RecentActionsProps {
  projectId: string;
}

function ActionItem({ action }: {action: ActionItem;}) {
  return (
    <div className="py-1.5 md:py-2 border-b border-[#f8f9fa] last:border-b-0">
      <div className="text-xs text-[#6c757d] mb-1">
        {action.time}
      </div>
      <div className="text-xs md:text-sm text-[#212529] leading-tight">
        <span className="font-medium text-[#007bff]">
          {action.user}
        </span>{" "}
        <span>{action.action}</span>
      </div>
    </div>);

}

export function RecentActions({ projectId }: RecentActionsProps) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAllActionsModal, setShowAllActionsModal] = useState(false);

  useEffect(() => {
    const fetchRecentActions = async () => {
      try {
        const response = await fetch(`/api/dashboard/${projectId}/recent-actions`);
        if (response.ok) {
          const data = await response.json();
          setActions(data);
        }
      } catch (error) {
        console.error('Error fetching recent actions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRecentActions();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex-1">
        <h3 className="text-[16px] md:text-[18px] font-semibold text-[#212529] mb-3 md:mb-4">
          ПОСЛЕДНИЕ ДЕЙСТВИЯ
        </h3>
        <div className="bg-white border border-[#dee2e6] rounded-lg p-3 md:p-4 mb-3 md:mb-4">
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) =>
            <div key={i} className="h-[40px] bg-[#f8f9fa] rounded animate-pulse"></div>
            )}
          </div>
        </div>
      </div>);

  }

  return (
    <div className="flex-1">
      <h3 className="text-[16px] md:text-[18px] font-semibold text-[#212529] mb-3 md:mb-4">
        ПОСЛЕДНИЕ ДЕЙСТВИЯ
      </h3>

      <div className="bg-white border border-[#dee2e6] rounded-lg p-3 md:p-4 mb-3 md:mb-4">
        <div className="space-y-1 md:space-y-2 max-h-[300px] md:max-h-none overflow-y-auto">
          {actions.length > 0 ?
          actions.map((action) =>
          <ActionItem key={action.id} action={action} />
          ) :

          <div className="text-center text-[#6c757d] py-4">
              Нет последних действий
            </div>
          }
        </div>
      </div>

      {actions.length > 0 &&
      <Button
        variant="ghost"
        onClick={() => setShowAllActionsModal(true)}
        className="text-[#007bff] p-0 h-auto text-xs md:text-sm hover:underline">
          Показать все действия
        </Button>
      }

      <AllActionsModal
        isOpen={showAllActionsModal}
        onClose={() => setShowAllActionsModal(false)}
        projectId={projectId}
      />
    </div>);

}