'use client';

import React, { useEffect, useState } from "react";
import { DataTable } from "primereact/datatable";
import { Column } from "primereact/column";
import { Button } from "primereact/button";
import { PieChart } from "@mui/x-charts/PieChart";
import { toast } from "sonner";
import Link from "next/link";
import { Tag } from "primereact/tag";
import { Card } from "primereact/card";
import { ProgressSpinner } from "primereact/progressspinner";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";
import { useRouter } from "next/navigation";
import { getUser } from "@/utils/user";

interface Task {
    id: string;
    title: string;
    status: { name: string };
    field: { name: string };
    type: { name: string };
    dueDate?: string;
    completionDate?: string;
}

interface WeatherData {
    temperature?: number;
    condition?: string;
    icon?: string;
}

interface FarmData {
    id: number;
    name: string;
}

const Dashboard = () => {
    const { hasPermission } = usePermissions();
    const router = useRouter();

    const t = useTranslations('common');
    const dt = useTranslations('dashboard');
    const taskT = useTranslations('tasks');

    const canReadTasks = hasPermission("TASK_READ");
    const canReadTaskStats = hasPermission("TASK_STATS_READ");
    const canReadFields = hasPermission("FIELD_TOTAL_AREA_READ");
    const canReadAiSummary = hasPermission("DASHBOARD_AI_SUMMARY");
    const canCreateTask = hasPermission("TASK_CREATE");
    const canCreateField = hasPermission("FIELD_CREATE");

    const [tasks, setTasks] = useState<Task[]>([]);
    const [totalFieldArea, setTotalFieldArea] = useState(0);
    const [completedPercentage, setCompletedPercentage] = useState(0);
    const [fieldsCount, setFieldsCount] = useState(0);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [loadingWeather, setLoadingWeather] = useState(false);

    const [aiInsight, setAiInsight] = useState<string | null>(null);
    const [loadingInsight, setLoadingInsight] = useState(false);
    const [loadingData, setLoadingData] = useState(true);

    const [userName, setUserName] = useState<string>("");
    const [farmName, setFarmName] = useState<string>("");
    const [userLocation, setUserLocation] = useState<{lat: number, lng: number} | null>(null);

    useEffect(() => {
        const user = getUser();
        if (user) {
            setUserName(user.username || user.email?.split('@')[0] || "User");
        }

        const fetchFarmDetails = async () => {
            const selectedFarmId = localStorage.getItem('x-selected-farm-id');
            if (selectedFarmId) {
                try {
                    const farmResponse = await api.get(`/farms/${selectedFarmId}`);
                    if (farmResponse.data) {
                        setFarmName(farmResponse.data.name);
                    }
                } catch (error) {
                    console.error("Error fetching farm details:", error);
                    try {
                        const farmsResponse = await api.get('/users/farms');
                        const selectedFarm = farmsResponse.data.find((farm: any) => farm.id === parseInt(selectedFarmId));
                        if (selectedFarm) {
                            setFarmName(selectedFarm.name);
                        }
                    } catch (farmListError) {
                        console.error("Error fetching user farms:", farmListError);
                    }
                }
            }
        };

        fetchFarmDetails();

        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setUserLocation({
                        lat: position.coords.latitude,
                        lng: position.coords.longitude
                    });
                },
                (error) => {
                    console.error("Error getting location:", error);
                    setUserLocation({ lat: 54.8985, lng: 23.9036 });
                }
            );
        } else {
            setUserLocation({ lat: 54.8985, lng: 23.9036 });
        }

        const loadData = async () => {
            setLoadingData(true);
            
            if (canReadFields) await fetchFieldData();
            if (canReadTasks) await fetchTasks();
            else if (canReadTaskStats) await fetchTaskStats();
            
            if (canReadAiSummary) {
                const storedInsight = sessionStorage.getItem("aiInsight");
                if (storedInsight) {
                    setAiInsight(storedInsight);
                } else {
                    fetchAiInsight();
                }
            }
            
            setLoadingData(false);
        };
        
        loadData();
    }, [canReadTasks, canReadTaskStats, canReadFields, canReadAiSummary]);

    useEffect(() => {
        if (userLocation) {
            fetchWeatherData();
        }
    }, [userLocation]);
    
    const fetchTasks = async () => {
        try {
            const response = await api.get("/tasks");

            const sortedTasks = response.data.sort((a: Task, b: Task) => {
                const dateA = a.dueDate || a.completionDate;
                const dateB = b.dueDate || b.completionDate;
                return new Date(dateB || 0).getTime() - new Date(dateA || 0).getTime();
            });

            setTasks(sortedTasks);

            const completedTasksCount = sortedTasks.filter((task: Task) => task.status.name === "Completed").length;
            const totalTasksCount = sortedTasks.length;
            const percentage = totalTasksCount > 0 ? (completedTasksCount / totalTasksCount) * 100 : 0;

            setCompletedPercentage(percentage);
        } catch (error) {
            toast.error(dt('fetchTasksError'));
        }
    };

    const fetchTaskStats = async () => {
        try {
            const response = await api.get("/tasks/stats");
            const { completedTasks, totalTasks } = response.data;
            const percentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

            setCompletedPercentage(percentage);
        } catch (error) {
            toast.error(dt('fetchStatsError'));
        }
    };

    const fetchFieldData = async () => {
        try {
            const [areaResponse, fieldsResponse] = await Promise.all([
                api.get("/fields/total-area"),
                api.get("/fields")
            ]);
            
            setTotalFieldArea(areaResponse.data.totalArea);
            setFieldsCount(fieldsResponse.data.length);
        } catch (error) {
            toast.error(dt('fetchFieldsError'));
        }
    };

    const fetchAiInsight = async () => {
        setLoadingInsight(true);
        try {
            const response = await api.post("/ai/farm-summary");
            const insight = response.data.insights;
            setAiInsight(insight);
            sessionStorage.setItem("aiInsight", insight);
        } catch (error) {
            toast.error(dt('aiInsightError'));
        } finally {
            setLoadingInsight(false);
        }
    };
    
    const fetchWeatherData = async () => {
        if (!userLocation) return;
        
        setLoadingWeather(true);
        try {
            const coordinates = { 
                lat: userLocation.lat, 
                lng: userLocation.lng 
            };
            
            try {
                const fieldsResponse = await api.get("/fields");
                if (fieldsResponse.data.length > 0 && fieldsResponse.data[0].boundary) {
                    const boundary = fieldsResponse.data[0].boundary;
                    if (boundary.geometry?.coordinates?.[0]?.[0]) {
                        coordinates.lng = boundary.geometry.coordinates[0][0][0];
                        coordinates.lat = boundary.geometry.coordinates[0][0][1];
                    }
                }
            } catch (fieldError) {
                console.log("Using user's current location for weather");
            }
            
            const response = await api.get("/weather/forecast", {
                headers: {
                    'x-coordinates-lat': coordinates.lat.toString(),
                    'x-coordinates-lng': coordinates.lng.toString(),
                }
            });
            
            if (response.data) {
                setWeatherData({
                    temperature: Math.round(response.data.main?.temp || 0),
                    condition: response.data.weather?.[0]?.description || "Unknown",
                    icon: response.data.weather?.[0]?.icon || "cloud"
                });
            }
        } catch (error) {
            console.error("Failed to fetch weather data:", error);
            toast.error(dt('weatherError'));
            setWeatherData({
                temperature: 12,
                condition: "Unable to load weather",
                icon: "cloud"
            });
        } finally {
            setLoadingWeather(false);
        }
    };
    
    const getTranslatedStatus = (statusName: string) => {
        const statusKey = statusName.toLowerCase();
        return statusKey === "pending" ? taskT('taskStatusPending') :
            statusKey === "completed" ? taskT('taskStatusCompleted') :
            statusKey === "canceled" ? taskT('taskStatusCanceled') :
            statusName;
    };
    
    const getStatusSeverity = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed':
                return 'success';
            case 'pending':
                return 'warning';
            case 'canceled':
                return 'danger';
            default:
                return 'info';
        }
    };

    if (loadingData) {
        return (
            <ProtectedRoute>
                <div className="flex justify-content-center align-items-center min-h-screen">
                    <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                    <span className="ml-3 text-lg">{dt('loading')}</span>
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                <div className="col-12">
                    <Card className="bg-primary-50 border-left-3 border-primary shadow-2">
                        <div className="flex justify-content-between align-items-center">
                            <div>
                                <h2 className="m-0 text-primary font-medium text-2xl">
                                    {dt('welcomeMessage', { 
                                        farmName: farmName || t('common:yourFarm', 'your farm'), 
                                        userName: userName || t('common:user', 'User') 
                                    })}
                                </h2>
                                <p className="text-700 mt-2 mb-0">{dt('todayDate')}: {new Date().toLocaleDateString('lt-LT')}</p>
                            </div>
                            
                            {weatherData && (
                                <div className="flex align-items-center bg-white p-3 border-round shadow-1">
                                    <i className={`pi pi-${weatherData.icon || 'cloud'} text-primary text-2xl mr-2`}></i>
                                    <div>
                                        <span className="text-xl font-medium">{weatherData.temperature}°C</span>
                                        <p className="m-0 text-500">{weatherData.condition}</p>
                                    </div>
                                </div>
                            )}
                            
                            {loadingWeather && (
                                <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                            )}
                        </div>
                    </Card>
                </div>
                
                {canReadAiSummary && (
                    <div className="col-12 lg:col-6 xl:col-6">
                        <Card className="mb-0 shadow-2 h-full">
                            <div className="flex justify-content-between mb-3">
                                <div>
                                    <span className="block text-500 font-medium mb-3">{dt('aiSummary')}</span>
                                    <div className="text-900 font-medium text-base whitespace-pre-wrap">
                                        {loadingInsight ? (
                                            <div className="flex flex-column align-items-center">
                                                <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                                                <span className="mt-2">{dt('generatingSummary')}</span>
                                            </div>
                                        ) : aiInsight || dt('noSummaryAvailable')}
                                    </div>
                                </div>

                                <div className="flex align-items-center justify-content-center bg-purple-100 border-round" style={{ width: "2.5rem", height: "2.5rem" }}>
                                    <i className="pi pi-comments text-purple-500 text-xl" />
                                </div>
                            </div>

                            {aiInsight && (
                                <div className="text-right">
                                    <Button
                                        icon={loadingInsight ? "pi pi-spin pi-spinner" : "pi pi-refresh"}
                                        className="p-button-text p-button-sm"
                                        onClick={fetchAiInsight}
                                        disabled={loadingInsight}
                                        tooltip={dt('regenerateInsight')}
                                    />
                                </div>
                            )}
                        </Card>
                    </div>
                )}
    
                <div className="col-12 lg:col-6 xl:col-6">
                    <div className="grid">
                        {(canReadTaskStats || canReadTasks) && (
                            <div className="col-12 md:col-6">
                                <Card className="mb-0 shadow-2 h-full">
                                    <div className="flex justify-content-between mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">{dt('taskCompletion')}</span>
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
                                                    { id: 0, value: completedPercentage, color: "#61E9B1", label: dt('completed') },
                                                    { id: 1, value: 100 - completedPercentage, color: "#e1e1e1", label: dt('notDone') },
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
                                </Card>
                            </div>
                        )}

                        {canReadFields && (
                            <div className="col-12 md:col-6">
                                <Card className="mb-0 shadow-2 h-full">
                                    <div className="flex justify-content-between mb-3">
                                        <div>
                                            <span className="block text-500 font-medium mb-3">{dt('totalFieldArea')}</span>
                                            {fieldsCount > 0 ? (
                                                <>
                                                    <div className="text-900 font-medium text-xl">{totalFieldArea.toFixed(2)} ha</div>
                                                    <div className="text-600 mt-2">{dt('totalFields')}: {fieldsCount}</div>
                                                </>
                                            ) : (
                                                <div className="text-600">{dt('noFields')}</div>
                                            )}
                                        </div>
                                        <div className="flex align-items-center justify-content-center bg-blue-100 border-round" style={{ width: "2.5rem", height: "2.5rem" }}>
                                            <i className="pi pi-map-marker text-blue-500 text-xl" />
                                        </div>
                                    </div>
                                    
                                    {fieldsCount === 0 && canCreateField && (
                                        <Button 
                                            label={dt('createField')} 
                                            icon="pi pi-plus"
                                            className="p-button-outlined p-button-primary mt-2"
                                            onClick={() => router.push('/create-field')}
                                        />
                                    )}
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                {canReadTasks && (
                    <div className="col-12">
                        <Card className="shadow-2 mt-4">
                            <h5>{dt('tasksTimeline')}</h5>
                            
                            {tasks.length > 0 ? (
                                <DataTable 
                                    value={tasks} 
                                    responsiveLayout="scroll"
                                    className="p-datatable-sm"
                                >
                                    <Column field="type.name" header={dt('task')} />
                                    <Column field="field.name" header={t('field')} />
                                    <Column 
                                        header={dt('status')}
                                        body={(data) => (
                                            <Tag
                                                value={getTranslatedStatus(data.status.name)}
                                                severity={getStatusSeverity(data.status.name)}
                                            />
                                        )}
                                    />
                                    <Column
                                        header={dt('date')}
                                        body={(data) => {
                                            const isDue = !!data.dueDate;
                                            const date = isDue ? data.dueDate : data.completionDate;
                                            return date ? (
                                                <>
                                                    <span className="text-sm text-gray-700">{isDue ? dt('due') : dt('completed')}:</span>
                                                    <br />
                                                    {new Date(date).toLocaleDateString('lt-LT')}
                                                </>
                                            ) : "N/A";
                                        }}
                                    />
                                    <Column
                                        header={dt('view')}
                                        body={(data) => (
                                            <Link href={`/tasks/${data.id}`}>
                                                <Button icon="pi pi-eye" text />
                                            </Link>
                                        )}
                                    />
                                </DataTable>
                            ) : (
                                <div className="text-center py-6">
                                    <div className="mb-3">
                                        <i className="pi pi-inbox text-500" style={{ fontSize: '3rem' }}></i>
                                    </div>
                                    <p className="text-500 mb-3">{dt('noTasks')}</p>
                                    {canCreateTask && (
                                        <Button 
                                            label={dt('createTask')}
                                            icon="pi pi-plus"
                                            className="p-button-primary"
                                            onClick={() => router.push('/create-task')}
                                        />
                                    )}
                                </div>
                            )}
                        </Card>
                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
};

export default Dashboard;