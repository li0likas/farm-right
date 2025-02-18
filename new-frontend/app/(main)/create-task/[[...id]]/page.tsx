"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import axios from "axios";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { isLoggedIn } from "@/utils/auth";
import ProtectedRoute from "@/utils/ProtectedRoute";

const TaskCreatePage = () => {
  const pathname = usePathname();
  const fieldIdFromUrl = Number(pathname.split("/").pop());
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState(null);
  const [taskFieldOptions, setTaskFieldOptions] = useState([]);
  const [taskField, setTaskField] = useState(fieldIdFromUrl || null);
  const [taskTypeOptions, setTaskTypeOptions] = useState([]);
  const [taskStatusOptions, setTaskStatusOptions] = useState([]);
  const [taskType, setTaskType] = useState("");
  const [dueDate, setDueDate] = useState(null);
  const [completionDate, setCompletionDate] = useState(null);
  const [optimalDateTime, setOptimalDateTime] = useState(null);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn()) {
        toast.error('Unauthorized. Login first.');
        return;
    }
    fetchOptions();
  }, []);

  // Fetch options for fields, task types, and statuses
  const fetchOptions = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      if (!fieldIdFromUrl) {
        const fieldsResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTaskFieldOptions(fieldsResponse.data.map((field: any) => ({ label: field.name, value: field.id })));
      }

      const taskTypesResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/task-type-options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaskTypeOptions(taskTypesResponse.data.map((type: any) => ({ label: type.name, value: type.id })));

      const taskStatusResponse = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/task-status-options`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setTaskStatusOptions(
        taskStatusResponse.data
          .filter((option: any) => option.name.toLowerCase() !== "canceled")
          .map((status: any) => ({ label: status.name, value: status.id }))
      );
    } catch (error) {
      console.error("Error fetching options:", error);
      toast.error("Failed to load options.");
    }
  };

  // Fetch Weather Insights & Optimal Task Time
  const fetchWeatherInsights = async (lat: number, lon: number) => {
    const token = localStorage.getItem("accessToken");
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/weather/optimal-date`, {
        params: { lat, lon, dueDate, taskType },
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      setOptimalDateTime(response.data.optimalDateTime);
      setInsights(response.data.insights);
    } catch (error) {
      console.error("Error fetching weather insights:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch field boundary and get optimal task date
  const fetchOptimalTaskDate = async () => {
    const token = localStorage.getItem("accessToken");
    try {
      const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields/${taskField}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const [lon, lat] = response.data.boundary.geometry.coordinates[0][0];
      fetchWeatherInsights(lat, lon);
    } catch (error) {
      console.error("Error fetching field boundary:", error);
    }
  };

  // Trigger weather data fetch when needed
  useEffect(() => {
    if (taskType && dueDate && taskField && taskStatus === 2) {
      fetchOptimalTaskDate();
    } else {
      setOptimalDateTime(null);
      setInsights("");
    }
  }, [taskType, dueDate, taskField, taskStatus]);

  // Form Validation
  const validateForm = () => {
    if (!taskDescription || !taskStatus || !taskField || !taskType) {
      toast.warning("Please fill in all required fields.");
      return false;
    }
    if (taskStatus === 2 && !dueDate) {
      toast.warning("Due Date is required.");
      return false;
    }
    if (taskStatus === 2 && dueDate && new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
      toast.warning("Due Date cannot be in the past.");
      return false;
    }
    if (taskStatus === 1 && !completionDate) {
      toast.warning("Completion Date is required.");
      return false;
    }
    if (taskStatus === 1 && completionDate && new Date(completionDate) > new Date()) {
      toast.warning("Completion Date cannot be in the future.");
      return false;
    }
    return true;
  };

  // Create Task API Call
  const handleCreateTask = async () => {
    if (!validateForm()) return;

    const token = localStorage.getItem("accessToken");
    const taskData: any = {
      description: taskDescription,
      statusId: taskStatus,
      fieldId: taskField,
      typeId: parseInt(taskType),
    };

    if (dueDate) taskData.dueDate = new Date(dueDate);
    if (completionDate) taskData.completionDate = new Date(completionDate);

    try {
      await axios.post(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tasks`, taskData, {
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      });
      toast.success("Task created successfully.");
      window.location.href = `/fields/${taskField}`;
    } catch (error) {
      console.error("Error creating task:", error);
      toast.error("Failed to create task.");
    }
  };

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card title="Create a Task" className="mb-6">
          {/* Task Type Selection */}
          <Dropdown value={taskType} options={taskTypeOptions} onChange={(e) => setTaskType(e.value)} placeholder="Select Task Type" className="w-full mb-4" />

          {/* Description */}
          <InputTextarea value={taskDescription} onChange={(e) => setTaskDescription(e.target.value)} placeholder="Task Description" rows={3} className="w-full mb-4" />

          {/* Task Status Selection */}
          <Dropdown value={taskStatus} options={taskStatusOptions} onChange={(e) => setTaskStatus(e.value)} placeholder="Select Task Status" className="w-full mb-4" />

          {/* Field Selection */}
          {!fieldIdFromUrl && <Dropdown value={taskField} options={taskFieldOptions} onChange={(e) => setTaskField(e.value)} placeholder="Select Field" className="w-full mb-4" />}

          {/* Dates */}
          {taskStatus === 2 && <Calendar value={dueDate} onChange={(e) => setDueDate(e.value)} placeholder="Select Due Date" className="w-full mb-4" showIcon />}
          {taskStatus === 1 && <Calendar value={completionDate} onChange={(e) => setCompletionDate(e.value)} placeholder="Select Completion Date" className="w-full mb-4" showIcon />}

          {loading ? <ProgressSpinner /> : optimalDateTime && <p>🌦 Optimal Date: {optimalDateTime}</p>}
          {insights && <p>📌 Insights: {insights}</p>}

          {/* Create Task Button */}
          <Button label="Create Task" className="p-button-success w-full" onClick={handleCreateTask} />
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default TaskCreatePage;
