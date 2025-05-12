"use client";

import React, { useEffect, useState } from "react";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dropdown } from "primereact/dropdown";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { toast } from "sonner";
import { useTranslations } from "next-intl";
import { usePermissions } from "@/context/PermissionsContext";
import { useRouter } from "next/navigation";

const FarmMembersActivityReport = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  const [loading, setLoading] = useState(true);
  const [activityData, setActivityData] = useState<any[]>([]);
  const [seasonOptions, setSeasonOptions] = useState([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);

  const t = useTranslations('common');
  const ar = useTranslations('activityReport');

  const canViewReport = hasPermission("FARM_MEMBER_READ") || hasPermission("TASK_READ");

  useEffect(() => {
    if (canViewReport) {
      fetchSeasons();
    } else {
      setLoading(false);
    }
  }, [canViewReport]);

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
      const options = res.data.map((s: any) => ({
        label: s.name,
        value: s.id,
      }));
      setSeasonOptions(options);
      if (options.length > 0) {
        setSelectedSeason(options[0].value);
      } else {
        setLoading(false);
      }
    } catch {
      toast.error(ar('fetchSeasonsError'));
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedSeason || !canViewReport) return;

    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await api.get("/report/farm-members-activity", {
          headers: {
            seasonid: selectedSeason,
          },
        });
        setActivityData(res.data);
      } catch {
        toast.error(ar('fetchActivityError'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedSeason, canViewReport]);

  const getRoleSeverity = (role: string) => {
    const roleLower = role.toLowerCase();
    if (roleLower.includes('owner')) return 'success';
    if (roleLower.includes('admin')) return 'info';
    if (roleLower.includes('agronomist')) return 'warning';
    return null;
  };

  if (!canViewReport) {
    return (
      <ProtectedRoute>
        <div className="grid">
          <div className="col-12">
            <Card className="shadow-4">
              <div className="flex flex-column align-items-center py-6">
                <i className="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
                <h3 className="text-xl font-semibold mb-2">{ar('noPermission')}</h3>
                <p className="text-gray-600 mb-4">{ar('contactAdmin')}</p>
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
            <h2 className="text-2xl font-bold m-0 text-primary mb-4">{ar('title')}</h2>
            
            <div className="mb-4">
              <Dropdown
                value={selectedSeason}
                options={seasonOptions}
                onChange={(e) => setSelectedSeason(e.value)}
                placeholder={t('selectSeason')}
                className="w-72"
                disabled={loading || seasonOptions.length === 0}
              />
            </div>

            {loading ? (
              <div className="flex flex-column justify-content-center align-items-center py-6">
                <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                <span className="mt-3 text-lg text-600">{ar('loadingData')}</span>
              </div>
            ) : seasonOptions.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center py-6">
                <i className="pi pi-calendar-times text-gray-300 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{ar('noSeasonsFound')}</h3>
                <p className="text-gray-500">{ar('noSeasonsDescription')}</p>
              </div>
            ) : activityData.length === 0 ? (
              <div className="flex flex-column align-items-center justify-content-center py-6">
                <i className="pi pi-users text-gray-300 text-6xl mb-4"></i>
                <h3 className="text-xl font-semibold text-gray-600 mb-2">{ar('noActivityData')}</h3>
                <p className="text-gray-500">{ar('noActivityDescription')}</p>
              </div>
            ) : (
              <div className="grid">
                {activityData.map((member) => (
                  <div key={member.id} className="col-12 lg:col-6 xl:col-4">
                    <Card className="mb-4 h-full">
                      <div className="flex align-items-center mb-3">
                        <div className="flex align-items-center justify-content-center bg-blue-100 border-circle mr-3" 
                             style={{ width: '3rem', height: '3rem' }}>
                          <i className="pi pi-user text-blue-600 text-xl"></i>
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold m-0">{member.username}</h4>
                          <Tag 
                            value={member.role} 
                            severity={getRoleSeverity(member.role)}
                            className="mt-1"
                          />
                        </div>
                      </div>
                      
                      <div className="grid text-sm">
                        <div className="col-6">
                          <div className="text-gray-500">{ar('tasksParticipated')}</div>
                          <div className="text-xl font-semibold text-primary">{member.taskCount}</div>
                        </div>
                        <div className="col-6">
                          <div className="text-gray-500">{ar('totalMinutesWorked')}</div>
                          <div className="text-xl font-semibold text-green-600">{member.totalMinutes}</div>
                        </div>
                      </div>
                      
                      {member.taskTitles.length > 0 && (
                        <div className="mt-3">
                          <p className="font-semibold mb-2">{ar('tasks')}</p>
                          <ul className="list-none p-0 m-0">
                            {member.taskTitles.slice(0, 3).map((title: string, index: number) => (
                              <li key={index} className="mb-1">
                                <i className="pi pi-check-circle text-green-500 mr-2 text-sm"></i>
                                <span className="text-sm">{title}</span>
                              </li>
                            ))}
                            {member.taskTitles.length > 3 && (
                              <li className="text-sm text-gray-500 ml-4">
                                ... {ar('andMore', { count: member.taskTitles.length - 3 })}
                              </li>
                            )}
                          </ul>
                        </div>
                      )}
                    </Card>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FarmMembersActivityReport;