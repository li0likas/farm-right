"use client";

import React, { useState, useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { toast } from "sonner";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { ProgressSpinner } from "primereact/progressspinner";
import { Panel } from "primereact/panel";
import { TabView, TabPanel } from "primereact/tabview";
import { Dialog } from "primereact/dialog";
import { Tooltip } from "primereact/tooltip";
import { Avatar } from "primereact/avatar";
import { Badge } from "primereact/badge";
import GoogleMapComponent from "../../../components/GoogleMapComponent";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

interface Task {
    id: string;
    title: string;
    status: { name: string };
    field: { name: string };
    type: { name: string };
    dueDate?: string;
    completionDate?: string;
    season?: { id: number; name: string };
    description?: string;
}

interface WeatherData {
    main?: {
        temp: number;
        humidity: number;
        feels_like: number;
    };
    weather?: {
        description: string;
        icon: string;
    }[];
    wind?: {
        speed: number;
        deg: number;
    };
}

const FieldViewPage = () => {
    const pathname = usePathname();
    const router = useRouter();
    const fieldId = Number(pathname.split("/").pop());
    const { hasPermission } = usePermissions();

    const t = useTranslations('common');
    const f = useTranslations('fields');
    const d = useTranslations('dashboard');
    const tasksT = useTranslations('tasks');

    const [fieldInfo, setFieldInfo] = useState<any>(null);
    const [activeTab, setActiveTab] = useState(0);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [filteredTasks, setFilteredTasks] = useState<Task[]>([]);
    const [seasons, setSeasons] = useState<{ id: number | null; name: string }[]>([]);
    const [selectedSeasonId, setSelectedSeasonId] = useState<number | null>(null);
    const [loading, setLoading] = useState(true);
    const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
    const [weatherLoading, setWeatherLoading] = useState(false);
    const [soilData, setSoilData] = useState<any>(null);
    const [deleteDialogVisible, setDeleteDialogVisible] = useState(false);
    const [statistics, setStatistics] = useState({
        totalTasks: 0,
        completedTasks: 0,
        pendingTasks: 0,
        canceledTasks: 0
    });

    const canRead = hasPermission("FIELD_READ");
    const canCreateTask = hasPermission("FIELD_TASK_CREATE");
    const canDeleteField = hasPermission("FIELD_DELETE");
    const canViewTasks = hasPermission("FIELD_TASK_READ");
    const canViewTaskDetails = hasPermission("TASK_READ");

    useEffect(() => {
        if (!canRead || !fieldId) return;
        fetchFieldInfo();
        fetchSeasons();
        if (canViewTasks) fetchTasks();
    }, [fieldId, canRead, canViewTasks]);

    useEffect(() => {
        // Filter tasks when season selection changes
        if (tasks.length > 0) {
            filterTasksBySeason(tasks, selectedSeasonId);
        }
    }, [selectedSeasonId, tasks]);

    useEffect(() => {
        // Fetch weather data when field info is loaded
        if (fieldInfo?.boundary) {
            fetchWeatherData();
            fetchSoilData();
        }
    }, [fieldInfo]);

    const fetchFieldInfo = async () => {
        try {
            setLoading(true);
            const response = await api.get(`/fields/${fieldId}`);
            setFieldInfo(response.data);
        } catch (error) {
            toast.error(f('fieldLoadError'));
        } finally {
            setLoading(false);
        }
    };

    const fetchTasks = async () => {
        try {
            const res = await api.get(`/fields/${fieldId}/tasks`);
            const sortedTasks = res.data.sort((a: Task, b: Task) => {
                const dateA = a.dueDate || a.completionDate || '';
                const dateB = b.dueDate || b.completionDate || '';
                return new Date(dateB).getTime() - new Date(dateA).getTime();
            });
            
            setTasks(sortedTasks);
            filterTasksBySeason(sortedTasks, selectedSeasonId);
            
            // Calculate task statistics
            const stats = {
                totalTasks: sortedTasks.length,
                completedTasks: sortedTasks.filter((t: { status: { name: string; }; }) => t.status.name === "Completed").length,
                pendingTasks: sortedTasks.filter((t: { status: { name: string; }; }) => t.status.name === "Pending").length,
                canceledTasks: sortedTasks.filter((t: { status: { name: string; }; }) => t.status.name === "Canceled").length
            };
            setStatistics(stats);
            
        } catch (error) {
            toast.error(tasksT('fetchError'));
        }
    };

    const fetchSeasons = async () => {
        try {
            const res = await api.get("/seasons");
            const seasonOptions = [
                { id: null, name: tasksT('allSeasons') },
                ...res.data,
            ];
            setSeasons(seasonOptions);
            setSelectedSeasonId(null);
        } catch (err) {
            toast.error(tasksT('fetchSeasonsError'));
        }
    };

    const filterTasksBySeason = (allTasks: Task[], seasonId: number | null) => {
        if (!seasonId) {
            setFilteredTasks(allTasks);
        } else {
            const filtered = allTasks.filter(task => task.season?.id === seasonId);
            setFilteredTasks(filtered);
        }
    };

    const fetchWeatherData = async () => {
        if (!fieldInfo?.boundary?.geometry?.coordinates) return;
        
        setWeatherLoading(true);
        try {
            const coordinates = fieldInfo.boundary.geometry.coordinates[0][0];
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
            setWeatherLoading(false);
        }
    };

    const fetchSoilData = async () => {
        // This would be a real API call in production
        // Simulating soil data for demonstration purposes
        setSoilData({
            type: "Clay Loam",
            ph: 6.5,
            organicMatter: "Medium (2-4%)",
            fertility: "Good",
            drainage: "Moderate",
            lastTested: "2024-01-15"
        });
    };

    const handleDeleteField = async () => {
        try {
            await api.delete(`/fields/${fieldId}`);
            toast.success(f('deleteFieldSuccess'));
            router.push("/fields");
        } catch (error) {
            toast.error(f('deleteFieldError'));
        }
    };

    const getCropTag = (field: any) => {
        if (!field.crop) return null;
        
        const cropName = field.crop.name;
        let color = 'primary';
        
        // Assign colors based on crop type (example logic)
        if (cropName.toLowerCase().includes('wheat')) color = 'warning';
        else if (cropName.toLowerCase().includes('corn')) color = 'success';
        else if (cropName.toLowerCase().includes('soy')) color = 'info';
        else if (cropName.toLowerCase().includes('potato')) color = 'danger';
        
        return (
            <Tag 
                value={cropName} 
                severity={color as any} 
                className="text-lg px-3 py-2"
            />
        );
    };

    const getTaskStatusSeverity = (status: string) => {
        switch (status.toLowerCase()) {
            case 'completed': return 'success';
            case 'pending': return 'warning';
            case 'canceled': return 'danger';
            default: return 'info';
        }
    };

    const getSoilQualityIndicator = (value: string | number, type: string) => {
        let status = 'warning';
        let icon = 'pi-exclamation-circle';
        
        // Logic to determine soil quality indicators (examples)
        if (type === 'ph') {
            const ph = Number(value);
            if (ph >= 6.0 && ph <= 7.5) status = 'success';
            else if ((ph >= 5.5 && ph < 6.0) || (ph > 7.5 && ph <= 8.0)) status = 'warning';
            else status = 'danger';
        } else if (type === 'organicMatter') {
            if (value.toString().includes('High')) status = 'success';
            else if (value.toString().includes('Medium')) status = 'warning';
            else status = 'danger';
        } else if (type === 'fertility' || type === 'drainage') {
            if (value === 'Good' || value === 'Excellent') {
                status = 'success';
                icon = 'pi-check-circle';
            }
            else if (value === 'Moderate') status = 'warning';
            else status = 'danger';
        }
        
        return <i className={`pi ${icon} text-${status} ml-2`} style={{ fontSize: '1rem' }}></i>;
    };

    const getFieldCenter = () => {
        if (fieldInfo?.boundary?.geometry?.coordinates?.[0]?.[0]) {
            return { 
                lat: fieldInfo.boundary.geometry.coordinates[0][0][1], 
                lng: fieldInfo.boundary.geometry.coordinates[0][0][0] 
            };
        }
        return { lat: 55.1694, lng: 23.8813 }; // Default center
    };

    if (!canRead) {
        return (
            <ProtectedRoute>
                <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
                    <i className="pi pi-lock text-4xl mb-3"></i>
                    <div>{f('noPermission')}</div>
                </div>
            </ProtectedRoute>
        );
    }

    if (loading) {
        return (
            <ProtectedRoute>
                <div className="flex justify-content-center align-items-center min-h-screen">
                    <ProgressSpinner />
                </div>
            </ProtectedRoute>
        );
    }

    if (!fieldInfo) {
        return (
            <ProtectedRoute>
                <div className="text-center p-5">
                    <i className="pi pi-exclamation-triangle text-yellow-500 text-5xl mb-3"></i>
                    <div className="text-xl">{f('fieldNotFound')}</div>
                    <Button 
                        label={f('backToFields')} 
                        icon="pi pi-arrow-left" 
                        className="mt-3" 
                        onClick={() => router.push('/fields')}
                    />
                </div>
            </ProtectedRoute>
        );
    }

    return (
        <ProtectedRoute>
            <div className="grid">
                {/* Field Header */}
                <div className="col-12">
                    <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between mb-4">
                        <div className="flex align-items-center">
                            <Button 
                                icon="pi pi-arrow-left" 
                                className="p-button-rounded p-button-text mr-2" 
                                onClick={() => router.push('/fields')}
                                tooltip={f('backToFields')}
                            />
                            <div>
                                <h1 className="text-3xl font-bold m-0 text-primary">{fieldInfo.name}</h1>
                                <div className="text-500 mt-1">
                                    ID: {fieldInfo.id} • {f('lastUpdated')}: {
                                        fieldInfo.updatedAt 
                                            ? new Date(fieldInfo.updatedAt).toLocaleDateString() 
                                            : new Date().toLocaleDateString()
                                    }
                                </div>
                            </div>
                        </div>
                        
                        <div className="flex gap-2 mt-3 md:mt-0">
                            {canCreateTask && (
                                <Button 
                                    label={tasksT('createTask')} 
                                    icon="pi pi-plus" 
                                    className="p-button-success" 
                                    onClick={() => router.push(`/create-task/${fieldId}`)} 
                                />
                            )}
                            
                            {canDeleteField && (
                                <Button 
                                    label={f('deleteField')} 
                                    icon="pi pi-trash" 
                                    className="p-button-danger" 
                                    onClick={() => setDeleteDialogVisible(true)} 
                                />
                            )}
                        </div>
                    </div>
                </div>
                
                {/* Field Overview */}
                <div className="col-12 lg:col-4 order-2 lg:order-1">
                    <div className="card h-full">
                        <div className="flex justify-content-between align-items-center">
                            <h3 className="text-xl font-semibold">{f('fieldOverview')}</h3>
                            {getCropTag(fieldInfo)}
                        </div>
                        
                        <div className="grid mt-4">
                            <div className="col-6 mb-3">
                                <div className="border-round bg-primary-50 p-3 h-full">
                                    <div className="text-600">{f('area')}</div>
                                    <div className="text-2xl font-bold">{fieldInfo.area.toFixed(2)} {f('ha')}</div>
                                </div>
                            </div>
                            
                            <div className="col-6 mb-3">
                                <div className="border-round bg-primary-50 p-3 h-full">
                                    <div className="text-600">{f('perimeter')}</div>
                                    <div className="text-2xl font-bold">{fieldInfo.perimeter.toFixed(0)} {f('m')}</div>
                                </div>
                            </div>
                            
                            <div className="col-12 mb-3">
                                <div className="border-round bg-primary-50 p-3">
                                    <div className="text-600">{f('currentCrop')}</div>
                                    <div className="text-2xl font-bold">
                                        {fieldInfo.crop?.name || f('notSpecified')}
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Task Statistics Summary */}
                        <div className="mt-4">
                            <h4 className="font-semibold">{f('taskStatistics')}</h4>
                            <div className="grid">
                                <div className="col-6 mb-2">
                                    <div className="border-round bg-blue-50 p-3 text-center">
                                        <div className="text-600">{tasksT('total')}</div>
                                        <div className="text-2xl font-bold">{statistics.totalTasks}</div>
                                    </div>
                                </div>
                                
                                <div className="col-6 mb-2">
                                    <div className="border-round bg-green-50 p-3 text-center">
                                        <div className="text-600">{tasksT('completed')}</div>
                                        <div className="text-2xl font-bold">{statistics.completedTasks}</div>
                                    </div>
                                </div>
                                
                                <div className="col-6 mb-2">
                                    <div className="border-round bg-yellow-50 p-3 text-center">
                                        <div className="text-600">{tasksT('pending')}</div>
                                        <div className="text-2xl font-bold">{statistics.pendingTasks}</div>
                                    </div>
                                </div>
                                
                                <div className="col-6 mb-2">
                                    <div className="border-round bg-pink-50 p-3 text-center">
                                        <div className="text-600">{tasksT('canceled')}</div>
                                        <div className="text-2xl font-bold">{statistics.canceledTasks}</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Weather Card */}
                        {weatherData && (
                            <Panel header={f('currentWeather')} toggleable className="mt-4">
                                <div className="flex flex-column align-items-center">
                                    {weatherLoading ? (
                                        <ProgressSpinner style={{ width: '50px', height: '50px' }} />
                                    ) : (
                                        <>
                                            <div className="flex align-items-center mb-3">
                                                <img 
                                                    src={`https://openweathermap.org/img/w/${weatherData?.weather?.[0]?.icon}.png`} 
                                                    alt="Weather icon" 
                                                    className="mr-2"
                                                    style={{ width: '50px', height: '50px' }}
                                                />
                                                <div className="text-4xl font-bold">
                                                    {Math.round(weatherData?.main?.temp || 0)}°C
                                                </div>
                                            </div>
                                            
                                            <div className="text-xl capitalize mb-3">
                                                {weatherData?.weather?.[0]?.description}
                                            </div>
                                            
                                            <div className="grid w-full">
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <div className="text-600">{f('humidity')}</div>
                                                        <div className="text-xl font-medium">
                                                            {weatherData?.main?.humidity}%
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                <div className="col-6">
                                                    <div className="text-center">
                                                        <div className="text-600">{f('wind')}</div>
                                                        <div className="text-xl font-medium">
                                                            {weatherData?.wind?.speed} m/s
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </Panel>
                        )}                
                    </div>
                </div>
                
                {/* Map and Tasks */}
                <div className="col-12 lg:col-8 order-1 lg:order-2">
                    <TabView activeIndex={activeTab} onTabChange={(e) => setActiveTab(e.index)}>
                        <TabPanel header={f('fieldLocation')} leftIcon="pi pi-map-marker mr-2">
                            <div className="card mb-0">
                                <div className="field-map border-round overflow-hidden" style={{ height: '500px' }}>
                                    <GoogleMapComponent 
                                        center={getFieldCenter()} 
                                        boundary={fieldInfo.boundary} 
                                    />
                                </div>
                                <div className="text-right mt-3">
                                    <a 
                                        href={`https://www.google.com/maps/search/?api=1&query=${getFieldCenter().lat},${getFieldCenter().lng}`} 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="p-button p-button-text flex align-items-center justify-content-center gap-2 ml-auto w-auto"
                                    >
                                        <i className="pi pi-external-link"></i>
                                        {f('openInGoogleMaps')}
                                    </a>
                                </div>
                            </div>
                        </TabPanel>
                        
                        <TabPanel 
                            header={d('tasksTimeline')} 
                            leftIcon="pi pi-list mr-2"
                            rightIcon={
                                <Badge 
                                    value={filteredTasks.length} 
                                    severity={filteredTasks.length > 0 ? "info" : "secondary"}
                                    className="ml-2"
                                ></Badge>
                            }
                        >
                            <div className="card mb-0">
                                {canViewTasks ? (
                                    <>
                                        {/* Season filter buttons */}
                                        <div className="mb-4 flex flex-wrap gap-2">
                                            {seasons.map((season) => (
                                                <Button
                                                    key={season.id ?? "all"}
                                                    label={season.name}
                                                    className={`p-button-sm ${selectedSeasonId === season.id ? "p-button-info" : "p-button-outlined"}`}
                                                    onClick={() => setSelectedSeasonId(season.id)}
                                                />
                                            ))}
                                            
                                            <div className="ml-auto">
                                                {canCreateTask && (
                                                    <Button
                                                        label={tasksT('createTask')}
                                                        icon="pi pi-plus"
                                                        className="p-button-sm p-button-success"
                                                        onClick={() => router.push(`/create-task/${fieldId}`)}
                                                    />
                                                )}
                                            </div>
                                        </div>

                                        {/* Tasks list */}
                                        {filteredTasks.length === 0 ? (
                                            <div className="text-center p-5 surface-section border-round">
                                                <i className="pi pi-calendar-times text-gray-400 text-5xl mb-3"></i>
                                                <div className="text-xl text-gray-600 mb-3">{tasksT('noTasksAvailable')}</div>
                                                {canCreateTask && (
                                                    <Button
                                                        label={tasksT('createTask')}
                                                        icon="pi pi-plus"
                                                        className="p-button-outlined"
                                                        onClick={() => router.push(`/create-task/${fieldId}`)}
                                                    />
                                                )}
                                            </div>
                                        ) : (
                                            <div className="timeline">
                                                {filteredTasks.map((task) => (
                                                    <div key={task.id} className="mb-4">
                                                        <Card className="shadow-2 border-left-3 border-primary h-full">
                                                            <div className="flex flex-column md:flex-row">
                                                                <div className="flex-1">
                                                                    <div className="flex align-items-center mb-3">
                                                                        <i className="pi pi-check-circle text-primary text-xl mr-2"></i>
                                                                        <h4 className="m-0 font-semibold text-lg">{task.type.name}</h4>
                                                                        <Tag 
                                                                            value={task.status.name} 
                                                                            severity={getTaskStatusSeverity(task.status.name)} 
                                                                            className="ml-auto"
                                                                        />
                                                                    </div>
                                                                    
                                                                    <p className="mt-0 mb-3 line-height-3">
                                                                        {task.description || tasksT('noDescription')}
                                                                    </p>
                                                                    
                                                                    <div className="flex flex-wrap gap-3 text-sm">
                                                                        {task.season && (
                                                                            <div className="flex align-items-center">
                                                                                <i className="pi pi-calendar mr-2 text-primary"></i>
                                                                                <span>{task.season.name}</span>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {task.dueDate && (
                                                                            <div className="flex align-items-center">
                                                                                <i className="pi pi-clock mr-2 text-primary"></i>
                                                                                <span>
                                                                                    {d('due')}: {new Date(task.dueDate).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                        
                                                                        {task.completionDate && (
                                                                            <div className="flex align-items-center">
                                                                                <i className="pi pi-check-circle mr-2 text-green-500"></i>
                                                                                <span>
                                                                                    {tasksT('completedDate')}: {new Date(task.completionDate).toLocaleDateString()}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                
                                                                {canViewTaskDetails && (
                                                                    <div className="mt-3 md:mt-0 md:ml-3 flex align-items-center">
                                                                        <Button
                                                                            label={d('view')}
                                                                            icon="pi pi-arrow-right"
                                                                            onClick={() => router.push(`/tasks/${task.id}`)}
                                                                        />
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </Card>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="text-center p-5">
                                        <i className="pi pi-lock text-yellow-500 text-5xl mb-3"></i>
                                        <div className="text-xl">{tasksT('noPermission')}</div>
                                    </div>
                                )}
                            </div>
                        </TabPanel>
                    </TabView>
                </div>
            </div>
            
            {/* Delete Confirmation Dialog */}
            <Dialog
                header={f('deleteField')}
                visible={deleteDialogVisible}
                onHide={() => setDeleteDialogVisible(false)}
                style={{ width: '450px' }}
                modal
                footer={
                    <div className="flex justify-content-end gap-2">
                        <Button
                            label={t('cancel')}
                            icon="pi pi-times"
                            className="p-button-text"
                            onClick={() => setDeleteDialogVisible(false)}
                        />
                        <Button
                            label={f('deleteField')}
                            icon="pi pi-trash"
                            className="p-button-danger"
                            onClick={handleDeleteField}
                        />
                    </div>
                }
            >
                <div className="flex align-items-center gap-3">
                    <i className="pi pi-exclamation-triangle text-yellow-500 text-4xl"></i>
                    <div>
                        <div className="text-xl font-medium mb-2">{f('deleteFieldConfirm')}</div>
                        <p className="m-0 line-height-3">
                            {f('deleteFieldWarning')}
                        </p>
                    </div>
                    </div>
            </Dialog>
        </ProtectedRoute>
    );
};

export default FieldViewPage;