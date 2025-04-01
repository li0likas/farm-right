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
import { usePermissions } from "@/context/PermissionsContext"; // ✅ Import Permissions Context

const FieldViewPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const fieldId = Number(pathname.split("/").pop());
  const { hasPermission, permissions } = usePermissions();

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

  const [allTasks, setAllTasks] = useState<Task[]>([]); // all fetched from server
  const [tasks, setTasks] = useState<Task[]>([]); // filtered by season
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<{ id: number | null; name: string }[]>([]);
  const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

  // ✅ Permission Helpers
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
      toast.error("Failed to load field data.");
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
      filterTasksBySeason(sorted, selectedSeasonId); // do initial filter
    } catch (error) {
      toast.error("Failed to fetch tasks.");
    }
  };
  
  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
      const seasonOptions = [
        { id: null, name: "All seasons" },
        ...res.data,
      ];
      setSeasons(seasonOptions);
      setSelectedSeasonId(null);
    } catch (err) {
      toast.error("Failed to load seasons.");
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
    if (!window.confirm("Are you sure you want to delete this field?")) return;

    try {
      await api.delete(`/fields/${fieldId}`);
      toast.success("Field deleted successfully.");
      router.push("/fields");
    } catch (error) {
      toast.error("Failed to delete field.");
    }
  };

  if (!canRead) {
    return (
      <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
        🚫 You do not have permission to view this field.
      </div>
    );
  }

  if (loading) return <ProgressSpinner />;
  if (!fieldInfo) return <div className="text-center text-lg">Field not found.</div>;

  const fieldCenter = fieldInfo?.boundary?.geometry?.coordinates?.[0]?.[0]
    ? { lat: fieldInfo.boundary.geometry.coordinates[0][0][1], lng: fieldInfo.boundary.geometry.coordinates[0][0][0] }
    : { lat: 55.1694, lng: 23.8813 };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        {/* Field Name */}
        <Card className="mb-4">
          <h2 className="text-2xl font-bold text-green-700">{fieldInfo.name}</h2>
        </Card>

        <Divider />

        {canViewTasks && (
          <Card title="Tasks" className="mb-6">
            {/* Season filter buttons */}
            <div className="relative mb-4">
            {/* Create Task button absolutely positioned to the top right */}
            {canCreateTask && (
              <div className="absolute right-0 top-0">
                <Button
                  label="Create Task"
                  className="p-button-primary"
                  onClick={() => router.push(`/create-task/${fieldId}`)}
                />
              </div>
            )}

            {/* Season buttons with right padding to avoid overlapping button */}
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
              <div className="text-center text-gray-500 mt-4">No tasks available.</div>
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
                      ? `Due: ${new Date(task.dueDate).toLocaleDateString("en-CA")}`
                      : task.completionDate
                      ? `Completed: ${new Date(task.completionDate).toLocaleDateString("en-CA")}`
                      : "No date available"}
                  </p>

                    <Tag
                      value={task.status.name}
                      severity={task.status.name === "Pending" ? "warning" : "success"}
                    />
                  </div>
                  <div className="ml-auto flex gap-2">
                    {canViewTaskDetails && (
                      <Button
                        label="View"
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

        {/* Google Map Component */}
        <Card title="Field Location">
          <GoogleMapComponent center={fieldCenter} boundary={fieldInfo?.boundary} />
        </Card>

        <Divider />

        {/* Delete Field Button at the Bottom */}
        {canDeleteField && (
          <div className="text-center mt-4">
            <Button label="Delete Field" className="p-button-danger" onClick={handleDeleteField} />
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
};

export default FieldViewPage;
