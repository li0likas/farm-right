// new-frontend/app/(main)/create-task/[[...id]]/page.tsx
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
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl"; // Import this

const TaskCreatePage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const fieldIdFromUrl = Number(pathname.split("/").pop());

  const { hasPermission } = usePermissions();
  
  // Get translations
  const t = useTranslations('common');
  const ct = useTranslations('tasks');

  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState(null);
  const [taskFieldOptions, setTaskFieldOptions] = useState([]);
  const [taskField, setTaskField] = useState(fieldIdFromUrl || null);
  const [taskTypeOptions, setTaskTypeOptions] = useState([]);
  const [taskStatusOptions, setTaskStatusOptions] = useState([]);
  const [taskType, setTaskType] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [completionDate, setCompletionDate] = useState(null);
  const [optimalDateTime, setOptimalDateTime] = useState(null);
  const [insights, setInsights] = useState("");
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [equipmentList, setEquipmentList] = useState<{ label: string; value: number }[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
  const [seasonOptions, setSeasonOptions] = useState<{ label: string; value: number; startDate?: string; endDate?: string }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isRecommendedDateUsed, setIsRecommendedDateUsed] = useState(false);

  useEffect(() => {
    if (!hasPermission("TASK_CREATE")) return;
    fetchOptions();
    fetchUserEquipment();
    fetchSeasons();
  }, [hasPermission]);

  useEffect(() => {
    if (taskTypeOptions.length && taskStatusOptions.length) {
      const stored = localStorage.getItem("pendingTaskData");
      if (stored) {
        const parsed = JSON.parse(stored);
  
        setTaskDescription(parsed.description || "");
  
        if (parsed.fieldId) setTaskField(parsed.fieldId);
  
        // ✅ Set "Spraying" task type if available
        const spraying = taskTypeOptions.find(t => t.label.toLowerCase().includes("purškimas"));
        if (spraying) setTaskType(spraying.value);
  
        // ✅ Set "Pending" task status if available
        const pending = taskStatusOptions.find(s => s.label.toLowerCase() === "pending");
        if (pending) setTaskStatus(pending.value);
  
        localStorage.removeItem("pendingTaskData");
      }
    }
  }, [taskTypeOptions, taskStatusOptions]);
  
  const getSelectedSeasonDetails = () => {
    return seasonOptions.find((s) => s.value === selectedSeason);
  };
  
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

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
  
      setSeasonOptions(res.data.map((season: any) => ({
        label: season.name,
        value: season.id,
        ...season, // ✅ keep startDate, endDate for validation
      })));
  
      if (res.data.length > 0) setSelectedSeason(res.data[0].id);
    } catch (err) {
      toast.error("Failed to load seasons.");
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
    if (taskType && dueDate && taskField && taskStatus === 2 && !isRecommendedDateUsed) {
      fetchOptimalTaskDate();
    } else {
      setOptimalDateTime(null);
      setInsights("");
    }
  }, [taskType, dueDate, taskField, taskStatus]);


  // Form Validation
  const validateForm = () => {
    if (!taskDescription || !taskStatus || !taskField || !taskType || !selectedEquipment.length || !selectedSeason) {
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

    const season = getSelectedSeasonDetails();
    const start = season?.startDate ? new Date(season.startDate) : null;
    const end = season?.endDate ? new Date(season.endDate) : null;

    if (taskStatus === 2 && dueDate) {
      const due = new Date(dueDate);
      if ((start && due < start) || (end && due > end)) {
        toast.warning(`Due date must be between ${start ? start.toLocaleDateString('lt-LT') : "unknown"} and ${end ? end.toLocaleDateString('lt-LT') : "unknown"} for selected season.`);
        return false;
      }
    }

    if (taskStatus === 1 && completionDate) {
      const complete = new Date(completionDate);
      if ((start && complete < start) || (end && complete > end)) {
        toast.warning(`Completion date must be between ${start ? start.toLocaleDateString('lt-LT') : "unknown"} and ${end ? end.toLocaleDateString('lt-LT') : "unknown"} for selected season.`);
        return false;
      }
    }

    return true;
  };

  const handleCreateTask = async () => {
    if (!hasPermission("TASK_CREATE")) return;
    if (!validateForm()) return;

    const taskData: any = {
        description: taskDescription,
        statusId: taskStatus,
        fieldId: taskField,
        typeId: parseInt(taskType),
        equipmentIds: selectedEquipment,
        seasonId: selectedSeason,
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
                  {ct('noPermission')}
              </div>
          </ProtectedRoute>
      );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card title={ct('title')} className="mb-6">
          {/* Task Type Selection */}
          <h5>{ct('taskType')}</h5>
          <Dropdown value={taskType} options={taskTypeOptions} onChange={(e) => setTaskType(e.value)} placeholder={ct('selectTaskType')} className="w-full mb-4" />

          {/* 🎤 Task Description with Voice Button */}
          <h5>{ct('description')}</h5>
          <div className="flex align-items-center gap-2 mb-4">
            <InputTextarea
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              placeholder={ct('description')}
              rows={3}
              className="w-full"
            />
            <Button
              icon={isRecording ? "pi pi-stop" : "pi pi-microphone"}
              className={isRecording ? "p-button-danger" : "p-button-primary"}
              onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
              tooltip={isRecording ? ct('stopRecording') : ct('startRecording')}
            />
          </div>

          {/* 🔄 AI Processing Loader */}
          {loadingAI && (
            <div className="flex justify-content-center my-2">
              <ProgressSpinner />
              <span className="ml-2">{ct('processingVoice')}</span>
            </div>
          )}

          {/* Task Status Selection */}
          <h5>{ct('taskStatus')}</h5>
          <Dropdown value={taskStatus} options={taskStatusOptions} onChange={(e) => setTaskStatus(e.value)} placeholder={ct('selectTaskStatus')} className="w-full mb-4" />

          {/* Field Selection */}
          <h5>{ct('field')}</h5>
          {!fieldIdFromUrl && <Dropdown value={taskField} options={taskFieldOptions} onChange={(e) => setTaskField(e.value)} placeholder={ct('selectField')} className="w-full mb-4" />}

          {/* Season Selection */}
          <h5>{ct('season')}</h5>
          {(
            <Dropdown
              value={selectedSeason}
              options={seasonOptions}
              onChange={(e) => setSelectedSeason(e.value)}
              placeholder={ct('selectSeason')}
              className="w-full mb-4"
            />
          )}

          {/* Date Heading */}
          {(taskStatus === 1 || taskStatus === 2) && (
            <div className="mb-2 mt-3">
              <h5>
                {taskStatus === 1 ? ct('completedDate') : ct('dueDate')}
              </h5>
            </div>
          )}

          {/* Due Date Selection */}
          {taskStatus === 2 && <Calendar
            value={dueDate}
            onChange={(e) => {
              setDueDate(e.value);
              setIsRecommendedDateUsed(false); // mark as manual input
            }}
            placeholder={ct('dueDate')}
            className="w-full mb-4"
            showIcon
          />
          }

          {/* Completion Date Selection */}
          {taskStatus === 1 && <Calendar value={completionDate} onChange={(e) => setCompletionDate(e.value)} placeholder={ct('completedDate')} className="w-full mb-4" showIcon />}

          {/* ✅ Equipment Selection (Multi-Select Dropdown) */}
          <div className="mb-4">
            <h5>{ct('selectEquipment')}</h5>
            <MultiSelect
              value={selectedEquipment}
              options={equipmentList}
              onChange={(e) => setSelectedEquipment(e.value)}
              placeholder={ct('selectEquipment')}
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
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3 mb-3">
                  <div className="flex align-items-center gap-2">
                    <i className="pi pi-calendar text-blue-500 text-lg"></i>
                    <span className="font-bold text-lg text-blue-700">
                      {ct('recommendedDate')}:{" "}
                      <span className="text-2xl">{new Date(optimalDateTime).toLocaleDateString("lt-LT")}</span>
                    </span>
                  </div>
                  <Button
                    label={ct('useRecommendedDate')}
                    icon="pi pi-check"
                    className="p-button-outlined"
                    onClick={() => {
                      setDueDate(new Date(optimalDateTime));
                      setIsRecommendedDateUsed(true);
                    }}
                  />
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
          <Button
            label={ct('createTask')}
            className="p-button-success w-full"
            onClick={handleCreateTask}
            disabled={loading || loadingAI}
          />
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default TaskCreatePage;