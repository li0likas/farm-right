'use client';

import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { PieChart } from "@mui/x-charts/PieChart";
import { toast } from "sonner";
import Link from "next/link";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api"; // ✅ API instance with interceptor
import { usePermissions } from "@/context/PermissionsContext"; // ✅ Import PermissionsContext

interface Task {
    id: string;
    title: string;
    status: { name: string };
    field: { name: string };
    dueDate?: string;
    completionDate?: string;
}

const Dashboard = () => {
    const { hasPermission } = usePermissions();

    // ✅ Permission checks
    const canReadTasks = hasPermission("TASK_READ");
    const canReadTaskStats = hasPermission("TASK_STATS_READ");
    const canReadFields = hasPermission("FIELD_TOTAL_AREA_READ");

    const [tasks, setTasks] = useState<Task[]>([]);
    const [totalFieldArea, setTotalFieldArea] = useState(0);
    const [completedPercentage, setCompletedPercentage] = useState(0);

    useEffect(() => {
        if (canReadFields) fetchFieldData();
        if (canReadTasks) {
            fetchTasks();
        } else if (canReadTaskStats) {
            fetchTaskStats();
        }
    }, [canReadTasks, canReadTaskStats, canReadFields]);

    const fetchTasks = async () => {
        try {
            const response = await api.get("/tasks");

            const sortedTasks = response.data.sort((a: Task, b: Task) => {
                const dateA = a.dueDate || a.completionDate;
                const dateB = b.dueDate || b.completionDate;
                return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
            });

            setTasks(sortedTasks);

            // Calculate completion percentage locally
            const completedTasksCount = sortedTasks.filter((task: { status: { name: string; }; }) => task.status.name === "Completed").length;
            const totalTasksCount = sortedTasks.length;
            const percentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

            setCompletedPercentage(percentage);
        } catch (error) {
            toast.error("Failed to fetch tasks.");
        }
    };

    const fetchTaskStats = async () => {
        try {
            const response = await api.get("/tasks/stats");
            const { completedTasks, totalTasks } = response.data;
            const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            setCompletedPercentage(percentage);
        } catch (error) {
            toast.error("Failed to fetch task statistics.");
        }
    };

    const fetchFieldData = async () => {
        try {
            const response = await api.get("/fields/total-area");
            setTotalFieldArea(response.data.totalArea);
        } catch (error) {
            toast.error("Failed to fetch field area.");
        }
    };

    return (
        <ProtectedRoute>
            <div className="grid">
                
                {/* 📌 Task Completion */}
                {(canReadTaskStats || canReadTasks) && (
                    <div className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Task Completion</span>
                                    <div className="text-900 font-medium text-xl">{completedPercentage.toFixed(0)}%</div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: "2.5rem", height: "2.5rem" }}>
                                    <i className="pi pi-check text-green-500 text-xl" />
                                </div>
                            </div>
                            <PieChart
                                slotProps={{ legend: { hidden: true } }}
                                series={[
                                    {
                                        data: [
                                            { id: 0, value: completedPercentage, color: "#61E9B1", label: "Completed" },
                                            { id: 1, value: 100 - completedPercentage, color: "#e1e1e1", label: "Not done" },
                                        ],
                                        innerRadius: 20,
                                        outerRadius: 30,
                                        paddingAngle: 0,
                                        cornerRadius: 5,
                                        startAngle: 0,
                                        endAngle: 360,
                                        cx: 70,
                                    },
                                ]}
                                height={70}
                            />
                        </div>
                    </div>
                )}

                {/* 📌 Total Field Area */}
                {canReadFields && (
                    <div className="col-12 lg:col-6 xl:col-3">
                        <div className="card mb-0">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">Total Field Area</span>
                                    <div className="text-900 font-medium text-xl">{totalFieldArea.toFixed(2)} ha</div>
                                </div>
                                <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: "2.5rem", height: "2.5rem" }}>
                                    <i className="pi pi-map-marker text-blue-500 text-xl" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 📌 Recent Tasks */}
                {canReadTasks && (
                    <div className="col-12">
                        <div className="card">
                            <h5>Recent Tasks</h5>
                            <DataTable value={tasks} responsiveLayout="scroll">
                                <Column field="type.name" header="Task" />
                                <Column field="field.name" header="Field" />
                                <Column field="status.name" header="Status" />
                                <Column field="dueDate" header="Due Date" body={(data) => (data.dueDate ? new Date(data.dueDate).toLocaleDateString() : "N/A")} />
                                <Column
                                    header="View"
                                    body={(data) => (
                                        <Link href={`/tasks/${data.id}`}>
                                            <Button icon="pi pi-eye" text />
                                        </Link>
                                    )}
                                />
                            </DataTable>
                        </div>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default Dashboard;
