"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { Fieldset } from "primereact/fieldset";
import { Divider } from "primereact/divider";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";
import { MultiSelect } from "primereact/multiselect";
import ProtectedRoute from "@/utils/ProtectedRoute";
import GoogleMapComponent from "../../../components/GoogleMapComponent";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

interface Task {
  id: string;
  title: string;
  description: string;
  status: { name: string; id: number };
  field: {
    name: string;
    boundary?: {
      type: "Feature";
      geometry: {
        type: "Polygon";
        coordinates: number[][][];
      };
    };
  };
  type: { name: string };
  season?: { name: string };
  dueDate?: string;
  completionDate?: string;
  participants?: { id: number; farmMember: { user: { id: any; username: string } } }[];
  isParticipating?: boolean;
  statusId: number;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  createdBy?: { username: string };
}

interface Equipment {
  type: any;
  id: number;
  name: string;
  typeId: number;
  description: string | null;
}

const TaskPage = () => {
  const pathname = usePathname();
  const router = useRouter();
  const taskId = Number(pathname.split("/").pop());
  const { hasPermission } = usePermissions();

  // Load translations
  const t = useTranslations('common');
  const taskT = useTranslations('tasks');

  // State variables
  const [task, setTask] = useState<Task | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentContent, setCommentContent] = useState("");
  const [equipment, setEquipment] = useState<Equipment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [commentToDelete, setCommentToDelete] = useState<string | null>(null);
  const [availableEquipment, setAvailableEquipment] = useState<{ label: string; value: number }[]>([]);
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<number | null>(null);
  const [isEditingEquipment, setIsEditingEquipment] = useState(false);
  const [isEditingParticipants, setIsEditingParticipants] = useState(false);
  const [farmMembers, setFarmMembers] = useState<{ label: string; value: number }[]>([]);
  const [selectedParticipants, setSelectedParticipants] = useState<number[]>([]);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);
  const [minutesWorked, setMinutesWorked] = useState<number | null>(null);
  const [equipmentFuelData, setEquipmentFuelData] = useState<{ [key: number]: number }>({});
  const [weatherData, setWeatherData] = useState<any>(null);
  const [loadingWeather, setLoadingWeather] = useState(false);

  // Task status flags
  const isCompleted = task?.status.name === "Completed";
  const isCanceled = task?.status.name === "Canceled";
  const isPending = task?.status.name === "Pending";

  // Permission checks
  const canReadTasks = hasPermission("TASK_READ");
  const canComment = hasPermission("FIELD_TASK_COMMENT_CREATE");
  const canDeleteComment = hasPermission("FIELD_TASK_COMMENT_DELETE");
  const canViewEquipment = hasPermission("TASK_EQUIPMENT_READ");
  const canAssignEquipment = hasPermission("TASK_EQUIPMENT_ASSIGN");
  const canRemoveEquipment = hasPermission("TASK_EQUIPMENT_REMOVE");
  const canReadComments = hasPermission("FIELD_TASK_COMMENT_READ");
  const canAssignParticipants = hasPermission("TASK_ASSIGN_PARTICIPANTS");
  const canRemoveParticipants = hasPermission("TASK_REMOVE_PARTICIPANTS");
  const canReadParticipants = hasPermission("TASK_READ_PARTICIPANTS");

  // Load data on component mount
  useEffect(() => {
    if (!canReadTasks || !taskId) return;
    
    const load = async () => {
      const updatedTask = await fetchTask();
      if (canReadComments) fetchComments();
      if (canReadParticipants || canAssignParticipants) await fetchFarmMembers(updatedTask);
      if (canViewEquipment) initEquipment();
      if (updatedTask?.field.boundary) fetchWeatherData(updatedTask);
    };
    
    load();
  }, [taskId, canReadTasks]);

  const initEquipment = async () => {
    const eq = await fetchEquipment();
    if (canAssignEquipment) {
      await fetchAvailableEquipment(eq);
    }
  };

  const refreshTaskAndMembers = async () => {
    const updatedTask = await fetchTask();
    await fetchFarmMembers(updatedTask);
  };

  const fetchTask = async (): Promise<Task | undefined> => {
    try {
      setLoading(true);
      const response = await api.get(`/tasks/${taskId}`);
      setTask(response.data);
      return response.data;
    } catch (error) {
      toast.error(taskT('fetchTasksError'));
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/comments`);
      setComments(response.data);
    } catch (error) {
      toast.error("Failed to fetch comments.");
    }
  };

  const fetchFarmMembers = async (currentTask?: Task) => {
    try {
      const res = await api.get("/farm-members");
      const participantIds = new Set(
        (currentTask ?? task)?.participants?.map(p => p.farmMember.user.id)
      );
  
      const filtered = res.data
        .filter((m: any) => !participantIds.has(m.id))
        .map((m: any) => ({ label: m.username, value: m.id }));
  
      setFarmMembers(filtered);
    } catch (err) {
      toast.error("Failed to load farm members");
    }
  };  

  const fetchEquipment = async () => {
    try {
      const response = await api.get(`/tasks/${taskId}/equipment`);
      setEquipment(response.data);
      return response.data;
    } catch (error) {
      toast.error("Failed to fetch equipment.");
      return [];
    }
  };

  const fetchAvailableEquipment = async (existingEquipmentList?: Equipment[]) => {
    try {
      const allEquipmentRes = await api.get("/equipment");

      // Exclude already assigned
      const assignedIds = new Set((existingEquipmentList || equipment).map((e) => e.id));
      const available = allEquipmentRes.data
        .filter((equip: any) => !assignedIds.has(equip.id))
        .map((equip: any) => ({ label: equip.name, value: equip.id }));

      setAvailableEquipment(available);
    } catch (error) {
      toast.error("Failed to load available equipment.");
    }
  };

  const fetchWeatherData = async (currentTask?: Task) => {
    const taskToUse = currentTask || task;
    if (!taskToUse?.field.boundary?.geometry?.coordinates) return;
    
    setLoadingWeather(true);
    try {
      const coordinates = taskToUse.field.boundary.geometry.coordinates[0][0];
      const lat = coordinates[1];
      const lng = coordinates[0];
      
      const response = await api.get("/weather/forecast", {
        headers: {
          'x-coordinates-lat': lat.toString(),
          'x-coordinates-lng': lng.toString(),
        }
      });
      
      setWeatherData(response.data);
    } catch (error) {
      console.error("Failed to fetch weather data:", error);
    } finally {
      setLoadingWeather(false);
    }
  };

  const handleAssignEquipment = async () => {
    if (!selectedEquipmentId) {
      toast.warning("Please select equipment to assign.");
      return;
    }

    if (equipment.some(e => e.id === selectedEquipmentId)) {
      toast.warning("This equipment is already assigned.");
      return;
    }        

    try {
      await api.post(`/tasks/${taskId}/equipment`, { equipmentId: selectedEquipmentId });
      toast.success("Equipment assigned.");
      setSelectedEquipmentId(null);

      const updatedEquipment = await fetchEquipment();
      await fetchAvailableEquipment(updatedEquipment);

    } catch (error) {
      toast.error("Failed to assign equipment.");
    }
  };

  const handleAddParticipants = async () => {
    try {
      await Promise.all(
        selectedParticipants.map((userId) =>
          api.post(`/tasks/${taskId}/participants`, { userId })
        )
      );
      toast.success("Participants added");
      setSelectedParticipants([]);
      await refreshTaskAndMembers();
    } catch (err) {
      toast.error("Failed to assign participants");
    }
  };
    
  const handleRemoveParticipant = async (userId: number) => {
    try {
      await api.delete(`/tasks/${taskId}/participants/${userId}`);
      toast.success("Participant removed");
      await refreshTaskAndMembers();
    } catch (err) {
      toast.error("Failed to remove participant");
    }
  };  
  
  const handleRemoveEquipment = async (equipmentId: number) => {
    try {
      await api.delete(`/tasks/${taskId}/equipment/${equipmentId}`);
      toast.success("Equipment removed.");

      const updatedEquipment = await fetchEquipment();
      await fetchAvailableEquipment(updatedEquipment);
      
    } catch (error) {
      toast.error("Failed to remove equipment.");
    }
  };  

  const handlePostComment = async () => {
    if (!commentContent.trim()) {
      toast.warning("Comment cannot be empty.");
      return;
    }

    try {
      await api.post(`/tasks/${taskId}/comments`, { taskId, content: commentContent });
      setCommentContent("");
      fetchComments();
    } catch (error) {
      toast.error("Failed to post comment.");
    }
  };

  const confirmDeleteComment = (commentId: string) => {
    setCommentToDelete(commentId);
    setShowDeleteDialog(true);
  };
    
  const handleDeleteConfirmed = async () => {
    if (!commentToDelete) return;
    try {
      await api.delete(`/tasks/${taskId}/comments/${commentToDelete}`);
      setComments((prev) => prev.filter((comment) => comment.id !== commentToDelete));
      toast.success("Comment deleted.");
    } catch (error) {
      toast.error("Failed to delete comment.");
    } finally {
      setShowDeleteDialog(false);
      setCommentToDelete(null);
    }
  };
    
  const handleTaskAction = async (action: string) => {
    try {
      let url = `/tasks/${taskId}`;
      let method: 'post' | 'patch' = 'post';
      let payload = {};

      switch (action) {
        case 'participate':
          url = `/groups/${taskId}/task-participate`;
          break;
        case 'cancel-participation':
          url = `/groups/${taskId}/task-cancel-participation`;
          break;
        case 'cancel-task':
          method = 'patch';
          payload = { statusId: 3 }; // Task Canceled
          break;
        case 'uncancel-task':
          method = 'patch';
          payload = { statusId: 2 }; // Task Back to Pending
          break;
        default:
          toast.error('Invalid action.');
          return;
      }

      await (method === 'post' ? api.post(url, payload) : api.patch(url, payload));

      fetchTask();
      toast.success(`Task ${action.replace('-', ' ')} successfully.`);
    } catch (error) {
      toast.error(`Failed to ${action}.`);
    }
  };

  const handleMarkCompleted = async () => {
    if (!minutesWorked) {
      toast.warning("Please enter minutes worked.");
      return;
    }
    
    try {
      await api.patch(`/tasks/${taskId}/complete`, {
        minutesWorked,
        equipmentData: equipmentFuelData,
      });
    
      toast.success("Task marked as completed.");
      setShowCompleteDialog(false);
      fetchTask();
    } catch (error) {
      toast.error("Failed to mark task as completed.");
    }
  };

  const getStatusSeverity = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'pending': return 'warning';
      case 'canceled': return 'danger';
      default: return 'info';
    }
  };

  const getTaskTypeIcon = (typeName: string) => {
    // Using PrimeIcons for compatibility - these are built into PrimeReact
    const typeNameLower = typeName.toLowerCase();
    if (typeNameLower.includes("harvest") || typeNameLower.includes("derlius")) return "pi pi-shopping-bag";
    if (typeNameLower.includes("spray") || typeNameLower.includes("puršk")) return "pi pi-cloud";
    if (typeNameLower.includes("till") || typeNameLower.includes("ar")) return "pi pi-sort";
    if (typeNameLower.includes("fert") || typeNameLower.includes("trę")) return "pi pi-chart-bar";
    if (typeNameLower.includes("plant") || typeNameLower.includes("sėj") || typeNameLower.includes("sod")) return "pi pi-inbox";
    if (typeNameLower.includes("inspect") || typeNameLower.includes("tikrin")) return "pi pi-search";
    if (typeNameLower.includes("maint") || typeNameLower.includes("prieži")) return "pi pi-wrench";
    return "pi pi-check-square"; // Default icon
  };

  const getTaskTypeColor = (typeName: string) => {
    const typeNameLower = typeName.toLowerCase();
    if (typeNameLower.includes("harvest") || typeNameLower.includes("derlius")) return "bg-yellow-100 text-yellow-800";
    if (typeNameLower.includes("spray") || typeNameLower.includes("puršk")) return "bg-blue-100 text-blue-800";
    if (typeNameLower.includes("till") || typeNameLower.includes("ar")) return "bg-amber-100 text-amber-800";
    if (typeNameLower.includes("fert") || typeNameLower.includes("trę")) return "bg-green-100 text-green-800";
    if (typeNameLower.includes("plant") || typeNameLower.includes("sėj") || typeNameLower.includes("sod")) return "bg-teal-100 text-teal-800";
    if (typeNameLower.includes("inspect") || typeNameLower.includes("tikrin")) return "bg-purple-100 text-purple-800";
    if (typeNameLower.includes("maint") || typeNameLower.includes("prieži")) return "bg-indigo-100 text-indigo-800";
    return "bg-gray-100 text-gray-800"; // Default color
  };

  const getFormattedDate = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString("en-CA");
    } catch (error) {
      return null;
    }
  };

  const getFieldCenter = () => {
    if (task?.field.boundary?.geometry?.coordinates?.[0]?.[0]) {
      return { 
        lat: task.field.boundary.geometry.coordinates[0][0][1], 
        lng: task.field.boundary.geometry.coordinates[0][0][0] 
      };
    }
    return { lat: 55.1694, lng: 23.8813 }; // Default center
  };

  if (!canReadTasks) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6 text-center">
          <Card className="shadow-4">
            <div className="flex flex-column align-items-center p-5">
              <i className="pi pi-lock text-yellow-500 text-5xl mb-3"></i>
              <h3 className="text-xl font-semibold">{taskT('noPermission')}</h3>
              <p className="text-gray-600 mb-3">{taskT('contactAdmin')}</p>
              <Button
                label={taskT('backToDashboard')}
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

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-content-center align-items-center min-h-screen">
          <ProgressSpinner />
          <span className="ml-3 text-lg">Loading task details...</span>
        </div>
      </ProtectedRoute>
    );
  }

  if (!task) {
    return (
      <ProtectedRoute>
        <div className="container mx-auto p-6 text-center">
          <Card className="shadow-4">
            <div className="flex flex-column align-items-center p-5">
              <i className="pi pi-exclamation-triangle text-yellow-500 text-5xl mb-3"></i>
              <h3 className="text-xl font-semibold">{taskT('taskNotFound')}</h3>
              <Button
                label={taskT('backToTasks')}
                icon="pi pi-arrow-left"
                className="p-button-outlined mt-3"
                onClick={() => router.push('/tasks')}
              />
            </div>
          </Card>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container">
        <Card className="mb-4 shadow-3">
          {/* Task Header */}
          <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between mb-3">
            <div className="flex align-items-center">
              <Button 
                icon="pi pi-arrow-left" 
                className="p-button-rounded p-button-text mr-2" 
                onClick={() => router.push('/tasks')}
                tooltip={taskT('backToTasks')}
              />
              <div>
                <div className="flex align-items-center gap-2">
                  <div className={`flex align-items-center justify-content-center rounded-full p-2 ${getTaskTypeColor(task.type.name)}`} style={{width: "42px", height: "42px"}}>
                    <i className={`${getTaskTypeIcon(task.type.name)} text-xl`}></i>
                  </div>
                  <h1 className="text-2xl font-bold m-0">{task.type.name}</h1>
                  <Tag 
                    value={task.status.name} 
                    severity={getStatusSeverity(task.status.name)}
                    className="ml-2"
                  />
                </div>
                <div className="text-500 mt-1">
                  <i className="pi pi-map-marker text-green-500 mr-1"></i> {taskT('field')}: {task.field?.name}
                </div>
              </div>
            </div>
          </div>
          
          <Divider />

          {/* Map Component */}
          <div className="mb-4">
            <GoogleMapComponent center={getFieldCenter()} boundary={task.field?.boundary} />
          </div>
          
          <Divider />

          {/* Task Details */}
          <div className="grid mb-3">
            <div className="col-12 md:col-6 lg:col-4">
              {task.season && (
                <p className="mb-2">
                  <span className="font-semibold">{taskT('season')}:</span> {task.season.name}
                </p>
              )}
              
              {task.dueDate && (
                <p className="mb-2">
                  <span className="font-semibold">{taskT('dueDate')}:</span> {getFormattedDate(task.dueDate)}
                </p>
              )}
              
              {task.completionDate && (
                <p className="mb-2">
                  <span className="font-semibold">{taskT('completedDate')}:</span> {getFormattedDate(task.completionDate)}
                </p>
              )}
            </div>
            
            <div className="col-12 md:col-6 lg:col-8">
              {task.description && (
                <p>
                  <span className="font-semibold">{taskT('description')}:</span> {task.description}
                </p>
              )}
            </div>
          </div>

          {/* Task Actions */}
          <div className="flex flex-wrap gap-2 mb-4">
            {isPending && (
              <>
                {task.isParticipating ? (
                  <Button
                    label={taskT('cancelParticipation')}
                    icon="pi pi-times"
                    className="p-button-danger"
                    onClick={() => handleTaskAction("cancel-participation")}
                  />
                ) : (
                  <Button
                    label={taskT('participate')}
                    icon="pi pi-user-plus"
                    className="p-button-primary"
                    onClick={() => handleTaskAction("participate")}
                  />
                )}
                <Button
                  label={taskT('cancelTask')}
                  icon="pi pi-ban"
                  className="p-button-warning"
                  onClick={() => handleTaskAction("cancel-task")}
                />
                <Button
                  label={taskT('markCompleted')}
                  icon="pi pi-check"
                  className="p-button-success"
                  onClick={() => setShowCompleteDialog(true)}
                />
              </>
            )}

            {isCanceled && (
              <Button
                label={taskT('uncancelTask')}
                icon="pi pi-refresh"
                className="p-button-success"
                onClick={() => handleTaskAction("uncancel-task")}
              />
            )}
          </div>
          
          <Divider />

          {/* Equipment Section */}
          {canViewEquipment && (
            <Fieldset 
              legend={
                <div className="flex align-items-center">
                  <i className="pi pi-cog mr-2 text-purple-500"></i>
                  <span className="font-semibold">{taskT('equipment')}</span>
                </div>
              }
              toggleable 
              className="mb-4 border-1 border-300 shadow-2"
            >
              {equipment.length > 0 ? (
                <div className="grid gap-3">
                  {equipment.map((equip) => (
                    <div
                      key={equip.id}
                      className="col-12 md:col-6 lg:col-4"
                    >
                      <div className="flex justify-content-between items-center p-3 border-round shadow-1 bg-white h-full">
                        <div className="flex align-items-center">
                          <div className="flex justify-content-center align-items-center bg-purple-100 border-round mr-3" style={{ width: "2.5rem", height: "2.5rem" }}>
                            <i className="pi pi-cog text-purple-600 text-xl"></i>
                          </div>
                          <div>
                            <p className="font-semibold text-lg m-0">{equip.name}</p>
                            {equip.type?.name && <p className="text-600 m-0">{equip.type.name}</p>}
                          </div>
                        </div>
                        
                        {isEditingEquipment && canRemoveEquipment && isPending && (
                          <Button
                            icon="pi pi-trash"
                            className="p-button-rounded p-button-text p-button-danger"
                            onClick={() => handleRemoveEquipment(equip.id)}
                            tooltip={taskT('removeEquipment')}
                          />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-column align-items-center justify-content-center p-4">
                  <i className="pi pi-cog text-gray-300 text-4xl mb-3"></i>
                  <p className="text-lg text-gray-600 mb-3">{taskT('noEquipmentAssigned')}</p>
                </div>
              )}

              {isEditingEquipment && canAssignEquipment && isPending && (
                <div className="mt-3 p-3 surface-50 border-round">
                  <div className="flex flex-column md:flex-row gap-2">
                    <Dropdown
                      value={selectedEquipmentId}
                      options={availableEquipment}
                      onChange={(e) => setSelectedEquipmentId(e.value)}
                      placeholder={taskT('selectEquipment')}
                      className="w-full"
                      emptyMessage={taskT('noEquipmentAvailable')}
                    />
                    <Button
                      label={taskT('assign')}
                      icon="pi pi-plus"
                      onClick={handleAssignEquipment}
                      disabled={!selectedEquipmentId}
                    />
                  </div>
                </div>
              )}

              {(canAssignEquipment || canRemoveEquipment) && isPending && (
                <div className="flex justify-content-end mt-3">
                  <Button
                    label={isEditingEquipment ? taskT('doneEditing') : taskT('editEquipment')}
                    icon={isEditingEquipment ? "pi pi-check" : "pi pi-pencil"}
                    className={`p-button-outlined ${isEditingEquipment ? 'p-button-success' : 'p-button-primary'}`}
                    onClick={() => setIsEditingEquipment(!isEditingEquipment)}
                  />
                </div>
              )}
            </Fieldset>
          )}

          {/* Participants Section */}
          {canReadParticipants && (
            <Fieldset 
              legend={
                <div className="flex align-items-center">
                  <i className="pi pi-users mr-2 text-blue-500"></i>
                  <span className="font-semibold">{taskT('participants')}</span>
                </div>
              }
              toggleable 
              className="mb-4 border-1 border-300 shadow-2"
            >
              {task.participants && task.participants.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {task.participants.map((p) => (
                    <div
                      key={p.id}
                      className="flex align-items-center bg-gray-100 px-3 py-2 border-round shadow-1"
                    >
                      <i className="pi pi-user text-blue-500 mr-2"></i>
                      <span className="font-medium">{p.farmMember.user.username}</span>
                      
                      {isEditingParticipants && canRemoveParticipants && isPending && (
                        <Button
                          icon="pi pi-times"
                          className="p-button-rounded p-button-text p-button-danger ml-2 p-button-sm"
                          onClick={() => handleRemoveParticipant(p.farmMember.user.id)}
                          tooltip={taskT('removeParticipant')}
                        />
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-column align-items-center justify-content-center p-4">
                  <i className="pi pi-users text-gray-300 text-4xl mb-3"></i>
                  <p className="text-lg text-gray-600 mb-3">{taskT('noParticipants')}</p>
                </div>
              )}

              {isEditingParticipants && canAssignParticipants && isPending && (
                <div className="mt-3 p-3 surface-50 border-round">
                  <div className="flex flex-column md:flex-row gap-2">
                    <MultiSelect
                      value={selectedParticipants}
                      options={farmMembers}
                      onChange={(e) => setSelectedParticipants(e.value)}
                      placeholder={taskT('selectUsersToAssign')}
                      display="chip"
                      className="w-full"
                      emptyMessage={taskT('noMembersAvailable')}
                    />
                    <Button
                      label={taskT('assign')}
                      icon="pi pi-user-plus"
                      className="p-button-success"
                      onClick={handleAddParticipants}
                      disabled={!selectedParticipants.length}
                    />
                  </div>
                </div>
              )}

              {(canAssignParticipants || canRemoveParticipants) && isPending && (
                <div className="flex justify-content-end mt-3">
                  <Button
                    label={isEditingParticipants ? taskT('doneEditing') : taskT('editParticipants')}
                    icon={isEditingParticipants ? "pi pi-check" : "pi pi-pencil"}
                    className={`p-button-outlined ${isEditingParticipants ? 'p-button-success' : 'p-button-primary'}`}
                    onClick={() => setIsEditingParticipants(!isEditingParticipants)}
                  />
                </div>
              )}
              </Fieldset>
          )}

          {/* Comments Section */}
          {canReadComments && (
            <Card title={
              <div className="flex align-items-center">
                <i className="pi pi-comments mr-2 text-yellow-500"></i>
                <span className="font-semibold">{taskT('comments')}</span>
              </div>
            } className="shadow-3">
              {comments.length > 0 ? (
                comments.map(comment => (
                  <div key={comment.id} className="border p-3 mb-3 rounded shadow-1 flex justify-content-between align-items-start gap-3">
                    {canDeleteComment && isPending && (
                      <Button
                        icon="pi pi-trash"
                        className="p-button-text p-button-danger p-button-sm mt-1"
                        onClick={() => confirmDeleteComment(comment.id)}
                      />
                    )}
                    <div className="flex-1">
                      <div className="flex align-items-center mb-2">
                        <div className="flex justify-content-center align-items-center bg-blue-100 border-round mr-2" style={{ width: "2rem", height: "2rem" }}>
                          <i className="pi pi-user text-blue-600"></i>
                        </div>
                        <div>
                          <p className="font-bold m-0">{comment.createdBy?.username ?? "Unknown"}</p>
                          <p className="text-xs text-gray-500 m-0">
                            {new Date(comment.createdAt).toLocaleString('lt-LT', {
                              year: 'numeric',
                              month: '2-digit',
                              day: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                      <p className="whitespace-pre-wrap m-0 p-3 bg-gray-50 border-round">{comment.content}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-column align-items-center justify-content-center p-4 my-3">
                  <i className="pi pi-comments text-gray-300 text-4xl mb-3"></i>
                  <p className="text-lg text-gray-600">{taskT('noComments')}</p>
                </div>
              )}

              {canComment && isPending && (
                <div className="mt-3">
                  <div className="p-field">
                    <InputTextarea
                      value={commentContent}
                      onChange={(e) => setCommentContent(e.target.value)}
                      rows={3}
                      placeholder={taskT('writeComment')}
                      className="w-full mb-2"
                    />
                    <Button 
                      label={taskT('postComment')} 
                      icon="pi pi-send"
                      onClick={handlePostComment}
                      disabled={!commentContent.trim()}
                    />
                  </div>
                </div>
              )}
            </Card>
          )}
        </Card>
      </div>
      
      {/* Delete Comment Dialog */}
      <Dialog
        visible={showDeleteDialog}
        onHide={() => setShowDeleteDialog(false)}
        header={taskT('confirmDeletion')}
        footer={
          <>
            <Button label={t('cancel')} icon="pi pi-times" className="p-button-text" onClick={() => setShowDeleteDialog(false)} />
            <Button label={taskT('delete')} icon="pi pi-check" className="p-button-danger" onClick={handleDeleteConfirmed} />
          </>
        }
      >
        <div className="flex align-items-center gap-3">
          <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl"></i>
          <span>{taskT('confirmDeleteCommentPrompt')}</span>
        </div>
      </Dialog>
      
      {/* Complete Task Dialog */}
      <Dialog
        visible={showCompleteDialog}
        onHide={() => setShowCompleteDialog(false)}
        header={taskT('markTaskAsCompleted')}
        style={{ width: '450px' }}
        footer={
          <>
            <Button label={t('cancel')} icon="pi pi-times" className="p-button-text" onClick={() => setShowCompleteDialog(false)} />
            <Button
              label={taskT('submit')}
              icon="pi pi-check"
              className="p-button-success"
              disabled={!minutesWorked}
              onClick={handleMarkCompleted}
            />
          </>
        }
      >
        <div className="flex flex-column gap-4">
          <div className="p-field">
            <label className="font-bold mb-2 block">{taskT('minutesWorkedAllParticipants')}</label>
            <input
              type="number"
              value={minutesWorked ?? ''}
              onChange={(e) => setMinutesWorked(parseInt(e.target.value))}
              className="p-inputtext w-full p-3"
              placeholder="e.g., 90"
            />
          </div>

          {equipment
            .filter((e) => ["Tractor", "Combine Harvester", "Traktorius", "Kombainas"].includes(e.type?.name ?? ''))
            .map((equip) => (
              <div key={equip.id} className="p-field">
                <label className="font-bold mb-2 block">
                  {taskT('fuelUsedFor')} {equip.name} (liters):
                </label>
                <input
                  type="number"
                  value={equipmentFuelData[equip.id] ?? ''}
                  onChange={(e) =>
                    setEquipmentFuelData((prev) => ({
                      ...prev,
                      [equip.id]: parseFloat(e.target.value),
                    }))
                  }
                  className="p-inputtext w-full p-3"
                  placeholder="e.g., 12.5"
                />
              </div>
            ))}
        </div>
      </Dialog>
    </ProtectedRoute>
  );
};

export default TaskPage;