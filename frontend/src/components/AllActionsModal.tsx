"use client";

import { useState, useEffect } from "react";
import { Search } from "lucide-react";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface ActionItem {
  id: string;
  time: string;
  user: string;
  action: string;
  defectId: string;
  defectTitle: string;
}

interface AllActionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
}

export function AllActionsModal({ isOpen, onClose, projectId }: AllActionsModalProps) {
  const [actions, setActions] = useState<ActionItem[]>([]);
  const [filteredActions, setFilteredActions] = useState<ActionItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (isOpen) {
      fetchAllActions();
    }
  }, [isOpen, projectId]);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredActions(actions);
    } else {
      const filtered = actions.filter(action => 
        action.user.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        action.defectTitle?.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredActions(filtered);
    }
  }, [searchQuery, actions]);

  const fetchAllActions = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/dashboard/${projectId}/all-actions`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (response.ok) {
        const data = await response.json();
        setActions(data);
        setFilteredActions(data);
      }
    } catch (error) {
      console.error('Error fetching all actions:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[450px] max-w-none max-h-[80vh] overflow-hidden px-4 py-3 ">
        
        
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-[#6c757d] w-4 h-4" />
          <Input
            placeholder="Поиск по пользователю, действию или дефекту..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 h-10 bg-white border-[#ced4da] text-sm"
          />
        </div>
        
        <div className="flex-1 overflow-auto scrollbar-hide">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-16 bg-[#f8f9fa] rounded animate-pulse"></div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {filteredActions.length > 0 ? (
                filteredActions.map((action) => (
                  <div key={action.id} className="p-4 bg-white border border-[#dee2e6] rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="text-xs text-[#6c757d] mb-1">
                          {action.time}
                        </div>
                        <div className="text-sm text-[#212529] mb-2">
                          <span className="font-medium text-[#007bff]">
                            {action.user}
                          </span>{" "}
                          <span>{action.action}</span>
                        </div>
                        {action.defectTitle && (
                          <div className="text-xs text-[#6c757d]">
                            Дефект: <span className="font-medium">{action.defectTitle}</span>
                          </div>
                        )}
                      </div>
                      {action.defectId && (
                        <div className="text-xs text-[#007bff] font-medium">
                          TRP-{action.defectId}
                        </div>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-[#6c757d] py-8">
                  Нет доступных действий
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-[#dee2e6]">
          <Button onClick={onClose} variant="outline">
            Закрыть
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
