"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import GoogleMapComponent from "../../../components/GoogleMapComponent";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl"; // ✅ Added

const FieldViewPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const fieldId = Number(pathname.split("/").pop());
  const { hasPermission, permissions } = usePermissions();

  const t = useTranslations('common');
  const f = useTranslations('fields');
  const d = useTranslations('dashboard');
  const tasksT = useTranslations('tasks');

  const [fieldInfo, setFieldInfo] = useState<any>(null);

  interface Task {
    completionDate?: any;
    id: number;
    type: { name: string };
    description: string;
    dueDate?: string;
    season?: { id: number };
    status: { name: string };
  }

  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<{ id: number | null; name: string }[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  const canRead = hasPermission("FIELD_READ");
  const canCreateTask = hasPermission("FIELD_TASK_CREATE");
  const canDeleteField = hasPermission("FIELD_DELETE");
  const canViewTasks = hasPermission("FIELD_TASK_READ");
  const canViewTaskDetails = hasPermission("TASK_READ");

  useEffect(() => {
    if (!canRead || !fieldId) return;
    fetchFieldInfo();
    fetchSeasons();
    if (canViewTasks) fetchTasks();
  }, [fieldId, permissions]);

  useEffect(() => {
    filterTasksBySeason(allTasks, selectedSeasonId);
  }, [selectedSeasonId, allTasks]);

  const fetchFieldInfo = async () => {
    try {
      const response = await api.get(`/fields/${fieldId}`);
      setFieldInfo(response.data);
    } catch (error) {
      toast.error(f('fieldLoadError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const res = await api.get(`/fields/${fieldId}/tasks`);
      const sorted = res.data.sort((a: { dueDate: any; completionDate: any; }, b: { dueDate: any; completionDate: any; }) =>
        new Date(b.dueDate || b.completionDate) > new Date(a.dueDate || a.completionDate) ? 1 : -1
      );
      setAllTasks(sorted);
      filterTasksBySeason(sorted, selectedSeasonId);
    } catch (error) {
      toast.error(tasksT('fetchError'));
    }
  };

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
      const seasonOptions = [
        { id: null, name: tasksT('allSeasons') },
        ...res.data,
      ];
      setSeasons(seasonOptions);
      setSelectedSeasonId(null);
    } catch (err) {
      toast.error(tasksT('fetchSeasonsError'));
    }
  };

  const filterTasksBySeason = (all: any[], seasonId: number | null) => {
    if (!seasonId) {
      setTasks(all);
    } else {
      const filtered = all.filter(task => task.season?.id === seasonId);
      setTasks(filtered);
    }
  };

  const handleDeleteField = async () => {
    if (!window.confirm(f('deleteFieldConfirm'))) return;

    try {
      await api.delete(`/fields/${fieldId}`);
      toast.success(f('deleteFieldSuccess'));
      router.push("/fields");
    } catch (error) {
      toast.error(f('deleteFieldError'));
    }
  };

  if (!canRead) {
    return (
      <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
        🚫 {f('noPermission')}
      </div>
    );
  }

  if (loading) return <ProgressSpinner />;
  if (!fieldInfo) return <div className="text-center text-lg">{f('fieldNotFound')}</div>;

  const fieldCenter = fieldInfo?.boundary?.geometry?.coordinates?.[0]?.[0]
    ? { lat: fieldInfo.boundary.geometry.coordinates[0][0][1], lng: fieldInfo.boundary.geometry.coordinates[0][0][0] }
    : { lat: 55.1694, lng: 23.8813 };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card className="mb-4">
          <h2 className="text-2xl font-bold text-green-700">{fieldInfo.name}</h2>
        </Card>

        <Divider />

        {canViewTasks && (
          <Card title={d('tasksTimeline')} className="mb-6">
            {/* Season filter */}
            <div className="relative mb-4">
              {canCreateTask && (
                <div className="absolute right-0 top-0">
                  <Button
                    label={tasksT('createTask')}
                    className="p-button-primary"
                    onClick={() => router.push(`/create-task/${fieldId}`)}
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pr-[150px]">
                {seasons.map((season) => (
                  <Button
                    key={season.id ?? "all"}
                    label={season.name}
                    className={`p-button-sm ${selectedSeasonId === season.id ? "p-button-info" : "p-button-outlined"}`}
                    onClick={() => setSelectedSeasonId(season.id)}
                  />
                ))}
              </div>
            </div>

            {/* Tasks list */}
            {tasks.length === 0 ? (
              <div className="text-center text-gray-500 mt-4">{tasksT('noTasksAvailable')}</div>
            ) : (
              tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex flex-col md:flex-row mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100"
                >
                  <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-lg">
                    <i className="pi pi-check-circle text-green-600 text-2xl"></i>
                  </div>
                  <div className="flex-1 ml-4">
                    <p className="font-bold">{task.type.name}</p>
                    <p className="text-sm text-gray-500">{task.description}</p>
                    <p className="text-xs text-gray-400">
                      {task.dueDate
                        ? `${d('due')}: ${new Date(task.dueDate).toLocaleDateString("en-CA")}`
                        : task.completionDate
                        ? `${tasksT('completedDate')}: ${new Date(task.completionDate).toLocaleDateString("en-CA")}`
                        : tasksT('noDateAvailable')}
                    </p>

                    <Tag
                      value={task.status.name}
                      severity={task.status.name === "Pending" ? "warning" : "success"}
                    />
                  </div>
                  <div className="ml-auto flex gap-2">
                    {canViewTaskDetails && (
                      <Button
                        label={d('view')}
                        className="p-button-secondary"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                      />
                    )}
                  </div>
                </div>
              ))
            )}
          </Card>
        )}

        <Divider />

        {/* Map */}
        <Card title={f('fieldLocation')}>
          <GoogleMapComponent center={fieldCenter} boundary={fieldInfo?.boundary} />
        </Card>

        <Divider />

        {/* Delete Field Button */}
        {canDeleteField && (
          <div className="text-center mt-4">
            <Button label={f('deleteField')} className="p-button-danger" onClick={handleDeleteField} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default FieldViewPage;
