"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
import { Calendar } from "primereact/calendar";
import { InputTextarea } from "primereact/inputtextarea";
import { MultiSelect } from "primereact/multiselect";
import ProtectedRoute from "@/utils/ProtectedRoute";
import { ProgressSpinner } from "primereact/progressspinner";
import api from "@/utils/api"; // ✅ Use API instance with interceptor
import { usePermissions } from "@/context/PermissionsContext"; // ✅ Import Permissions Context

const TaskCreatePage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const fieldIdFromUrl = Number(pathname.split("/").pop());

  const { hasPermission, permissions } = usePermissions();

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
  const [isRecording, setIsRecording] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [equipmentList, setEquipmentList] = useState<{ label: string; value: number }[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    if (!hasPermission("TASK_CREATE")) return;
    fetchOptions();
    fetchUserEquipment();
}, [permissions]);

  // Fetch dropdown options for fields, task types, and statuses
  const fetchOptions = async () => {
    try {
      if (!fieldIdFromUrl) {
        const fieldsResponse = await api.get("/fields");
        setTaskFieldOptions(fieldsResponse.data.map((field: any) => ({ label: field.name, value: field.id })));
      }

      const [taskTypesResponse, taskStatusResponse] = await Promise.all([
        api.get("/task-type-options"),
        api.get("/task-status-options"),
      ]);

      setTaskTypeOptions(taskTypesResponse.data.map((type: any) => ({ label: type.name, value: type.id })));
      setTaskStatusOptions(
        taskStatusResponse.data
          .filter((option: any) => option.name.toLowerCase() !== "canceled")
          .map((status: any) => ({ label: status.name, value: status.id }))
      );
    } catch (error) {
      toast.error("Failed to load options.");
    }
  };

  // Fetch weather insights and optimal task time
  const fetchWeatherInsights = async (lat: number, lon: number) => {
    setLoading(true);
    try {
      const response = await api.get("/weather/optimal-date", {
        params: { lat, lon, dueDate, taskType },
      });
      setOptimalDateTime(response.data.optimalDateTime);
      setInsights(response.data.insights);
    } catch (error) {
      console.error("Error fetching weather insights:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserEquipment = async () => {
    try {
      const response = await api.get("/equipment");
      setEquipmentList(response.data.map((equip: any) => ({ label: equip.name, value: equip.id })));
    } catch (error) {
      toast.error("Failed to load equipment.");
    }
  };

  // Fetch field boundary and get optimal task date
  const fetchOptimalTaskDate = async () => {
    try {
      const response = await api.get(`/fields/${taskField}`);
      const boundary = response.data.boundary;
      if (boundary?.coordinates?.length) {
        const [lon, lat] = boundary.coordinates[0][0];
        fetchWeatherInsights(lat, lon);
      }
    } catch (error) {
      console.error("Error fetching field boundary:", error);
    }
  };

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
    if (!taskDescription || !taskStatus || !taskField || !taskType || !selectedEquipment.length) {
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

  const handleCreateTask = async () => {
    if (!hasPermission("TASK_CREATE")) return;
    if (!validateForm) {
      toast.warning("Please fill in all required fields.");
      return;
    }

    const taskData: any = {
        description: taskDescription,
        statusId: taskStatus,
        fieldId: taskField,
        typeId: parseInt(taskType),
        equipmentIds: selectedEquipment,
    };

    if (dueDate) taskData.dueDate = new Date(dueDate);
    if (completionDate) taskData.completionDate = new Date(completionDate);

    try {
        await api.post("/tasks", taskData);
        toast.success("Task created successfully.");
        router.push(`/fields/${taskField}`);
    } catch (error) {
        toast.error("Failed to create task.");
    }
  };

   // 🎤 Start voice recording
   const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error("Speech recognition not supported in this browser.");
      return;
    }
    const recognition = new window.webkitSpeechRecognition();
    recognition.lang = "lt-LT"; // Lithuanian language
    recognition.continuous = false;
    recognition.interimResults = false;

    recognitionRef.current = recognition;

    recognition.onstart = () => setIsRecording(true);
    recognition.onresult = (event) => {
      const speechText = event.results[0][0].transcript;
      setTaskDescription(speechText);
      toast.success("Voice input received. Processing...");
      refineDescriptionWithAI(speechText);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error("Speech recognition error. Try again.");
    };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  // ⏹️ Stop voice recognition
  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.info("Voice recording stopped.");
    }
  };

  // 🔄 Send raw text to AI for refinement
  const refineDescriptionWithAI = async (rawText: string) => {
    setLoadingAI(true);
    try {
      const response = await api.post("/ai/task-description", { rawText });
      setTaskDescription(response.data.refinedTaskDescription);
      toast.success("AI optimized the description.");
    } catch (error) {
      toast.error("Failed to refine description.");
    }
    setLoadingAI(false);
  };

  if (!hasPermission("TASK_CREATE")) {
      return (
          <ProtectedRoute>
              <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                  🚫 You do not have permission to create tasks.
              </div>
          </ProtectedRoute>
      );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card title="Create a Task" className="mb-6">
          {/* Task Type Selection */}
          <Dropdown value={taskType} options={taskTypeOptions} onChange={(e) => setTaskType(e.value)} placeholder="Select Task Type" className="w-full mb-4" />

          {/* 🎤 Task Description with Voice Button */}
          <div className="flex align-items-center gap-2 mb-4">
            <InputTextarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder="Task Description"
              rows={3}
              className="w-full"
            />
            <Button
              icon={isRecording ? "pi pi-stop" : "pi pi-microphone"}
              className={isRecording ? "p-button-danger" : "p-button-primary"}
              onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
              tooltip={isRecording ? "Stop recording" : "Start recording"}
            />
          </div>

          {/* 🔄 AI Processing Loader */}
          {loadingAI && (
            <div className="flex justify-content-center my-2">
              <ProgressSpinner />
            </div>
          )}

          {/* Task Status Selection */}
          <Dropdown value={taskStatus} options={taskStatusOptions} onChange={(e) => setTaskStatus(e.value)} placeholder="Select Task Status" className="w-full mb-4" />

          {/* Field Selection */}
          {!fieldIdFromUrl && <Dropdown value={taskField} options={taskFieldOptions} onChange={(e) => setTaskField(e.value)} placeholder="Select Field" className="w-full mb-4" />}

          {/* Due Date Selection */}
          {taskStatus === 2 && <Calendar value={dueDate} onChange={(e) => setDueDate(e.value)} placeholder="Select Due Date" className="w-full mb-4" showIcon />}

          {/* Completion Date Selection */}
          {taskStatus === 1 && <Calendar value={completionDate} onChange={(e) => setCompletionDate(e.value)} placeholder="Select Completion Date" className="w-full mb-4" showIcon />}

          {/* ✅ Equipment Selection (Multi-Select Dropdown) */}
          <div className="mb-4">
            <h5>Select Equipment</h5>
            <MultiSelect
              value={selectedEquipment}
              options={equipmentList}
              onChange={(e) => setSelectedEquipment(e.value)}
              placeholder="Select Equipment"
              className="w-full"
              display="chip"
            />
          </div>

          {/* Display Loading Spinner When Fetching Data */}
          {loading && (
            <div className="flex justify-content-center my-4">
              <ProgressSpinner />
            </div>
          )}

          {!loading && (optimalDateTime || insights) && (
            <div className="p-3 mt-4 border-round shadow-2 surface-100">
              {/* 🌦 Optimal Date Display */}
              {optimalDateTime && (
                <div className="flex align-items-center gap-2 mb-3">
                  <i className="pi pi-calendar text-blue-500 text-lg"></i>
                  <span className="font-bold text-lg text-blue-700">
                    Recommended date for this task: <span className="text-2xl">{new Date(optimalDateTime).toLocaleDateString('lt-LT')}</span>
                  </span>
                </div>
              )}

              {/* 📌 Weather Insights Display */}
              {insights && (
                <div className="flex align-items-start gap-2">
                  <i className="pi pi-info-circle text-green-500 text-lg"></i>
                  <span className="text-md text-gray-700">{insights}</span>
                </div>
              )}
            </div>
          )}

          {/* Create Task Button */}
          <Button label="Create Task" className="p-button-success w-full" onClick={handleCreateTask} />
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default TaskCreatePage;