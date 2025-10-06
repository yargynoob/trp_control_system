"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { DefectsChart } from "@/components/DefectsChart";

interface Report {
  id: number;
  project_id: number | null;
  project_ids: number[] | null;
  created_by: number;
  creator_name: string;
  title: string;
  description: string | null;
  format: "csv" | "excel";
  file_path: string;
  file_size: number;
  created_at: string;
}

export default function AllReportsPage() {
  const router = useRouter();
  const [reports, setReports] = useState<Report[]>([]);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSupervisor, setIsSupervisor] = useState(false);

  useEffect(() => {
    checkSupervisorAndFetchReports();
  }, []);

  const checkSupervisorAndFetchReports = async () => {
    try {
      const token = localStorage.getItem('token');
      
      const supervisorResponse = await fetch('http://localhost:8000/api/v1/users/me/supervisor-projects', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (supervisorResponse.ok) {
        const projects = await supervisorResponse.json();
        const isSup = projects.length > 0;
        setIsSupervisor(isSup);
        
        if (isSup) {
          await fetchReports();
        } else {
          setError('У вас нет прав для просмотра отчетов. Необходимо быть руководителем хотя бы в одном проекте.');
          setLoading(false);
        }
      }
    } catch (error) {
      console.error('Error:', error);
      setError('Ошибка при проверке прав доступа');
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch('/api/reports?projectId=0', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data = await response.json();
        setReports(data.reports || []);
        setError(null);
      } else {
        const errorData = await response.json();
        setError(errorData.detail || 'Не удалось загрузить отчеты');
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      setError('Не удалось загрузить отчеты');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (reportId: number) => {
    try {
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/backend/reports/${reportId}/download?token=${token}`);
      
      if (!response.ok) {
        throw new Error('Failed to download report');
      }
      
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'report';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="?(.+)"?/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading report:', error);
      alert('Не удалось скачать отчет');
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('ru-RU', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getProjectsInfo = (report: Report) => {
    if (report.project_ids && report.project_ids.length > 1) {
      return `Мультипроектный отчет (${report.project_ids.length} проектов)`;
    } else if (report.project_ids && report.project_ids.length === 1) {
      return `Проект ${report.project_ids[0]}`;
    } else if (report.project_id) {
      return `Проект ${report.project_id}`;
    }
    return 'Неизвестный проект';
  };

  return (
    <ProtectedRoute>
      <main className="min-h-screen bg-white">
        <Header />
        <Navigation
          activeTab="reports"
          projectSelected={false}
          isSupervisorAnywhere={isSupervisor}
        />
        
        <div className="bg-[#f8f9fa] min-h-screen">
          <div className="container mx-auto p-6">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h1 className="text-[28px] font-bold text-[#212529]">Все отчеты</h1>
                <p className="text-[#6c757d] mt-1">Просмотр и загрузка всех доступных отчетов</p>
              </div>
            </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {loading ? (
          <div className="text-center py-12">
            <p className="text-[#6c757d]">Загрузка отчетов...</p>
          </div>
        ) : reports.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <div className="w-16 h-16 bg-[#007bff] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-[#007bff]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-[18px] font-semibold text-[#212529] mb-2">
                Отчеты отсутствуют
              </h3>
              <p className="text-[#6c757d]">
                Создайте отчет на странице организаций
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <h2 className="text-[18px] font-semibold text-[#212529] mb-4">
                Список отчетов ({reports.length})
              </h2>
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className={`cursor-pointer transition-shadow hover:shadow-md ${
                    selectedReport?.id === report.id ? 'ring-2 ring-[#007bff]' : ''
                  }`}
                  onClick={() => setSelectedReport(report)}
                >
                  <CardHeader className="pb-3">
                    <CardTitle className="text-[16px] font-semibold text-[#212529]">
                      {report.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center text-[#6c757d]">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {report.creator_name}
                      </div>
                      <div className="flex items-center text-[#6c757d]">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {formatDate(report.created_at)}
                      </div>
                      <div className="flex items-center text-[#6c757d]">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                        </svg>
                        {getProjectsInfo(report)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="lg:col-span-2">
              {selectedReport ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-[20px] font-semibold text-[#212529]">
                        Информация об отчете
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                        Название
                      </h3>
                      <p className="text-[16px] text-[#212529]">
                        {selectedReport.title}
                      </p>
                    </div>

                    {selectedReport.description && (
                      <div>
                        <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                          Описание
                        </h3>
                        <p className="text-[14px] text-[#212529]">
                          {selectedReport.description}
                        </p>
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                          Формат
                        </h3>
                        <p className="text-[14px] text-[#212529]">
                          {selectedReport.format === 'excel' ? 'Excel (.xlsx)' : 'CSV (.csv)'}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                          Размер файла
                        </h3>
                        <p className="text-[14px] text-[#212529]">
                          {formatFileSize(selectedReport.file_size)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                          Создан
                        </h3>
                        <p className="text-[14px] text-[#212529]">
                          {formatDate(selectedReport.created_at)}
                        </p>
                      </div>

                      <div>
                        <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                          Автор
                        </h3>
                        <p className="text-[14px] text-[#212529]">
                          {selectedReport.creator_name}
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm font-medium text-[#6c757d] mb-1">
                        Охват проектов
                      </h3>
                      <p className="text-[14px] text-[#212529]">
                        {getProjectsInfo(selectedReport)}
                      </p>
                    </div>

                    <div className="pt-4 border-t border-[#dee2e6]">
                      <Button
                        onClick={() => handleDownload(selectedReport.id)}
                        className="w-full bg-[#007bff] hover:bg-[#0056b3] text-white"
                      >
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        Скачать отчет
                      </Button>
                    </div>
                    </CardContent>
                  </Card>
                  <div className="mt-6">
                    <DefectsChart reportId={selectedReport.id} />
                  </div>
                </>
              ) : (
                <Card>
                  <CardContent className="py-12 text-center">
                    <div className="w-16 h-16 bg-[#6c757d] bg-opacity-10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-[#6c757d]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-[#6c757d]">
                      Выберите отчет из списка слева для просмотра
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
          </div>
        </div>
      </main>
    </ProtectedRoute>
  );
}
