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
import { ProgressSpinner } from "primereact/progressspinner";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

const TaskCreatePage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const fieldIdFromUrl = Number(pathname.split("/").pop());

  const { hasPermission } = usePermissions();
  
  // Get translations
  const t = useTranslations('common');
  const ct = useTranslations('tasks');

  // Form state
  const [taskDescription, setTaskDescription] = useState("");
  const [taskStatus, setTaskStatus] = useState(null);
  const [taskFieldOptions, setTaskFieldOptions] = useState([]);
  const [taskField, setTaskField] = useState(fieldIdFromUrl || null);
  const [fieldName, setFieldName] = useState("");
  const [taskTypeOptions, setTaskTypeOptions] = useState<{ label: string; value: number }[]>([]);
  const [taskStatusOptions, setTaskStatusOptions] = useState([]);
  const [taskType, setTaskType] = useState("");
  const [dueDate, setDueDate] = useState<Date | null>(null);
  const [completionDate, setCompletionDate] = useState<Date | null>(null);
  const [optimalDateTime, setOptimalDateTime] = useState(null);
  const [insights, setInsights] = useState("");
  
  // UI state
  const [loading, setLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [loadingAI, setLoadingAI] = useState(false);
  const [loadingOptimalDate, setLoadingOptimalDate] = useState(false);
  
  // Equipment and season state
  const [equipmentList, setEquipmentList] = useState<{ label: string; value: number }[]>([]);
  const [selectedEquipment, setSelectedEquipment] = useState<number[]>([]);
  const [seasonOptions, setSeasonOptions] = useState<{ label: string; value: number; startDate?: string; endDate?: string }[]>([]);
  const [selectedSeason, setSelectedSeason] = useState<number | null>(null);
  
  // Voice recognition
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const [isRecommendedDateUsed, setIsRecommendedDateUsed] = useState(false);

  const canCreateTasks = hasPermission("TASK_CREATE");

  useEffect(() => {
    if (!canCreateTasks) return;
    
    const initPage = async () => {
      setLoading(true);
      await Promise.all([
        fetchOptions(),
        fetchUserEquipment(),
        fetchSeasons()
      ]);
      setLoading(false);
    };
    
    initPage();
  }, [canCreateTasks]);

  useEffect(() => {
    if (fieldIdFromUrl && canCreateTasks) {
      fetchFieldName();
    }
  }, [fieldIdFromUrl, canCreateTasks]);

  useEffect(() => {
    if (taskTypeOptions.length && taskStatusOptions.length) {
      const stored = localStorage.getItem("pendingTaskData");
      if (stored) {
        const parsed = JSON.parse(stored);
  
        setTaskDescription(parsed.description || "");
  
        if (parsed.fieldId) setTaskField(parsed.fieldId);
  
        const spraying = taskTypeOptions.find((t: { label: string; value: number }) => t.label.toLowerCase().includes("purškimas"));
        if (spraying) setTaskType(spraying.value);
  
        const pending = taskStatusOptions.find(s => s.label.toLowerCase() === "pending");
        if (pending) setTaskStatus(pending.value);
  
        localStorage.removeItem("pendingTaskData");
      }
    }
  }, [taskTypeOptions, taskStatusOptions]);
  
  const getSelectedSeasonDetails = () => {
    return seasonOptions.find((s) => s.value === selectedSeason);
  };
  
  const fetchFieldName = async () => {
    try {
      const response = await api.get(`/fields/${fieldIdFromUrl}`);
      setFieldName(response.data.name);
    } catch (error) {
      console.error("Error fetching field name:", error);
    }
  };

  const fetchOptions = async () => {
    try {
      const promises = [
        api.get("/task-type-options"),
        api.get("/task-status-options")
      ];
      
      if (!fieldIdFromUrl) {
        promises.push(api.get("/fields"));
      }
      
      const responses = await Promise.all(promises);
      
      setTaskTypeOptions(responses[0].data.map((type: any) => ({ 
        label: type.name, 
        value: type.id 
      })));
      
      setTaskStatusOptions(
        responses[1].data
          .filter((option: any) => option.name.toLowerCase() !== "canceled")
          .map((status: any) => ({ 
            label: status.name, 
            value: status.id 
          }))
      );
      
      if (!fieldIdFromUrl && responses[2]) {
        setTaskFieldOptions(responses[2].data.map((field: any) => ({ 
          label: field.name, 
          value: field.id 
        })));
      }
    } catch (error) {
      toast.error(ct('fetchOptionsError') || "Failed to load options.");
    }
  };

  const fetchWeatherInsights = async (lat: number, lon: number) => {
    setLoadingOptimalDate(true);
    try {
      const response = await api.get("/weather/optimal-date", {
        params: { lat, lon, dueDate, taskType },
      });
      setOptimalDateTime(response.data.optimalDateTime);
      setInsights(response.data.insights);
    } catch (error) {
      console.error("Error fetching weather insights:", error);
      toast.error(ct('fetchWeatherError') || "Failed to get weather insights.");
    } finally {
      setLoadingOptimalDate(false);
    }
  };

  const fetchSeasons = async () => {
    try {
      const res = await api.get("/seasons");
  
      setSeasonOptions(res.data.map((season: any) => ({
        label: season.name,
        value: season.id,
        ...season, 
      })));
  
      if (res.data.length > 0) setSelectedSeason(res.data[0].id);
    } catch (err) {
      toast.error(ct('fetchSeasonsError') || "Failed to load seasons.");
    }
  };

  const fetchUserEquipment = async () => {
    try {
      const response = await api.get("/equipment");
      setEquipmentList(response.data.map((equip: any) => ({ 
        label: equip.name, 
        value: equip.id 
      })));
    } catch (error) {
      toast.error(ct('fetchEquipmentError') || "Failed to load equipment.");
    }
  };

  const fetchOptimalTaskDate = async () => {
    try {
      const response = await api.get(`/fields/${taskField}`);
      const boundary = response.data.boundary;
      
      if (boundary?.geometry?.coordinates?.[0]?.[0]) {
        const [lon, lat] = boundary.geometry.coordinates[0][0];
        console.log("Successfully extracted coordinates:", lon, lat);
        fetchWeatherInsights(lat, lon);
      } else {
        console.log("Boundary data doesn't have the expected structure:", boundary);
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

  const validateForm = () => {
    if (!taskDescription || !taskStatus || !taskField || !taskType || !selectedEquipment.length || !selectedSeason) {
      toast.warning(ct('requiredFieldsWarning') || "Please fill in all required fields.");
      return false;
    }
    
    if (taskStatus === 2 && !dueDate) {
      toast.warning(ct('dueDateRequired') || "Due Date is required.");
      return false;
    }
    
    if (taskStatus === 2 && dueDate && new Date(dueDate).setHours(0, 0, 0, 0) < new Date().setHours(0, 0, 0, 0)) {
      toast.warning(ct('dueDatePastError') || "Due Date cannot be in the past.");
      return false;
    }
    
    if (taskStatus === 1 && !completionDate) {
      toast.warning(ct('completionDateRequired') || "Completion Date is required.");
      return false;
    }
    
    if (taskStatus === 1 && completionDate && new Date(completionDate) > new Date()) {
      toast.warning(ct('completionDateFutureError') || "Completion Date cannot be in the future.");
      return false;
    }

    const season = getSelectedSeasonDetails();
    const start = season?.startDate ? new Date(season.startDate) : null;
    const end = season?.endDate ? new Date(season.endDate) : null;

    if (taskStatus === 2 && dueDate) {
      const due = new Date(dueDate);
      if ((start && due < start) || (end && due > end)) {
        toast.warning(ct('dueDateOutsideSeasonError') || `Due date must be between ${start ? start.toLocaleDateString('lt-LT') : "unknown"} and ${end ? end.toLocaleDateString('lt-LT') : "unknown"} for selected season.`);
        return false;
      }
    }

    if (taskStatus === 1 && completionDate) {
      const complete = new Date(completionDate);
      if ((start && complete < start) || (end && complete > end)) {
        toast.warning(ct('completionDateOutsideSeasonError') || `Completion date must be between ${start ? start.toLocaleDateString('lt-LT') : "unknown"} and ${end ? end.toLocaleDateString('lt-LT') : "unknown"} for selected season.`);
        return false;
      }
    }

    return true;
  };

  const handleCreateTask = async () => {
    if (!canCreateTasks) return;
    if (!validateForm()) return;

    setLoading(true);
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
        toast.success(ct('createSuccess') || "Task created successfully.");
        router.push(`/fields/${taskField}`);
    } catch (error) {
        toast.error(ct('createError') || "Failed to create task.");
        setLoading(false);
    }
  };

   const startVoiceRecognition = () => {
    if (!("webkitSpeechRecognition" in window)) {
      toast.error(ct('browserSupportError') || "Speech recognition not supported in this browser.");
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
      toast.success(ct('voiceInputReceived') || "Voice input received. Processing...");
      refineDescriptionWithAI(speechText);
    };
    recognition.onerror = () => {
      setIsRecording(false);
      toast.error(ct('speechRecognitionError') || "Speech recognition error. Try again.");
    };
    recognition.onend = () => setIsRecording(false);

    recognition.start();
  };

  const stopVoiceRecognition = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsRecording(false);
      toast.info(ct('recordingStopped') || "Voice recording stopped.");
    }
  };

  const refineDescriptionWithAI = async (rawText: string) => {
    setLoadingAI(true);
    try {
      const response = await api.post("/ai/task-description", { rawText });
      setTaskDescription(response.data.refinedTaskDescription);
      toast.success(ct('aiOptimizedDescription') || "AI optimized the description.");
    } catch (error) {
      toast.error(ct('aiOptimizationError') || "Failed to refine description.");
    }
    setLoadingAI(false);
  };

  const getTranslatedStatusOptions = () => {
    if (!taskStatusOptions.length) return [];
    
    return taskStatusOptions.map(option => {
      const statusKey = option.label.toLowerCase();
      const translatedLabel = 
        statusKey === "pending" ? ct('taskStatusPending') :
        statusKey === "completed" ? ct('taskStatusCompleted') :
        statusKey === "canceled" ? ct('taskStatusCanceled') :
        option.label;
        
      return {
        ...option,
        label: translatedLabel
      };
    });
  };

  if (!canCreateTasks) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6">
          <Card className="shadow-4">
            <div className="flex flex-column align-items-center py-5">
              <i className="pi pi-lock text-yellow-500 text-5xl mb-4"></i>
              <h3 className="text-xl font-semibold mb-2">{ct('noPermission')}</h3>
              <p className="text-gray-600 mb-4">{ct('contactAdmin') || "Please contact your administrator for access."}</p>
              <Button 
                label={ct('backToDashboard') || "Back to Dashboard"} 
                icon="pi pi-home" 
                className="p-button-outlined"
                onClick={() => router.push('/dashboard')}
              />
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading && !taskTypeOptions.length) {
    return (
      <ProtectedRoute>
        <div className="flex justify-content-center align-items-center min-h-screen">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
          <span className="ml-3 text-lg">{ct('loading') || "Loading..."}</span>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-6">
        <Card 
          title={
            <div className="flex align-items-center">
              <i className="pi pi-plus-circle text-green-500 mr-2"></i>
              <span>{ct('title')}</span>
            </div>
          } 
          className="shadow-4"
        >
          <div className="grid">
            <div className="col-12">
              <div className="p-fluid">
                {/* Task Type */}
                <div className="field mb-4">
                  <label htmlFor="taskType" className="block font-medium mb-2">
                    {ct('taskType')} <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="taskType" 
                    value={taskType}
                    options={taskTypeOptions}
                    onChange={(e) => setTaskType(e.value)}
                    placeholder={ct('selectTaskType')}
                    className="w-full"
                  />
                </div>

                {/* Task Description with Voice Button */}
                <div className="field mb-4">
                  <label htmlFor="description" className="block font-medium mb-2">
                    {ct('description')} <span className="text-red-500">*</span>
                  </label>
                  <div className="p-inputgroup">
                    <InputTextarea
                      id="description"
                      value={taskDescription}
                      onChange={(e) => setTaskDescription(e.target.value)}
                      placeholder={ct('descriptionPlaceholder') || "Enter task description"}
                      rows={4}
                      className="w-full"
                    />
                    <span className="p-inputgroup-addon">
                      <Button
                        icon={isRecording ? "pi pi-stop" : "pi pi-microphone"}
                        className={isRecording ? "p-button-danger" : "p-button-secondary"}
                        onClick={isRecording ? stopVoiceRecognition : startVoiceRecognition}
                        tooltip={isRecording ? ct('stopRecording') : ct('startRecording')}
                      />
                    </span>
                  </div>
                </div>

                {/* AI Processing Loader */}
                {loadingAI && (
                  <div className="flex align-items-center justify-content-center my-2 p-3 bg-blue-50 border-round">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                    <span className="ml-3 text-blue-800">{ct('processingVoice')}</span>
                  </div>
                )}

                {/* Task Status */}
                <div className="field mb-4">
                  <label htmlFor="taskStatus" className="block font-medium mb-2">
                    {ct('taskStatus')} <span className="text-red-500">*</span>
                  </label>
                  <Dropdown
                    id="taskStatus"
                    value={taskStatus}
                    options={getTranslatedStatusOptions()}
                    onChange={(e) => setTaskStatus(e.value)}
                    placeholder={ct('selectTaskStatus')}
                    className="w-full"
                  />
                </div>

                <div className="grid">
                  <div className="col-12 md:col-6">
                    {/* Field Selection */}
                    <div className="field mb-4">
                      <label htmlFor="field" className="block font-medium mb-2">
                        {ct('field')} <span className="text-red-500">*</span>
                      </label>
                      {fieldIdFromUrl ? (
                        <div className="p-inputtext w-full p-3 bg-gray-100 border-round">
                          {fieldName || ct('fieldSelectedFromUrl') || "Field selected from URL"}
                        </div>
                      ) : (
                        <Dropdown
                          id="field"
                          value={taskField}
                          options={taskFieldOptions}
                          onChange={(e) => setTaskField(e.value)}
                          placeholder={ct('selectField')}
                          className="w-full"
                          emptyMessage={ct('noFieldsAvailable') || "No fields available"}
                        />
                      )}
                    </div>
                  </div>

                  <div className="col-12 md:col-6">
                    {/* Season Selection */}
                    <div className="field mb-4">
                      <label htmlFor="season" className="block font-medium mb-2">
                        {ct('season')} <span className="text-red-500">*</span>
                      </label>
                      <Dropdown
                        id="season"
                        value={selectedSeason}
                        options={seasonOptions}
                        onChange={(e) => setSelectedSeason(e.value)}
                        placeholder={ct('selectSeason')}
                        className="w-full"
                        emptyMessage={ct('noSeasonsAvailable') || "No seasons available"}
                      />
                    </div>
                  </div>
                </div>

                {/* Date Selection */}
                <div className="grid">
                  <div className="col-12 md:col-6">
                    {/* Date Section */}
                    {(taskStatus === 1 || taskStatus === 2) && (
                      <div className="field mb-4">
                        <label htmlFor="date" className="block font-medium mb-2">
                          {taskStatus === 1 ? ct('completedDate') : ct('dueDate')} <span className="text-red-500">*</span>
                        </label>
                        
                        {taskStatus === 2 ? (
                          <Calendar
                            id="dueDate"
                            value={dueDate}
                            onChange={(e) => {
                              setDueDate(e.value);
                              setIsRecommendedDateUsed(false);
                            }}
                            placeholder={ct('selectDueDate') || "Select due date"}
                            className="w-full"
                            showIcon
                            dateFormat="yy-mm-dd"
                          />
                        ) : (
                          <Calendar
                            id="completionDate"
                            value={completionDate}
                            onChange={(e) => setCompletionDate(e.value)}
                            placeholder={ct('selectCompletionDate') || "Select completion date"}
                            className="w-full"
                            showIcon
                            dateFormat="yy-mm-dd"
                          />
                        )}
                      </div>
                    )}
                  </div>

                  <div className="col-12 md:col-6">
                    {/* Recommended Date Section */}
                    {optimalDateTime && taskStatus === 2 && (
                      <div className="field mb-4">
                        <label className="block font-medium mb-2">
                          {ct('recommendedDate')} <i className="pi pi-info-circle text-blue-500"></i>
                        </label>
                        <div className="flex align-items-center">
                          <div className="p-inputtext flex-1 p-3 bg-blue-50 border-round flex align-items-center justify-content-between">
                            <span className="font-semibold">{new Date(optimalDateTime).toLocaleDateString("lt-LT")}</span>
                            <Button
                              icon="pi pi-check"
                              className="p-button-sm p-button-outlined p-button-success"
                              onClick={() => {
                                setDueDate(new Date(optimalDateTime));
                                setIsRecommendedDateUsed(true);
                              }}
                              tooltip={ct('useRecommendedDate')}
                            />
                          </div>
                        </div>
                        {insights && (
                          <small className="text-blue-600 mt-1 block">
                            <i className="pi pi-info-circle mr-1"></i> {insights}
                          </small>
                        )}
                      </div>
                    )}
                    
                    {loadingOptimalDate && (
                      <div className="field mb-4 flex align-items-center">
                        <ProgressSpinner style={{ width: '20px', height: '20px' }} />
                        <span className="ml-2 text-sm text-blue-600">{ct('calculatingOptimalDate')}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Equipment Selection */}
                <div className="field mb-4">
                  <label htmlFor="equipment" className="block font-medium mb-2">
                    {ct('selectEquipment')} <span className="text-red-500">*</span>
                  </label>
                  <MultiSelect
                    id="equipment"
                    value={selectedEquipment}
                    options={equipmentList}
                    onChange={(e) => setSelectedEquipment(e.value)}
                    placeholder={ct('selectEquipmentPlaceholder') || "Select required equipment"}
                    className="w-full"
                    display="chip"
                    emptyMessage={ct('noEquipmentAvailable') || "No equipment available"}
                    emptyFilterMessage={ct('noMatchingEquipment') || "No matching equipment found"}
                  />
                </div>
              </div>
              
              {/* Create Task Button */}
              <div className="flex justify-content-end mt-4">
                <Button
                  label={ct('createTask')}
                  icon="pi pi-check"
                  className="p-button-success p-button-lg"
                  onClick={handleCreateTask}
                  disabled={loading || loadingAI}
                  loading={loading}
                />
              </div>
            </div>
          </div>
        </Card>
      </div>
    </ProtectedRoute>
  );
};

export default TaskCreatePage;