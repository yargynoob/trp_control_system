"use client";

import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';

interface ProjectData {
  project_id: number;
  project_name: string;
  data: number[];
}

interface ChartData {
  dates: string[];
  projects: ProjectData[];
}

interface DefectsChartProps {
  reportId: number;
}

const CHART_COLORS = [
  '#007bff', // Blue
  '#28a745', // Green
  '#dc3545', // Red
  '#ffc107', // Yellow
  '#17a2b8', // Cyan
  '#6610f2', // Purple
  '#fd7e14', // Orange
  '#e83e8c', // Pink
];

export function DefectsChart({ reportId }: DefectsChartProps) {
  const [chartData, setChartData] = useState<any[] | null>(null);
  const [projectNames, setProjectNames] = useState<{ [key: number]: string }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchChartData();
  }, [reportId]);

  const fetchChartData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/reports/${reportId}/chart-data`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (response.ok) {
        const data: ChartData = await response.json();
        
        const transformed = data.dates.map((date, index) => {
          const point: any = {
            date: new Date(date).toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
            fullDate: date,
          };
          
          data.projects.forEach((project) => {
            point[`project_${project.project_id}`] = project.data[index];
          });
          
          return point;
        });

        // Store project names for legend
        const names: { [key: number]: string } = {};
        data.projects.forEach((project) => {
          names[project.project_id] = project.project_name;
        });

        setChartData(transformed);
        setProjectNames(names);
        setError(null);
      } else {
        setError('Не удалось загрузить данные графика');
      }
    } catch (error) {
      console.error('Error fetching chart data:', error);
      setError('Ошибка при загрузке данных графика');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-[#6c757d]">Загрузка графика...</p>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!chartData || chartData.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-[#6c757d]">Нет данных для отображения графика</p>
        </CardContent>
      </Card>
    );
  }

  const projectIds = Object.keys(projectNames).map(Number);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-[18px] font-semibold text-[#212529]">
          Дефекты за последний месяц
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#dee2e6" />
            <XAxis
              dataKey="date"
              tick={{ fill: '#6c757d', fontSize: 12 }}
              stroke="#dee2e6"
            />
            <YAxis
              tick={{ fill: '#6c757d', fontSize: 12 }}
              stroke="#dee2e6"
              allowDecimals={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #dee2e6',
                borderRadius: '4px',
                fontSize: '12px',
              }}
              labelStyle={{ color: '#212529', fontWeight: 'bold' }}
              formatter={(value: any, name: string) => {
                const projectId = parseInt(name.replace('project_', ''));
                return [value, projectNames[projectId] || `Project ${projectId}`];
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: '12px' }}
              formatter={(value: string) => {
                const projectId = parseInt(value.replace('project_', ''));
                return projectNames[projectId] || `Project ${projectId}`;
              }}
            />
            {projectIds.map((projectId, index) => (
              <Line
                key={projectId}
                type="monotone"
                dataKey={`project_${projectId}`}
                name={`project_${projectId}`}
                stroke={CHART_COLORS[index % CHART_COLORS.length]}
                strokeWidth={2}
                dot={{ fill: CHART_COLORS[index % CHART_COLORS.length], r: 3 }}
                activeDot={{ r: 5 }}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md">
          <p className="text-sm text-blue-700">
            График показывает количество созданных дефектов по дням за последние 30 дней.
            {projectIds.length > 1 && ' Линии разных цветов представляют разные проекты.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
