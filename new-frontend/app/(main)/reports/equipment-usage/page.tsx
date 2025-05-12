"use client";

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { ProgressSpinner } from "primereact/progressspinner";
import { Message } from "primereact/message";
import { toast } from "sonner";
import api from "@/utils/api";
import ProtectedRoute from "@/utils/ProtectedRoute";
import { Chart } from "primereact/chart";
import { TabView, TabPanel } from "primereact/tabview";
import { useTranslations } from "next-intl";
import { usePermissions } from "@/context/PermissionsContext";
import { useRouter } from "next/navigation";

const EquipmentUsageReport = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  const [seasonOptions, setSeasonOptions] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState(null);
  const [equipmentUsage, setEquipmentUsage] = useState([]);
  const [loading, setLoading] = useState(true);
  const [taskTypeOptions, setTaskTypeOptions] = useState<string[]>([]);

  const t = useTranslations('common');
  const r = useTranslations('equipmentReport');

  const canViewReport = hasPermission("EQUIPMENT_READ");

  useEffect(() => {
    if (canViewReport) {
      fetchSeasons();
      fetchTaskTypes();
    } else {
      setLoading(false);
    }
  }, [canViewReport]);
  
  const fetchTaskTypes = async () => {
    try {
      const res = await api.get("/task-type-options");
      setTaskTypeOptions(res.data.map((t: any) => t.name));
    } catch {
      toast.error(r('fetchTaskTypesError'));
    }
  };

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
      const options = res.data.map((s: any) => ({
        label: s.name,
        value: s.id,
      }));
      setSeasonOptions(options);
      if (options.length) {
        setSelectedSeason(options[0].value);
        fetchEquipmentUsage(options[0].value);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error(r('fetchSeasonsError'));
      setLoading(false);
    }
  };

  const fetchEquipmentUsage = async (seasonId: number) => {
    try {
      setLoading(true);
      const res = await api.get("/report/equipment-usage", {
        headers: {
          "seasonId": seasonId,
        },
      });
      setEquipmentUsage(res.data);
    } catch {
      toast.error(r('fetchUsageError'));
    } finally {
      setLoading(false);
    }
  };

  const getChartDataByTaskType = (
    equipmentData: any,
    valueKey: 'count' | 'fuel' | 'minutes'
  ) => {
    const labels = taskTypeOptions;
    const values = labels.map(
      (label) => equipmentData.byTaskType[label]?.[valueKey] ?? 0
    );
    return { labels, values };
  };

  if (!canViewReport) {
    return (
      <ProtectedRoute>
        <div className="grid">
          <div className="col-12">
            <Card className="shadow-4">
              <div className="flex flex-column align-items-center py-6">
                <i className="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">{r('noPermission')}</h3>
                <p className="text-gray-600 mb-4">{r('contactAdmin')}</p>
                <Button
                  label={t('backToDashboard')}
                  icon="pi pi-home"
                  className="p-button-outlined"
                  onClick={() => router.push('/dashboard')}
                />
              </div>
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <h2 className="text-2xl font-bold m-0 text-primary mb-4">{r('title')}</h2>
            
            <div className="mb-4 flex gap-4 items-center">
              <Dropdown
                value={selectedSeason}
                options={seasonOptions}
                onChange={(e) => {
                  setSelectedSeason(e.value);
                  fetchEquipmentUsage(e.value);
                }}
                placeholder={t('selectSeason')}
                className="w-72"
                disabled={loading || seasonOptions.length === 0}
              />
            </div>

            {loading ? (
              <div className="flex flex-column justify-content-center align-items-center py-6">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <span className="mt-3 text-lg text-600">{r('loadingData')}</span>
              </div>
            ) : (
              <>
                {seasonOptions.length === 0 ? (
                  <Message 
                    severity="info" 
                    text={r('noSeasonsAvailable')} 
                    className="mt-4"
                  />
                ) : equipmentUsage.length === 0 ? (
                  <div className="flex flex-column align-items-center justify-content-center py-6">
                    <i className="pi pi-inbox text-gray-300 text-6xl mb-4"></i>
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">{r('noDataFound')}</h3>
                    <p className="text-gray-500">{r('noDataDescription')}</p>
                  </div>
                ) : (
                  <TabView className="mt-4">
                    {/* Task Overview */}
                    <TabPanel header={r('taskOverview')}>
                      {equipmentUsage.map((equip: any) => {
                        const totalTasks = equip.totalTasks || 0;
                        const { labels, values: counts } = getChartDataByTaskType(equip, 'count');

                        if (totalTasks === 0) {
                          return (
                            <Card key={equip.id} className="mb-4">
                              <h4 className="font-semibold mb-0">{equip.name}</h4>
                              <p className="text-gray-500 mt-2">{r('noCompletedTasks')}</p>
                            </Card>
                          );
                        }

                        const percentages = counts.map((c) => (c / totalTasks) * 100);

                        const chartData = {
                          labels,
                          datasets: [
                            {
                              label: '%',
                              data: percentages,
                              backgroundColor: ['#42A5F5', '#66BB6A', '#FFA726', '#AB47BC', '#FF7043'],
                            },
                          ],
                        };

                        return (
                          <Card key={equip.id} className="mb-4">
                            <h4 className="font-semibold mb-3">{equip.name}</h4>
                            <div className="text-sm mb-2 text-gray-700">
                              <strong>{r('totalTasksCompleted')}</strong> {totalTasks}
                            </div>
                            <h6 className="mb-2 font-bold text-sm text-gray-700">{r('taskTypeBreakdown')}</h6>
                            <Chart
                              type="bar"
                              data={chartData}
                              options={{
                                plugins: { legend: { display: false } },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    max: 100,
                                    title: { display: true, text: '%' },
                                  },
                                },
                              }}
                              style={{ height: '200px' }}
                            />
                          </Card>
                        );
                      })}
                    </TabPanel>

                    {/* Fuel Usage */}
                    <TabPanel header={r('fuelUsage')}>
                      {equipmentUsage.map((equip: any) => {
                        const entries = Object.entries(equip.byTaskType || {}).filter(([_, data]: any) => data.fuel > 0);

                        if (entries.length === 0) {
                          return (
                            <Card key={equip.id} className="mb-4">
                              <h4 className="font-semibold mb-0">{equip.name}</h4>
                              <p className="text-gray-500 mt-2">{r('noFuelUsage')}</p>
                            </Card>
                          );
                        }

                        const { labels, values } = getChartDataByTaskType(equip, 'fuel');

                        const chartData = {
                          labels,
                          datasets: [
                            {
                              label: r('fuelUsedLabel'),
                              data: values,
                              backgroundColor: ['#EF5350', '#29B6F6', '#9CCC65', '#FFA726', '#BA68C8'],
                            },
                          ],
                        };

                        return (
                          <Card key={equip.id} className="mb-4">
                            <h4 className="font-semibold mb-3">{equip.name}</h4>
                            <div className="text-sm mb-2 text-gray-700">
                              <strong>{r('totalFuelUsed')}</strong> {equip.totalFuel?.toFixed(1) ?? '0.0'} L
                            </div>
                            <h6 className="mb-2 font-bold text-sm text-gray-700">{r('fuelUsagePerTaskType')}</h6>
                            <Chart
                              type="pie"
                              data={chartData}
                              options={{ responsive: true, maintainAspectRatio: false }}
                              style={{ height: '200px' }}
                            />
                          </Card>
                        );
                      })}
                    </TabPanel>

                    {/* Time Worked */}
                    <TabPanel header={r('timeWorked')}>
                      {equipmentUsage.map((equip: any) => {
                        const entries = Object.entries(equip.byTaskType || {}).filter(([_, data]: any) => data.minutes > 0);

                        if (entries.length === 0) {
                          return (
                            <Card key={equip.id} className="mb-4">
                              <h4 className="font-semibold mb-0">{equip.name}</h4>
                              <p className="text-gray-500 mt-2">{r('noTimeUsage')}</p>
                            </Card>
                          );
                        }

                        const { labels, values } = getChartDataByTaskType(equip, 'minutes');
                        const totalMinutes = values.reduce((sum, val) => sum + val, 0);

                        const chartData = {
                          labels,
                          datasets: [
                            {
                              label: r('minutesWorkedLabel'),
                              data: values,
                              backgroundColor: ['#FFD54F', '#4DD0E1', '#9575CD', '#FF8A65', '#81C784'],
                            },
                          ],
                        };

                        return (
                          <Card key={equip.id} className="mb-4">
                            <h4 className="font-semibold mb-3">{equip.name}</h4>
                            <div className="text-sm mb-2 text-gray-700">
                              <strong>{r('totalTimeWorked')}</strong> {totalMinutes} {t('minutes')}
                            </div>
                            <h6 className="mb-2 font-bold text-sm text-gray-700">{r('timeSpentPerTaskType')}</h6>
                            <Chart
                              type="bar"
                              data={chartData}
                              options={{
                                plugins: { legend: { display: false } },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    title: { display: true, text: t('minutes') },
                                  },
                                },
                              }}
                              style={{ height: '200px' }}
                            />
                          </Card>
                        );
                      })}
                    </TabPanel>

                    {/* Area Covered */}
                    <TabPanel header={r('areaCovered')}>
                      {equipmentUsage.map((equip: any) => {
                        const labels = taskTypeOptions;
                        const values = labels.map(label => equip.byTaskType[label]?.area ?? 0);
                        const totalArea = values.reduce((sum, val) => sum + val, 0);

                        if (totalArea === 0) {
                          return (
                            <Card key={equip.id} className="mb-4">
                              <h4 className="font-semibold mb-0">{equip.name}</h4>
                              <p className="text-gray-500 mt-2">{r('noAreaData')}</p>
                            </Card>
                          );
                        }

                        const chartData = {
                          labels,
                          datasets: [
                            {
                              label: r('areaCoveredLabel'),
                              data: values,
                              backgroundColor: ['#81C784', '#4FC3F7', '#FFD54F', '#A1887F', '#BA68C8'],
                            },
                          ],
                        };

                        return (
                          <Card key={equip.id} className="mb-4">
                            <h4 className="font-semibold mb-3">{equip.name}</h4>
                            <div className="text-sm mb-2 text-gray-700">
                              <strong>{r('totalAreaCovered')}</strong> {totalArea.toFixed(2)} {t('ha')}
                            </div>
                            <h6 className="mb-2 font-bold text-sm text-gray-700">{r('areaPerTaskType')}</h6>
                            <Chart
                              type="bar"
                              data={chartData}
                              options={{
                                plugins: { legend: { display: false } },
                                responsive: true,
                                maintainAspectRatio: false,
                                scales: {
                                  y: {
                                    beginAtZero: true,
                                    title: { display: true, text: t('ha') },
                                  },
                                },
                              }}
                              style={{ height: '200px' }}
                            />
                          </Card>
                        );
                      })}
                    </TabPanel>
                  </TabView>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default EquipmentUsageReport;