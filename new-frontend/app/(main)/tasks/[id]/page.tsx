"use client";

import React, { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { InputTextarea } from "primereact/inputtextarea";
import { ProgressSpinner } from "primereact/progressspinner";
import { Fieldset } from "primereact/fieldset";
import { Divider } from "primereact/divider";
import ProtectedRoute from "@/utils/ProtectedRoute";
import GoogleMapComponent from "../../../components/GoogleMapComponent";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { Dialog } from "primereact/dialog";
import { Dropdown } from "primereact/dropdown";

interface Task {
    id: string;
    title: string;
    description: string;
    status: { name: string };
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
    dueDate?: string;
    completionDate?: string;
    participants?: { id: string; username: string }[];
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
    id: number;
    name: string;
    typeId: number;
    description: string | null;
}

const TaskPage = () => {
    const pathname = usePathname();
    const taskId = Number(pathname.split("/").pop());
    const { hasPermission, permissions } = usePermissions();

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

    const canReadTasks = hasPermission("TASK_READ");
    const canComment = hasPermission("FIELD_TASK_COMMENT_CREATE");
    const canDeleteComment = hasPermission("FIELD_TASK_COMMENT_DELETE");
    const canViewEquipment = hasPermission("TASK_EQUIPMENT_READ");
    const canAssignEquipment = hasPermission("TASK_EQUIPMENT_ASSIGN");
    const canRemoveEquipment = hasPermission("TASK_EQUIPMENT_REMOVE");
    const canReadComments = hasPermission("FIELD_TASK_COMMENT_READ");

    useEffect(() => {
        if (!canReadTasks || !taskId) return;

        fetchTask();
        if (canReadComments) fetchComments();
        if (canViewEquipment) fetchEquipment();
        if (canAssignEquipment) fetchAvailableEquipment();
    }, [permissions, taskId]);

    const fetchTask = async () => {
        try {
            const response = await api.get(`/tasks/${taskId}`);
            setTask(response.data);
        } catch (error) {
            toast.error("Failed to load task.");
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

    const fetchEquipment = async () => {
        try {
            const response = await api.get(`/tasks/${taskId}/equipment`);
            setEquipment(response.data);
        } catch (error) {
            toast.error("Failed to fetch equipment.");
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
    
    const handleRemoveEquipment = async (equipmentId: number) => {
        try {
            await api.delete(`/tasks/${taskId}/equipment/${equipmentId}`);
            toast.success("Equipment removed.");
            fetchEquipment();
            fetchAvailableEquipment();
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

    if (!canReadTasks) {
        return (
            <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                🚫 You do not have permission to view tasks.
            </div>
        );
    }

   if (loading) return <ProgressSpinner />;
    if (!task) return <div className="text-center text-lg">Task not found.</div>;

    const fieldCenter = task.field?.boundary?.geometry?.coordinates?.[0]?.[0]
        ? { lat: task.field?.boundary?.geometry?.coordinates[0][0][1], lng: task.field?.boundary?.geometry?.coordinates[0][0][0] }
        : { lat: 55.1694, lng: 23.8813 };

    return (
        <ProtectedRoute>
            <div className="container">
                <Card title={task.title} className="mb-4 shadow-md border-round">
                    <Divider />

                    {/* Google Map Component */}
                    <Card>
                        <GoogleMapComponent center={fieldCenter} boundary={task.field?.boundary} />
                    </Card>

                    <Divider />

                    <div className="flex align-items-center justify-content-between">
                        <Tag
                            value={task.status.name}
                            severity={
                                task.status.name === "Pending" ? "warning" :
                                task.status.name === "Completed" ? "success" :
                                "danger"
                            }
                        />
                    </div>

                    <p className="text-lg font-semibold text-primary">
                        <i className="pi pi-map-marker text-green-500"></i> Field:{" "}
                        <span className="text-xl font-bold text-green-700">{task.field.name}</span>
                    </p>
                    <p><strong>Type:</strong> {task.type.name}</p>
                    <p>{task.description}</p>
                    {task.dueDate && (
                    <p><strong>Due Date:</strong> {new Date(task.dueDate).toLocaleDateString("en-CA")}</p>
                    )}

                    {task.completionDate && (
                    <p><strong>Completion Date:</strong> {new Date(task.completionDate).toLocaleDateString("en-CA")}</p>
                    )}

                    <Divider />

                    <Fieldset legend="Equipment Used">
    {equipment.length > 0 ? (
        <div className="grid gap-3">
            {equipment.map((equip) => (
                <div
                    key={equip.id}
                    className="flex justify-between items-center border border-gray-300 p-3 rounded shadow-sm bg-white"
                >
                    <p className="font-semibold text-gray-800">
                        <i className="pi pi-cog text-purple-500 mr-2"></i>
                        {equip.name}
                    </p>
                    {isEditingEquipment && canRemoveEquipment && (
                        <Button
                            icon="pi pi-trash"
                            className="p-button-text p-button-danger"
                            onClick={() => handleRemoveEquipment(equip.id)}
                            tooltip="Remove Equipment"
                        />
                    )}
                </div>
            ))}
        </div>
    ) : (
        <p className="text-gray-500">No equipment assigned to this task.</p>
    )}

    {isEditingEquipment && canAssignEquipment && (
        <div className="mt-4 flex gap-2">
            <Dropdown
                value={selectedEquipmentId}
                options={availableEquipment}
                onChange={(e) => setSelectedEquipmentId(e.value)}
                placeholder="Select Equipment"
                className="w-full"
            />
            <Button
                label="Assign"
                icon="pi pi-plus"
                onClick={handleAssignEquipment}
                disabled={!selectedEquipmentId}
            />
        </div>
    )}

    {(canAssignEquipment || canRemoveEquipment) && (
        <div className="flex justify-end mt-4">
            <Button
                label={isEditingEquipment ? "Cancel Editing" : "Edit Equipment"}
                icon={isEditingEquipment ? "pi pi-times" : "pi pi-pencil"}
                className="p-button-outlined p-button-primary"
                onClick={() => setIsEditingEquipment(!isEditingEquipment)}
            />
        </div>
    )}
</Fieldset>


                    <Divider />

                    {/* 👥 Participants */}
                    <Fieldset legend="Participants">
                        {task.participants && task.participants.length > 0 ? (
                            task.participants.map(participant => (
                                <span key={participant.id} className="mr-2">{participant.username} <i className="pi pi-user text-gray-500"></i></span>
                            ))
                        ) : (
                            <p className="text-gray-500">No participants yet.</p>
                        )}
                    </Fieldset>

                    <div className="flex gap-3 mt-3">
                        {task.isParticipating ? (
                            <Button label="Cancel Participation" className="p-button-danger" onClick={() => handleTaskAction('cancel-participation')} />
                        ) : (
                            <Button label="Participate" className="p-button-primary" onClick={() => handleTaskAction('participate')} />
                        )}
                        {task.statusId === 2 && <Button label="Cancel Task" className="p-button-warning" onClick={() => handleTaskAction('cancel-task')} />}
                        {task.statusId === 3 && <Button label="Uncancel Task" className="p-button-success" onClick={() => handleTaskAction('uncancel-task')} />}
                    </div>

                    <Divider />

                    {/* 💬 Comments Section */}
                    {canReadComments && (
                        <Card title="Comments" className="shadow-md border-round">
                           {comments.length > 0 ? (
                                comments.map(comment => (
                                    <div key={comment.id} className="border p-2 mb-2 rounded flex justify-between items-start gap-3">
                                    {canDeleteComment && (
                                        <Button
                                        icon="pi pi-trash"
                                        className="p-button-text p-button-danger mt-1"
                                        onClick={() => confirmDeleteComment(comment.id)}
                                        />
                                    )}
                                    <div className="flex-1">
                                        <p className="font-bold">{comment.createdBy?.username ?? "Unknown"}</p>
                                        <p className="whitespace-pre-wrap">{comment.content}</p>
                                        <p className="text-xs text-gray-500 mt-1">
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
                                ))
                                ) : (
                                <p className="text-gray-500">No comments yet.</p>
                                )}
                            {canComment && (
                                <>
                                    <InputTextarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} rows={3} placeholder="Write a comment..." className="mt-2 w-full" />
                                    <Button label="Post Comment" className="mt-2" onClick={handlePostComment} />
                                </>
                            )}
                        </Card>
                    )}
                </Card>
            </div>
            <Dialog
                visible={showDeleteDialog}
                onHide={() => setShowDeleteDialog(false)}
                header="Confirm Deletion"
                footer={
                    <>
                    <Button label="Cancel" icon="pi pi-times" className="p-button-text" onClick={() => setShowDeleteDialog(false)} />
                    <Button label="Delete" icon="pi pi-check" className="p-button-danger" onClick={handleDeleteConfirmed} />
                    </>
                }
                >
                <p>Are you sure you want to delete this comment?</p>
            </Dialog>
        </ProtectedRoute>
    );
};

export default TaskPage;