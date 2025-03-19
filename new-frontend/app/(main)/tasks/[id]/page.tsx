'use client';

import React, { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Card } from 'primereact/card';
import { Button } from 'primereact/button';
import { Tag } from 'primereact/tag';
import { InputTextarea } from 'primereact/inputtextarea';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Fieldset } from 'primereact/fieldset';
import { Divider } from 'primereact/divider';
import ProtectedRoute from '@/utils/ProtectedRoute';
import GoogleMapComponent from '../../../components/GoogleMapComponent';
import api from '@/utils/api';

interface Task {
    id: string;
    title: string;
    description: string;
    status: { name: string };
    field: {
        name: string;
        boundary?: {
            type: 'Feature';
            geometry: {
                type: 'Polygon';
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
    const taskId = Number(pathname.split('/').pop());
    const [task, setTask] = useState<Task | null>(null);
    const [comments, setComments] = useState<Comment[]>([]);
    const [commentContent, setCommentContent] = useState('');
    const [equipment, setEquipment] = useState<Equipment[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (taskId) {
            fetchTask();
            fetchComments();
            fetchEquipment();
        }
    }, [taskId]);

    const fetchTask = async () => {
        try {
            const response = await api.get(`/tasks/${taskId}`);
            setTask(response.data);
        } catch (error) {
            toast.error('Failed to load task.');
        } finally {
            setLoading(false);
        }
    };

    const fetchComments = async () => {
        try {
            const response = await api.get(`/tasks/${taskId}/comments`);
            setComments(response.data);
        } catch (error) {
            toast.error('Failed to fetch comments.');
        }
    };

    const fetchEquipment = async () => {
        try {
            const response = await api.get(`/tasks/${taskId}/equipment`);
            setEquipment(response.data);
        } catch (error) {
            toast.error('Failed to fetch equipment.');
        }
    };

    const handlePostComment = async () => {
        if (!commentContent.trim()) {
            toast.warning('Comment cannot be empty.');
            return;
        }

        try {
            await api.post(`/tasks/${taskId}/comments`, { taskId, content: commentContent });
            setCommentContent('');
            fetchComments();
        } catch (error) {
            toast.error('Failed to post comment.');
        }
    };

    const handleDeleteComment = async (commentId: string) => {
        try {
            await api.delete(`/tasks/${taskId}/comments/${commentId}`);
            setComments((prev) => prev.filter((comment) => comment.id !== commentId));
            toast.success('Comment deleted.');
        } catch (error) {
            toast.error('Failed to delete comment.');
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
                        <Tag value={task.status.name} severity={task.status.name === 'Pending' ? 'warning' : task.status.name === 'Completed' ? 'success' : 'danger'} />
                    </div>
                    <p className="text-lg font-semibold text-primary">
                        <i className="pi pi-map-marker text-green-500"></i> Field: <span className="text-xl font-bold text-green-700">{task.field.name}</span>
                    </p>
                    <p><strong>Type:</strong> {task.type.name}</p>
                    <p>{task.description}</p>
                    <p><strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-CA') : 'N/A'}</p>
                    <p><strong>Completion Date:</strong> {task.completionDate ? new Date(task.completionDate).toLocaleDateString('en-CA') : 'N/A'}</p>

                    <Divider />
                    {/* 🏗️ Equipment Section */}
                    <Fieldset legend="Equipment Used">
                        {equipment.length > 0 ? (
                            equipment.map((equip) => (
                                <div key={equip.id} className="border p-2 mb-2 rounded">
                                    <p><strong>Name:</strong> {equip.name}</p>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-500">No equipment assigned to this task.</p>
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
                </Card>

                {/* 💬 Comments Section */}
                <Card title="Comments" className="shadow-md border-round">
                    {comments.length > 0 ? (
                        comments.map(comment => (
                            <div key={comment.id} className="border p-2 mb-2 rounded">
                                <p>{comment.content}</p>
                                <p className="text-sm text-gray-500">{new Date(comment.createdAt).toLocaleString()}</p>
                                <Button icon="pi pi-trash" className="p-button-text p-button-danger" onClick={() => handleDeleteComment(comment.id)} />
                            </div>
                        ))
                    ) : (
                        <p className="text-gray-500">No comments yet.</p>
                    )}
                    <InputTextarea value={commentContent} onChange={(e) => setCommentContent(e.target.value)} rows={3} placeholder="Write a comment..." className="mt-2 w-full" />
                    <Button label="Post Comment" className="mt-2" onClick={handlePostComment} />
                </Card>
            </div>
        </ProtectedRoute>
    );
};

export default TaskPage;
