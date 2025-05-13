"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { DataView } from "primereact/dataview";
import { Button } from "primereact/button";
import { TabMenu } from "primereact/tabmenu";
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

// Import custom icons libraries (if needed)
// import { FaTractor, FaSprayCan, FaSeedling, FaEye } from "react-icons/fa";
// import { GiWheat, GiWateringCan, GiFarmTractor } from "react-icons/gi";

interface Task {
    id: string;
    title: string;
    status: { name: string };
    field: { name: string };
    type: { name: string };
    dueDate?: string;
    completionDate?: string;
    season?: { id: number };
}

const TasksPage = () => {
    const router = useRouter();
    const { hasPermission, permissions } = usePermissions();

    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [activeTab, setActiveTab] = useState<string>("All");
    const [seasons, setSeasons] = useState<{ id: number | null; name: string }[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);

    const canReadTasks = hasPermission("TASK_READ");
    const canCreateTask = hasPermission("TASK_CREATE");
    const canViewTaskDetails = hasPermission("TASK_READ");

    // Import translations
    const t = useTranslations('common');  
    const taskT = useTranslations('tasks');

    useEffect(() => {
        if (!canReadTasks) return;
        fetchTasks();
        fetchSeasons();
    }, [permissions]);

    useEffect(() => {
        filterTasks(tasks, activeTab, selectedSeasonId);
    }, [tasks, activeTab, selectedSeasonId]);

    const fetchTasks = async () => {
        try {
            const response = await api.get("/tasks");
            setTasks(response.data);
        } catch (error) {
            toast.error(taskT('fetchTasksError'));
        }
    };

    const fetchSeasons = async () => {
        try {
            const res = await api.get("/seasons");
            setSeasons([{ id: null, name: taskT('allSeasons') }, ...res.data]);
        } catch {
            toast.error(taskT('fetchSeasonsError'));
        }
    };

    const filterTasks = (all: Task[], status: string, seasonId: number | null) => {
        let result = status === "All" ? all : all.filter(t => t.status.name === status);
        if (seasonId !== null) result = result.filter(t => t.season?.id === seasonId);

        result.sort((a, b) => {
            const dateA = new Date(a.dueDate ?? a.completionDate ?? 0).getTime();
            const dateB = new Date(b.dueDate ?? b.completionDate ?? 0).getTime();
            return dateB - dateA;
        });

        setFilteredTasks(result);
    };

    const handleTabChange = (e: any) => {
        const newStatus = tabItems[e.index].label;
        setActiveTab(newStatus);
    };

    // Helper to get the appropriate icon based on task type
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

    // Helper to get background color for task card based on type
    const getTaskCardBg = (typeName: string) => {
        const typeNameLower = typeName.toLowerCase();
        if (typeNameLower.includes("harvest") || typeNameLower.includes("derlius")) return "bg-yellow-50";
        if (typeNameLower.includes("spray") || typeNameLower.includes("puršk")) return "bg-blue-50";
        if (typeNameLower.includes("till") || typeNameLower.includes("ar")) return "bg-amber-50";
        if (typeNameLower.includes("fert") || typeNameLower.includes("trę")) return "bg-green-50";
        if (typeNameLower.includes("plant") || typeNameLower.includes("sėj") || typeNameLower.includes("sod")) return "bg-teal-50";
        if (typeNameLower.includes("inspect") || typeNameLower.includes("tikrin")) return "bg-purple-50";
        if (typeNameLower.includes("maint") || typeNameLower.includes("prieži")) return "bg-indigo-50";
        return "bg-gray-50"; // Default background
    };
      
    const getTaskIconColor = (typeName: string) => {
        const typeNameLower = typeName.toLowerCase();
        if (typeNameLower.includes("harvest") || typeNameLower.includes("derlius")) return "text-yellow-700";
        if (typeNameLower.includes("spray") || typeNameLower.includes("puršk")) return "text-blue-600";
        if (typeNameLower.includes("till") || typeNameLower.includes("ar")) return "text-amber-800";
        if (typeNameLower.includes("fert") || typeNameLower.includes("trę")) return "text-green-600";
        if (typeNameLower.includes("plant") || typeNameLower.includes("sėj") || typeNameLower.includes("sod")) return "text-teal-600";
        if (typeNameLower.includes("inspect") || typeNameLower.includes("tikrin")) return "text-purple-600";
        if (typeNameLower.includes("maint") || typeNameLower.includes("prieži")) return "text-indigo-600";
        return "text-gray-700"; // Default icon color
    };

    // Translate the status name
    const getTranslatedStatus = (statusName: string) => {
        const statusKey = statusName.toLowerCase();
        return statusKey === "pending" ? taskT('taskStatusPending') :
            statusKey === "completed" ? taskT('taskStatusCompleted') :
            statusKey === "canceled" ? taskT('taskStatusCanceled') :
            statusName;
    };

    const tabItems = [
        { label: 'All', icon: "pi pi-list", displayLabel: taskT('all') },
        { label: 'Pending', icon: "pi pi-clock", displayLabel: taskT('taskStatusPending') },
        { label: 'Completed', icon: "pi pi-check", displayLabel: taskT('taskStatusCompleted') },
        { label: 'Canceled', icon: "pi pi-times", displayLabel: taskT('taskStatusCanceled') }
    ];

    const dataviewListItem = (task: Task) => (
        <div className="col-12">
            <Card className={`mb-3 shadow-sm border-round ${getTaskCardBg(task.type.name)}`}>
                <div className="flex align-items-center">
                    <div className={`flex align-items-center justify-content-center mr-4 border-circle p-3 ${getTaskCardBg(task.type.name)} shadow-1`} style={{ width: "60px", height: "60px" }}>
                        <i className={`${getTaskTypeIcon(task.type.name)} text-4xl ${getTaskIconColor(task.type.name)}`}></i>
                    </div>
                    <div className="flex-1">
                        <h3 className={`text-xl font-bold mb-1 ${getTaskIconColor(task.type.name)}`}>
                            {task.type.name}
                        </h3>
                        <p className="text-sm text-gray-600 mb-2">
                            <i className="pi pi-map-marker text-green-500 mr-1"></i> {task.field.name}
                        </p>
                        {(task.dueDate || task.completionDate) && (
                            <p className="text-xs text-gray-500">
                                <i className="pi pi-calendar mr-1"></i> 
                                {task.dueDate 
                                    ? `${taskT('dueDate')}: ${new Date(task.dueDate).toLocaleDateString('lt-LT')}`
                                    : `${taskT('completedDate')}: ${new Date(task.completionDate!).toLocaleDateString('lt-LT')}`}
                            </p>
                        )}
                        <div className="mt-2">
                            <Tag
                                value={getTranslatedStatus(task.status.name)}
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
                            icon="pi pi-eye"
                            className="p-button-text p-button-rounded"
                            onClick={() => router.push(`/tasks/${task.id}`)}
                            tooltip={taskT('viewTask')}
                        />
                    )}
                </div>
            </Card>
        </div>
    );

    if (!canReadTasks) {
        return (
            <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                {taskT('noPermission')}
            </div>
        );
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <div className="card">
                        <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center mb-3">
                            <h2 className="text-2xl font-bold m-0 p-0 text-primary">{taskT('pageTitle')}</h2>
                            
                            {canCreateTask && (
                                <Button
                                    label={taskT('createTask')}
                                    icon="pi pi-plus"
                                    className="p-button-success mt-2 md:mt-0"
                                    onClick={() => router.push("/create-task")}
                                />
                            )}
                        </div>

                        <div className="flex flex-wrap gap-2 mb-3">
                            {seasons.map((season) => (
                                <Button
                                    key={season.id ?? "all"}
                                    label={season.name}
                                    className={`p-button-sm ${
                                        selectedSeasonId === season.id ? "p-button-info" : "p-button-outlined"
                                    }`}
                                    onClick={() => setSelectedSeasonId(season.id)}
                                />
                            ))}
                        </div>

                        <TabMenu
                            model={tabItems.map(item => ({ ...item, label: item.displayLabel }))}
                            activeIndex={tabItems.findIndex(tab => tab.label === activeTab)}
                            onTabChange={handleTabChange}
                            className="mb-3"
                        />

                        {filteredTasks.length === 0 ? (
                            <div className="p-4 text-center">
                                <i className="pi pi-inbox text-gray-400 text-5xl mb-3"></i>
                                <p className="text-gray-500">{taskT('noTasksAvailable')}</p>
                            </div>
                        ) : (
                            <DataView value={filteredTasks} layout="list" itemTemplate={dataviewListItem} />
                        )}
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
};

export default TasksPage;