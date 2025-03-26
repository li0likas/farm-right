"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataView } from "primereact/dataview";
import { Button } from "primereact/button";
import { TabMenu } from "primereact/tabmenu";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import Image from "next/image";
import taskImage from "@/public/images/taskImage.png";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext"; // ✅ Import Permissions Context

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
    const { hasPermission, permissions } = usePermissions();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<string>("Pending");

    // ✅ Permission Helpers
    const canReadTasks = hasPermission("TASK_READ");
    const canCreateTask = hasPermission("TASK_CREATE");
    const canViewTaskDetails = hasPermission("TASK_READ");

    useEffect(() => {
        if (!canReadTasks) return;
        fetchTasks();
    }, [permissions]);

    const fetchTasks = async () => {
        try {
            const response = await api.get("/tasks");
            setTasks(response.data);
            filterTasks(response.data, activeTab);
        } catch (error) {
            toast.error("Failed to fetch tasks.");
        }
    };

    const filterTasks = (taskList: Task[], status: string) => {
        setFilteredTasks(taskList.filter((task) => task.status.name === status));
    };

    const handleTabChange = (e: any) => {
        const newStatus = e.value.label;
        setActiveTab(newStatus);
        filterTasks(tasks, newStatus);
    };

    const tabItems = [
        { label: "Pending", icon: "pi pi-clock" },
        { label: "Completed", icon: "pi pi-check" },
        { label: "Canceled", icon: "pi pi-times" },
    ];

    const dataviewListItem = (task: Task) => (
        <div className="col-12">
            <Card title={task.title} className="mb-3 shadow-md border-round">
                <div className="flex align-items-center">
                    <Image src={taskImage} alt="Task Image" width={100} height={100} className="rounded-lg" />
                    <div className="ml-4">
                        <p className="text-lg font-semibold text-primary">
                            <i className="pi pi-map-marker text-green-500"></i> Field:{" "}
                            <span className="text-xl font-bold text-green-700">{task.field.name}</span>
                        </p>
                        {task.dueDate && (
                            <p className="text-sm text-gray-700">
                                <i className="pi pi-calendar"></i> Due:{" "}
                                {new Date(task.dueDate).toLocaleDateString("en-CA")}
                            </p>
                        )}

                        {task.completionDate && (
                            <p className="text-sm text-gray-700">
                                <i className="pi pi-check-circle"></i> Completed:{" "}
                                {new Date(task.completionDate).toLocaleDateString("en-CA")}
                            </p>
                        )}
                        <Tag
                            value={task.status.name}
                            severity={
                                task.status.name === "Pending"
                                    ? "warning"
                                    : task.status.name === "Completed"
                                    ? "success"
                                    : "danger"
                            }
                        />
                    </div>
                </div>
                {canViewTaskDetails && (
                    <Button
                        label="View Task"
                        icon="pi pi-eye"
                        className="p-button-secondary mt-3"
                        onClick={() => router.push(`/tasks/${task.id}`)}
                    />
                )}
            </Card>
        </div>
    );

    if (!canReadTasks) {
        return (
            <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                🚫 You do not have permission to view tasks.
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="flex justify-end mb-3">
                            {canCreateTask && (
                                <Button
                                    label="Create Task"
                                    icon="pi pi-plus"
                                    className="p-button-success"
                                    onClick={() => router.push("/create-task")}
                                />
                            )}
                        </div>

                        <TabMenu
                            model={tabItems}
                            activeIndex={tabItems.findIndex((tab) => tab.label === activeTab)}
                            onTabChange={handleTabChange}
                        />

                        <DataView value={filteredTasks} layout="list" itemTemplate={dataviewListItem} />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default TasksPage;
