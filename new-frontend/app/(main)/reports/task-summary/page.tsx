"use client";

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Chart } from "primereact/chart";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropdown } from "primereact/dropdown";
import { toast } from "sonner";
import api from "@/utils/api";
import ProtectedRoute from "@/utils/ProtectedRoute";
import { useTranslations } from "next-intl";

const ReportsPage = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [seasonOptions, setSeasonOptions] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [allTaskTypes, setAllTaskTypes] = useState<string[]>([]);

  const t = useTranslations('common');
  const r = useTranslations('tasksReport');

  useEffect(() => {
    fetchSeasons();
    fetchAllTaskTypes();
  }, []);

  const fetchAllTaskTypes = async () => {
    const res = await api.get("/task-type-options");
    setAllTaskTypes(res.data.map((t: any) => t.name));
  };

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
      const options = res.data.map((s: any) => ({ label: s.name, value: s.id }));
      setSeasonOptions(options);
      if (options.length) {
        setSelectedSeason(options[0].value);
      }
    } catch {
      toast.error(r('fetchSeasonsError'));
    }
  };

  useEffect(() => {
    if (!selectedSeason) return;

    const fetchReport = async () => {
      setLoading(true);
      try {
        const res = await api.get("/report/tasks", {
          headers: {
            seasonid: selectedSeason,
          },
        });
        setReport(res.data);
      } catch (error) {
        console.error("Failed to fetch report", error);
        toast.error(r('fetchReportError'));
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [selectedSeason]);

  const totalTasks = report?.totalTasks || 1;
  const fieldLabels = report ? Object.keys(report.groupedByField) : [];
  const fieldValues = report
    ? fieldLabels.map((label) => (report.groupedByField[label] / totalTasks) * 100)
    : [];

  const fieldChartData = {
    labels: fieldLabels,
    datasets: [
      {
        label: "%",
        data: fieldValues,
        backgroundColor: "#42A5F5",
      },
    ],
  };

  const normalizedTaskTypes = allTaskTypes.reduce((acc, typeName) => {
    acc[typeName] = report?.groupedByType?.[typeName] ?? 0;
    return acc;
  }, {} as Record<string, number>);

  const typeChartData = {
    labels: Object.keys(normalizedTaskTypes),
    datasets: [
      {
        label: r('tasksByTypeLabel'),
        data: Object.values(normalizedTaskTypes),
        backgroundColor: [
          "#42A5F5",
          "#66BB6A",
          "#FFA726",
          "#AB47BC",
          "#FF7043",
          "#29B6F6",
          "#9CCC65",
        ],
      },
    ],
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card title={r('title')}>
          <div className="mb-4">
            <Dropdown
              value={selectedSeason}
              options={seasonOptions}
              onChange={(e) => setSelectedSeason(e.value)}
              placeholder={t('selectSeason')}
              className="w-72"
            />
          </div>

          {loading ? (
            <div className="flex justify-center py-20">
              <ProgressSpinner />
            </div>
          ) : report ? (
            <>
              <Card title={r('overview')} className="mb-6">
                <p><strong>{r('totalTasks')}</strong> {report.totalTasks}</p>
                <p><strong>{r('completed')}</strong> {report.completedTasks}</p>
                <p><strong>{r('pending')}</strong> {report.pendingTasks}</p>
                <p><strong>{r('canceled')}</strong> {report.canceledTasks}</p>

                {report.averageCompletionTimeMinutes > 0 && (
                  <p className="mt-2 text-blue-600">
                    ⏱️ <strong>{r('avgCompletionTime')}</strong> {report.averageCompletionTimeMinutes} {t('minutes')}
                  </p>
                )}
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card title={r('tasksByField')}>
                  {report && Object.values(report.groupedByField).some(value => value > 0) ? (
                    <Chart
                      type="bar"
                      data={fieldChartData}
                      options={{
                        responsive: true,
                        maintainAspectRatio: false,
                        plugins: { legend: { display: false } },
                        scales: {
                          y: {
                            beginAtZero: true,
                            max: 100,
                            title: {
                              display: true,
                              text: "%",
                            },
                          },
                        },
                      }}
                      style={{ height: "300px" }}
                    />
                  ) : (
                    <p className="text-gray-500 text-sm">{r('noTaskData')}</p>
                  )}
                </Card>

                <Card title={r('tasksByType')}>
                  {report && Object.values(report.groupedByType).some(value => value > 0) ? (
                    <Chart
                      type="doughnut"
                      data={typeChartData}
                      options={{ responsive: true, maintainAspectRatio: false }}
                      style={{ height: "300px" }}
                    />
                  ) : (
                    <p className="text-gray-500 text-sm">{r('noTaskTypeData')}</p>
                  )}
                </Card>
              </div>
            </>
          ) : (
            <div className="text-center text-lg text-red-500">{r('noData')}</div>
          )}
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default ReportsPage;
