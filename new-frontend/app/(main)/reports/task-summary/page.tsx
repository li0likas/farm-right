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
import { useRouter } from "next/navigation";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Panel } from "primereact/panel";

const ReportsPage = () => {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<any>(null);
  const [seasonOptions, setSeasonOptions] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const [allTaskTypes, setAllTaskTypes] = useState<string[]>([]);

  const t = useTranslations('common');
  const r = useTranslations('tasksReport');

  // Get current locale from language context
  const currentLocale = typeof window !== 'undefined' 
    ? (localStorage.getItem('language') === 'lt' ? 'lt-LT' : 'en-US')
    : 'en-US';

  useEffect(() => {
    fetchSeasons();
    fetchAllTaskTypes();
  }, []);

  const fetchAllTaskTypes = async () => {
    try {
      const res = await api.get("/task-type-options");
      setAllTaskTypes(res.data.map((t: any) => t.name));
    } catch {
      toast.error(r('fetchTaskTypesError'));
    }
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
        borderRadius: 6,
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

  const getStatusSeverity = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'canceled': return 'danger';
      default: return 'info';
    }
  };

  return (
    <ProtectedRoute>
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <div className="flex align-items-center justify-content-between mb-4">
              <h2 className="text-2xl font-bold m-0 text-primary">
                <i className="pi pi-chart-bar text-primary mr-2"></i>
                {r('title')}
              </h2>
              <Button
                label={t('backToReports')}
                icon="pi pi-arrow-left"
                className="p-button-text"
                onClick={() => router.push('/reports')}
              />
            </div>

            <div className="mb-4">
              <Dropdown
                value={selectedSeason}
                options={seasonOptions}
                onChange={(e) => setSelectedSeason(e.value)}
                placeholder={t('selectSeason')}
                className="w-full md:w-20rem"
              />
            </div>

            {loading ? (
              <div className="flex flex-column justify-content-center align-items-center" style={{ minHeight: '400px' }}>
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <span className="mt-3 text-lg text-600">{r('loadingReport')}</span>
              </div>
            ) : !report ? (
              <Card className="shadow-2">
                <div className="flex flex-column align-items-center justify-content-center py-6">
                  <i className="pi pi-chart-bar text-gray-300 text-6xl mb-4"></i>
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">{r('noData')}</h3>
                  <p className="text-gray-500 text-center max-w-30rem">
                    {r('noDataDescription')}
                  </p>
                </div>
              </Card>
            ) : (
              <>
                <Panel header={r('overview')} className="mb-4 shadow-2">
                  <div className="grid">
                    <div className="col-12 md:col-6 lg:col-3">
                      <div className="bg-blue-50 p-3 border-round text-center">
                        <div className="text-blue-500 text-600">{r('totalTasks')}</div>
                        <div className="text-2xl font-bold text-900">{report.totalTasks}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                      <div className="bg-green-50 p-3 border-round text-center">
                        <div className="text-green-500 text-600">{r('completed')}</div>
                        <div className="text-2xl font-bold text-900">{report.completedTasks}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                      <div className="bg-yellow-50 p-3 border-round text-center">
                        <div className="text-yellow-500 text-600">{r('pending')}</div>
                        <div className="text-2xl font-bold text-900">{report.pendingTasks}</div>
                      </div>
                    </div>
                    <div className="col-12 md:col-6 lg:col-3">
                      <div className="bg-red-50 p-3 border-round text-center">
                        <div className="text-red-500 text-600">{r('canceled')}</div>
                        <div className="text-2xl font-bold text-900">{report.canceledTasks}</div>
                      </div>
                    </div>
                  </div>

                  {report.averageCompletionTimeMinutes > 0 && (
                    <div className="mt-4 p-3 bg-blue-50 border-round">
                      <div className="flex align-items-center">
                        <i className="pi pi-clock text-blue-500 text-xl mr-2"></i>
                        <div>
                          <span className="font-semibold">{r('avgCompletionTime')}</span> 
                          <span className="ml-2 text-blue-700 font-bold">
                            {report.averageCompletionTimeMinutes} {t('minutes')}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </Panel>

                <div className="grid">
                  <div className="col-12 lg:col-6">
                    <Card title={r('tasksByField')} className="shadow-2 h-full">
                      {report && Object.values(report.groupedByField).some(value => value > 0) ? (
                        <Chart
                          type="bar"
                          data={fieldChartData}
                          options={{
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: { 
                              legend: { display: false },
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    return `${context.parsed.y.toFixed(1)}%`;
                                  }
                                }
                              }
                            },
                            scales: {
                              y: {
                                beginAtZero: true,
                                max: 100,
                                title: {
                                  display: true,
                                  text: "%",
                                },
                                ticks: {
                                  callback: (value) => `${value}%`
                                }
                              },
                              x: {
                                ticks: {
                                  autoSkip: false,
                                  maxRotation: 45,
                                  minRotation: 0
                                }
                              }
                            },
                          }}
                          style={{ height: "300px" }}
                        />
                      ) : (
                        <div className="flex flex-column align-items-center justify-content-center" style={{ height: "300px" }}>
                          <i className="pi pi-chart-bar text-gray-300 text-4xl mb-2"></i>
                          <p className="text-gray-500 text-center">{r('noTaskData')}</p>
                        </div>
                      )}
                    </Card>
                  </div>

                  <div className="col-12 lg:col-6">
                    <Card title={r('tasksByType')} className="shadow-2 h-full">
                      {report && Object.values(report.groupedByType).some(value => value > 0) ? (
                        <Chart
                          type="doughnut"
                          data={typeChartData}
                          options={{ 
                            responsive: true, 
                            maintainAspectRatio: false,
                            plugins: {
                              legend: {
                                position: 'bottom',
                                labels: {
                                  usePointStyle: true,
                                  padding: 20
                                }
                              },
                              tooltip: {
                                callbacks: {
                                  label: (context) => {
                                    const label = context.label || '';
                                    const value = context.parsed;
                                    const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
                                    const percentage = ((value / total) * 100).toFixed(1);
                                    return `${label}: ${value} (${percentage}%)`;
                                  }
                                }
                              }
                            }
                          }}
                          style={{ height: "300px" }}
                        />
                      ) : (
                        <div className="flex flex-column align-items-center justify-content-center" style={{ height: "300px" }}>
                          <i className="pi pi-chart-pie text-gray-300 text-4xl mb-2"></i>
                          <p className="text-gray-500 text-center">{r('noTaskTypeData')}</p>
                        </div>
                      )}
                    </Card>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default ReportsPage;