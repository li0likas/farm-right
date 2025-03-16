'use client';

import { Button } from 'primereact/button';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Menu } from 'primereact/menu';
import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import ProtectedRoute from "@/utils/ProtectedRoute";
import { toast } from 'sonner';
import Link from 'next/link';
import { PieChart } from '@mui/x-charts/PieChart';
import { isLoggedIn } from "@/utils/auth";

interface Task {
    id: string;
    title: string;
    status: { name: string };
    field: { name: string };
    dueDate?: string;
    completionDate?: string;
}

const Dashboard = () => {
    const [tasks, setTasks] = useState<Task[]>([]);
    const [totalFieldArea, setTotalFieldArea] = useState(0);
    const [completedPercentage, setCompletedPercentage] = useState(0);
    const menu1 = useRef<Menu>(null);
    const menu2 = useRef<Menu>(null);

    useEffect(() => {
        if (!isLoggedIn()) {
            toast.error('Unauthorized. Login first.');
            return;
        }

        fetchTasks();
        fetchFieldData();
    }, []);
    const fetchTasks = async () => {
        try {
            const token = localStorage.getItem('accessToken');
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/tasks`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            const sortedTasks = response.data.sort((a: Task, b: Task) => {
                const dateA = a.dueDate || a.completionDate;
                const dateB = b.dueDate || b.completionDate;
                return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
            });

            setTasks(sortedTasks);

            const completedTasksCount = sortedTasks.filter((task: Task) => task.status.name === 'Completed').length;
            const totalTasksCount = sortedTasks.length;
            const percentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

            setCompletedPercentage(percentage);
        } catch (error) {
            console.error('Error fetching tasks:', error);
            toast.error('Failed to fetch tasks.');
        }
    };

    const fetchFieldData = async () => {
        try {
            const accessToken = localStorage.getItem('accessToken');    
            const selectedFarmId = localStorage.getItem('x-selected-farm-id'); // ✅ Get farmId    
            if (!selectedFarmId) {
                toast.error("No farm selected!");
                return;
            }
            
            const response = await axios.get(`${process.env.NEXT_PUBLIC_API_BASE_URL}/fields`, {
                headers: { 
                    Authorization: `Bearer ${accessToken}`,
                    'x-selected-farm-id': selectedFarmId // ✅ Corrected header key
                }
            });
            const totalArea = response.data.reduce((sum: number, field: { area: number }) => sum + field.area, 0);
            setTotalFieldArea(totalArea);
        } catch (error) {
            if (error.response?.status === 403) {
                window.location.href = '/pages/unauthorized'; // ✅ Redirect on 403
            } else {
                toast.error("Failed to fetch fields.");
            }
        }     
    };

    return (
        <ProtectedRoute>
            <div className="grid">
                {/* 📌 TASKS CARD */}
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Task Completion</span>
                                <div className="text-900 font-medium text-xl">{completedPercentage.toFixed(0)}%</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-green-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-check text-green-500 text-xl" />
                            </div>
                        </div>
                        <PieChart
                            slotProps={{ legend: { hidden: true } }}
                            series={[
                                {
                                    data: [
                                        { id: 0, value: completedPercentage, color: '#61E9B1', label: 'Completed' },
                                        { id: 1, value: 100 - completedPercentage, color: '#e1e1e1', label: 'Not done' },
                                    ],
                                    innerRadius: 20,
                                    outerRadius: 30,
                                    paddingAngle: 0,
                                    cornerRadius: 5,
                                    startAngle: 0,
                                    endAngle: 360,
                                    cx: 70,
                                }
                            ]}
                            height={70}
                        />
                    </div>
                </div>

                {/* 📌 TOTAL FIELD AREA */}
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Total Field Area</span>
                                <div className="text-900 font-medium text-xl"> {totalFieldArea.toFixed(2)} ha</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-map-marker text-blue-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📌 DAILY STEPS */}
                <div className="col-12 lg:col-6 xl:col-3">
                    <div className="card mb-0">
                        <div className="flex justify-content-between mb-3">
                            <div>
                                <span className="block text-500 font-medium mb-3">Daily Steps</span>
                                <div className="text-900 font-medium text-xl">5</div>
                            </div>
                            <div className="flex align-items-center justify-content-center bg-cyan-100 border-round" style={{ width: '2.5rem', height: '2.5rem' }}>
                                <i className="pi pi-walking text-cyan-500 text-xl" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* 📌 TASKS LIST */}
                <div className="col-12">
                    <div className="card">
                        <h5>Recent Tasks</h5>
                        <DataTable value={tasks} responsiveLayout="scroll">
                            <Column field="type.name" header="Task" />
                            <Column field="field.name" header="Field" />
                            <Column field="status.name" header="Status" />
                            <Column field="dueDate" header="Due Date" body={(data) => data.dueDate ? new Date(data.dueDate).toLocaleDateString() : 'N/A'} />
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
            </div>
        </ProtectedRoute>
    );
};

export default Dashboard;
