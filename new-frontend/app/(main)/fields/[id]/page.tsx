"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import GoogleMapComponent from "../../../components/GoogleMapComponent";
import { isLoggedIn } from "@/utils/auth";
import ProtectedRoute from "@/utils/ProtectedRoute";

const FieldViewPage = () => {
  const pathname = usePathname();
  const fieldId = Number(pathname.split("/").pop());
  const [fieldInfo, setFieldInfo] = useState<any>(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Field Info
  useEffect(() => {
    if (!fieldId) return;

    if (!isLoggedIn()) {
      toast.error('Unauthorized. Login first.');
      return;
    }

    fetchFieldInfo();
    fetchTasks();
  }, [fieldId]);

  const fetchFieldInfo = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setFieldInfo(response.data);
    } catch (error) {
      console.error("Error fetching field info:", error);
      toast.error("Failed to load field data.");
    } finally {
      setLoading(false);
    }
  };

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields/${fieldId}/tasks`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const sortedTasks = response.data.sort((a: any, b: any) =>
        new Date(b.dueDate || b.completionDate) > new Date(a.dueDate || a.completionDate) ? 1 : -1
      );
      setTasks(sortedTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      toast.error("Failed to load tasks.");
    }
  };

  // Delete Field
  const handleDeleteField = async () => {
    if (!window.confirm("Are you sure you want to delete this field?")) return;
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields/${fieldId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      toast.success("Field deleted successfully.");
      window.location.href = "/fields"; // Redirect after deletion
    } catch (error) {
      console.error("Error deleting field:", error);
      toast.error("Failed to delete field.");
    }
  };

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

        {/* Tasks Section */}
        <Card title="Tasks" className="mb-6">
          <div className="text-right">
            <Button
              label="Create Task"
              className="p-button-primary"
              onClick={() => (window.location.href = `/create-task/${fieldId}`)}
            />
          </div>

          {tasks.length === 0 ? (
            <div className="text-center text-gray-500 mt-4">No tasks available.</div>
          ) : (
            tasks.map((task) => (
              <div key={task.id} className="flex flex-col md:flex-row mb-4 p-4 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-16 h-16 flex items-center justify-center bg-green-100 rounded-lg">
                  <i className="pi pi-check-circle text-green-600 text-2xl"></i>
                </div>
                <div className="flex-1 ml-4">
                  <p className="font-bold">{task.type.name}</p>
                  <p className="text-sm text-gray-500">{task.description}</p>
                  <p className="text-xs text-gray-400">
                    Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-CA") : "N/A"}
                  </p>
                  <Tag value={task.status.name} severity={task.status.name === "Pending" ? "warning" : "success"} />
                </div>
                <div className="ml-auto flex gap-2">
                  <Button label="View" className="p-button-secondary" onClick={() => (window.location.href = `/tasks/${task.id}`)} />
                </div>
              </div>
            ))
          )}
        </Card>

        <Divider />

        {/* Google Map Component */}
        <Card title="Field Location">
          <GoogleMapComponent center={fieldCenter} boundary={fieldInfo?.boundary} />
        </Card>

        <Divider />

        {/* Delete Field Button at the Bottom */}
        <div className="text-center mt-4">
          <Button label="Delete Field" className="p-button-danger" onClick={handleDeleteField} />
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default FieldViewPage;
