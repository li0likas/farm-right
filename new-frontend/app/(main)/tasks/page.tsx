'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { toast } from 'sonner';
import { DataView } from 'primereact/dataview';
import { Button } from 'primereact/button';
import { TabMenu } from 'primereact/tabmenu';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import Image from 'next/image';
import taskImage from '@/public/images/taskImage.png';
import { isLoggedIn } from "@/utils/auth";
import ProtectedRoute from "@/utils/ProtectedRoute";

interface Task {
    id: string;
    title: string;
    status: { name: string };
    field: { name: string };
    dueDate?: string;
    completionDate?: string;
}

const TasksPage = () => {
    const router = useRouter();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<string>('Pending');

    useEffect(() => {
        if (!isLoggedIn()) {
            toast.error('Unauthorized. Login first.');
            return;
        }
        fetchTasks();
    }, []);

    const fetchTasks = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');
            if (!accessToken) return;

            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tasks`, {
                headers: { Authorization: `Bearer ${accessToken}` }
            });
            setTasks(response.data);
            filterTasks(response.data, activeTab);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks.');
        }
    };

    const filterTasks = (taskList: Task[], status: string) => {
        setFilteredTasks(taskList.filter(task => task.status.name === status));
    };

    const handleTabChange = (e: any) => {
        const newStatus = e.value.label;
        setActiveTab(newStatus);
        filterTasks(tasks, newStatus);
    };

    const tabItems = [
        { label: 'Pending', icon: 'pi pi-clock' },
        { label: 'Completed', icon: 'pi pi-check' },
        { label: 'Canceled', icon: 'pi pi-times' }
    ];

    const dataviewListItem = (task: Task) => {
        return (
            <div className="col-12">
                <Card title={task.title} className="mb-3 shadow-md border-round">
                    <div className="flex align-items-center">
                        <Image src={taskImage} alt="Task Image" width={100} height={100} className="rounded-lg" />
                        <div className="ml-4">
                            {/* ✅ Styled Field Name with Better Typography */}
                            <p className="text-lg font-semibold text-primary">
                                <i className="pi pi-map-marker text-green-500"></i> Field: <span className="text-xl font-bold text-green-700">{task.field.name}</span>
                            </p>

                            <p className="text-sm text-gray-700"><i className="pi pi-calendar"></i> Due: {task.dueDate ? new Date(task.dueDate).toLocaleDateString('en-CA') : 'N/A'}</p>
                            {task.completionDate && <p className="text-sm text-gray-700"><i className="pi pi-check-circle"></i> Completed: {new Date(task.completionDate).toLocaleDateString('en-CA')}</p>}
                            <Tag value={task.status.name} severity={task.status.name === 'Pending' ? 'warning' : task.status.name === 'Completed' ? 'success' : 'danger'} />
                        </div>
                    </div>
                    <Button label="View Task" icon="pi pi-eye" className="p-button-secondary mt-3" onClick={() => router.push(`/tasks/${task.id}`)} />
                </Card>
            </div>
        );
    };

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        {/* ✅ Moved Create Task Button Above the Tabs */}
                        <div className="flex justify-end mb-3">
                            <Button label="Create Task" icon="pi pi-plus" className="p-button-success" onClick={() => router.push('/create-task')} />
                        </div>

                        {/* ✅ Task Filters (Tabs) */}
                        <TabMenu model={tabItems} activeIndex={tabItems.findIndex((tab) => tab.label === activeTab)} onTabChange={handleTabChange} />

                        {/* ✅ Task List - Removed Pagination */}
                        <DataView value={filteredTasks} layout="list" itemTemplate={dataviewListItem} />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default TasksPage;
