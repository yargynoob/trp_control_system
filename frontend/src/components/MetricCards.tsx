"use client";

import { useState, useEffect } from "react";
import { Card } from "./ui/card";

interface MetricCardProps {
  title: string;
  value: string;
  isOverdue?: boolean;
}

function MetricCard({ title, value, isOverdue }: MetricCardProps) {
  return (
    <Card className="flex-1 min-w-0 h-[100px] md:h-[120px] p-3 md:p-4 bg-white shadow-sm border border-[#dee2e6] rounded-lg">
      <div className="flex flex-col justify-between h-full">
        <h4 className="text-xs uppercase tracking-wide text-[#6c757d] font-medium leading-tight">
          {title}
        </h4>
        <div className={`text-2xl md:text-3xl font-bold ${isOverdue ? 'text-[#dc3545]' : 'text-[#212529]'}`}>
          {value}
        </div>
      </div>
    </Card>);

}

interface MetricsData {
  totalDefects: number;
  inProgress: number;
  overdue: number;
}

interface MetricCardsProps {
  projectId: string;
}

export function MetricCards({ projectId }: MetricCardsProps) {
  const [metrics, setMetrics] = useState<MetricsData>({
    totalDefects: 0,
    inProgress: 0,
    overdue: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        const response = await fetch(`/api/dashboard/${projectId}/metrics`);
        if (response.ok) {
          const data = await response.json();
          setMetrics(data);
        }
      } catch (error) {
        console.error('Error fetching metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [projectId]);

  if (loading) {
    return (
      <div className="flex space-x-3 md:space-x-5 px-3 md:px-6 py-4 md:py-6">
        <div className="flex-1 h-[100px] md:h-[120px] bg-[#f8f9fa] rounded-lg animate-pulse"></div>
        <div className="flex-1 h-[100px] md:h-[120px] bg-[#f8f9fa] rounded-lg animate-pulse"></div>
        <div className="flex-1 h-[100px] md:h-[120px] bg-[#f8f9fa] rounded-lg animate-pulse"></div>
      </div>);

  }

  return (
    <div className="flex space-x-3 md:space-x-5 px-3 md:px-6 py-4 md:py-6">
      <MetricCard title="ВСЕГО ДЕФЕКТОВ" value={metrics.totalDefects.toString()} />
      <MetricCard title="В РАБОТЕ" value={metrics.inProgress.toString()} />
      <MetricCard title="ПРОСРОЧЕНО" value={metrics.overdue.toString()} isOverdue={metrics.overdue > 0} />
    </div>);

}