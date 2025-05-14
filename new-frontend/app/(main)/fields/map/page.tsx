"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { ToggleButton } from "primereact/togglebutton";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Panel } from "primereact/panel";
import { GoogleMap, LoadScript, Polygon, InfoWindow, Marker } from "@react-google-maps/api";
import { toast } from "sonner";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";
import { useTranslations } from "next-intl";

interface Field {
  id: number;
  name: string;
  area: number;
  perimeter: number;
  crop?: { name: string };
  cropId?: number;
  boundary?: any;
}

interface Task {
  id: string;
  title: string;
  status: { name: string };
  type: { name: string };
  dueDate?: string;
  completionDate?: string;
}

const FieldsMapView = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  
  // Add translation hooks
  const t = useTranslations('common');
  const fm = useTranslations('fieldsMap');
  const f = useTranslations('fields');
  const taskT = useTranslations('tasks');
  
  const mapRef = useRef(null);
  const [fields, setFields] = useState<Field[]>([]);
  const [filteredFields, setFilteredFields] = useState<Field[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState<Field | null>(null);
  const [mapCenter, setMapCenter] = useState({ lat: 55.1694, lng: 23.8813 });
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(9);
  const [cropOptions, setCropOptions] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [showWeatherLayer, setShowWeatherLayer] = useState(false);
  const [weatherData, setWeatherData] = useState({});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const googleMapsRef = useRef(null);
  const [selectedFieldTasks, setSelectedFieldTasks] = useState<Task[]>([]);
  const [loadingTasks, setLoadingTasks] = useState(false);

  const canReadFields = hasPermission("FIELD_READ");
  const canCreateField = hasPermission("FIELD_CREATE");
  const canCreateTask = hasPermission("FIELD_TASK_CREATE");
  const canViewTasks = hasPermission("FIELD_TASK_READ");

  // Random color generator for field boundaries
  const getFieldColor = (fieldId: number) => {
    const colors = [
      "#FF5252", "#FF4081", "#E040FB", "#7C4DFF",
      "#536DFE", "#448AFF", "#40C4FF", "#18FFFF",
      "#64FFDA", "#69F0AE", "#B2FF59", "#EEFF41",
      "#FFFF00", "#FFD740", "#FFAB40", "#FF6E40"
    ];
    const index = Math.abs(fieldId) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (canReadFields) {
      fetchData();
    }
  }, [canReadFields]);

  useEffect(() => {
    filterFields();
  }, [selectedCrops, fields]);

  useEffect(() => {
    if (showWeatherLayer && filteredFields.length > 0) {
      fetchWeatherForFields();
    } else {
      setWeatherData({});
    }
  }, [showWeatherLayer, filteredFields]);

  useEffect(() => {
    if (googleApiLoaded && mapRef.current && filteredFields.length > 0) {
      const validFields = filteredFields.filter(field => isValidBoundary(field.boundary));
      if (validFields.length > 0) {
        calculateMapBounds(validFields, mapRef.current);
      }
    }
  }, [filteredFields, googleApiLoaded]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([fetchFields(), fetchCropOptions()]);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchFields = async () => {
    try {
      const response = await api.get("/fields");
      setFields(response.data);
      setFilteredFields(response.data);
    } catch (error) {
      toast.error(fm('failedToFetchFields'));
    }
  };

  const calculateMapBounds = (fieldsToFit, map) => {
    if (!googleApiLoaded || !window.google?.maps || !map) return;
  
    const bounds = new window.google.maps.LatLngBounds();
  
    fieldsToFit.forEach(field => {
      const paths = extractPolygonPaths(field.boundary);
      if (paths.length > 0) {
        paths.forEach(path => {
          bounds.extend(path);
        });
      }
    });
  
    if (!bounds.isEmpty()) {
      map.fitBounds(bounds);
    }
  };

  const fetchCropOptions = async () => {
    try {
      const response = await api.get("/field-crop-options");
      setCropOptions(response.data.map(crop => ({
        label: crop.name,
        value: crop.id
      })));
    } catch (error) {
      toast.error(fm('failedToLoadCropOptions'));
    }
  };

  const fetchWeatherForFields = async () => {
    setLoadingWeather(true);
    const weatherResults = {};
    
    try {
      for (const field of filteredFields) {
        if (!isValidBoundary(field.boundary)) continue;
        
        const centerPoint = extractCenterPoint(field.boundary);
        if (!centerPoint) continue;
        
        try {
          const response = await api.get("/weather/forecast", {
            headers: {
              'x-coordinates-lat': centerPoint.lat.toString(),
              'x-coordinates-lng': centerPoint.lng.toString(),
            }
          });
          weatherResults[field.id] = response.data;
        } catch (error) {
          console.error(`Failed to get weather for field ${field.id}:`, error);
        }
      }
      
      setWeatherData(weatherResults);
    } catch (error) {
      toast.error(fm('failedToLoadWeather'));
    } finally {
      setLoadingWeather(false);
    }
  };

  const filterFields = () => {
    if (!fields.length) return;
    
    let filtered = [...fields];
    
    if (selectedCrops.length > 0) {
      filtered = filtered.filter(field => 
        selectedCrops.includes(field.cropId)
      );
    }
    
    setFilteredFields(filtered);
  };

  const isValidBoundary = (boundary) => {
    if (!boundary) return false;
    
    try {
      if (boundary.geometry && boundary.geometry.coordinates && 
          Array.isArray(boundary.geometry.coordinates[0]) && 
          boundary.geometry.coordinates[0].length > 0) {
        return true;
      }
      
      if (Array.isArray(boundary.coordinates) && 
          Array.isArray(boundary.coordinates[0]) && 
          boundary.coordinates[0].length > 0) {
        return true;
      }
      
      if (Array.isArray(boundary) && 
          Array.isArray(boundary[0]) && 
          boundary[0].length > 0) {
        return true;
      }
    } catch (e) {
      return false;
    }
    
    return false;
  };

  const extractPolygonPaths = (boundary) => {
    if (!boundary) return [];
    
    try {
      let coordinates = [];
      
      if (boundary.geometry && boundary.geometry.coordinates && 
          Array.isArray(boundary.geometry.coordinates[0])) {
        coordinates = boundary.geometry.coordinates[0];
      }
      else if (Array.isArray(boundary.coordinates) && 
               Array.isArray(boundary.coordinates[0])) {
        coordinates = boundary.coordinates[0];
      }
      else if (Array.isArray(boundary) && 
               Array.isArray(boundary[0])) {
        coordinates = boundary[0];
      }
      
      return coordinates.map(coord => {
        if (Array.isArray(coord) && coord.length >= 2) {
          return {
            lat: coord[1],
            lng: coord[0]
          };
        }
        else if (coord.lat !== undefined && coord.lng !== undefined) {
          return {
            lat: coord.lat,
            lng: coord.lng
          };
        }
        return null;
      }).filter(coord => coord !== null);
    } catch (e) {
      return [];
    }
  };

  const extractCenterPoint = (boundary) => {
    const paths = extractPolygonPaths(boundary);
    if (paths.length === 0) return null;
    
    const sum = paths.reduce((acc, coord) => ({
      lat: acc.lat + coord.lat,
      lng: acc.lng + coord.lng
    }), { lat: 0, lng: 0 });
    
    return {
      lat: sum.lat / paths.length,
      lng: sum.lng / paths.length
    };
  };

  const handleFieldClick = (field) => {
    setSelectedField(field);
    
    const centerPoint = extractCenterPoint(field.boundary);
    if (centerPoint) {
      setMapCenter(centerPoint);
      setZoomLevel(15);
    }
  };

  const handleViewDetails = () => {
    setDetailsVisible(true);
    if (selectedField && canViewTasks) {
      fetchFieldTasks(selectedField.id);
    }
  };

  const fetchFieldTasks = async (fieldId: number) => {
    setLoadingTasks(true);
    try {
      const response = await api.get(`/fields/${fieldId}/tasks`);
      // Get only the 5 most recent tasks
      const sortedTasks = response.data
        .sort((a: Task, b: Task) => {
          const dateA = a.dueDate || a.completionDate || '';
          const dateB = b.dueDate || b.completionDate || '';
          return new Date(dateB).getTime() - new Date(dateA).getTime();
        })
        .slice(0, 5);
      setSelectedFieldTasks(sortedTasks);
    } catch (error) {
      console.error('Failed to fetch field tasks:', error);
      setSelectedFieldTasks([]);
    } finally {
      setLoadingTasks(false);
    }
  };

  const handleInspectField = () => {
    router.push(`/fields/${selectedField.id}`);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error(fm('geolocationNotSupported'));
      return;
    }
    
    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userPos = {
          lat: position.coords.latitude,
          lng: position.coords.longitude
        };
        setUserLocation(userPos);
        setMapCenter(userPos);
        setZoomLevel(16);
        setLoadingLocation(false);
        toast.success(fm('locationFound'));
      },
      (error) => {
        toast.error(fm('locationError'));
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const renderWeatherInfo = (fieldId, position) => {
    const weather = weatherData[fieldId];
    if (!weather) return null;
    
    return (
      <div className="bg-white p-2 rounded shadow-lg text-center" style={{ minWidth: "120px" }}>
        <h4 className="text-sm font-bold m-0 mb-1">{Math.round(weather.main.temp)}°C</h4>
        <div className="flex align-items-center justify-content-center">
          <img 
            src={`https://openweathermap.org/img/w/${weather.weather[0].icon}.png`} 
            alt={weather.weather[0].description}
            className="w-2rem h-2rem"
          />
        </div>
        <p className="text-xs capitalize m-0">{weather.weather[0].description}</p>
        <p className="text-xs m-0">{fm('wind')}: {weather.wind.speed} m/s</p>
      </div>
    );
  };

  const containerStyle = {
    width: "100%",
    height: "70vh",
  };

  const mapOptions = {
    mapTypeId: "satellite",
    streetViewControl: false,
    mapTypeControl: true,
    zoomControl: true,
    fullscreenControl: true,
  };

  if (!canReadFields) {
    return (
      <ProtectedRoute>
        <div className="grid">
          <div className="col-12">
            <Card className="text-center">
              <i className="pi pi-lock text-red-500 text-5xl mb-3"></i>
              <h3 className="text-xl font-semibold mb-2">{fm('noPermission')}</h3>
              <p className="text-gray-600 mb-3">{fm('contactAdmin')}</p>
              <Button
                label={fm('backToFields')}
                icon="pi pi-arrow-left"
                className="p-button-outlined"
                onClick={() => router.push('/fields')}
              />
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="flex justify-content-center align-items-center min-h-screen">
          <ProgressSpinner style={{ width: '50px', height: '50px' }} />
        </div>
      </ProtectedRoute>
    );
  }

  if (fields.length === 0) {
    return (
      <ProtectedRoute>
        <div className="grid">
          <div className="col-12">
            <Card className="text-center">
              <i className="pi pi-map text-gray-300 text-5xl mb-3"></i>
              <h3 className="text-xl font-semibold mb-2">{fm('noFieldsTitle')}</h3>
              <p className="text-gray-600 mb-3">{fm('noFieldsDescription')}</p>
              {canCreateField && (
                <Button
                  label={f('createFirstField')}
                  icon="pi pi-plus"
                  className="p-button-success"
                  onClick={() => router.push('/create-field')}
                />
              )}
            </Card>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="grid">
        <div className="col-12">
          <div className="card">
            <div className="flex flex-column md:flex-row align-items-start md:align-items-center justify-content-between mb-4">
              <div className="flex align-items-center mb-3 md:mb-0">
                <Button 
                  icon="pi pi-arrow-left" 
                  className="p-button-text p-button-rounded mr-2" 
                  onClick={() => router.push('/fields')}
                  tooltip={fm('backToFields')}
                />
                <h2 className="text-2xl font-bold m-0">{fm('title')}</h2>
              </div>
              
              <div className="flex gap-2">
                <Button
                  icon={loadingLocation ? "pi pi-spin pi-spinner" : "pi pi-map-marker"}
                  label={loadingLocation ? fm('locating') : fm('myLocation')}
                  onClick={getUserLocation}
                  disabled={loadingLocation}
                  className="p-button-info"
                />
                {canCreateField && (
                  <Button
                    label={fm('createNewField')}
                    icon="pi pi-plus"
                    className="p-button-success"
                    onClick={() => router.push('/create-field')}
                  />
                )}
              </div>
            </div>

            <div className="grid">
              <div className="col-12 md:col-8">
                <div className="field">
                  <label className="font-bold mb-2 block">{fm('filterByLabel')}</label>
                  <MultiSelect
                    value={selectedCrops}
                    options={cropOptions}
                    onChange={(e) => setSelectedCrops(e.value)}
                    placeholder={fm('filterByCrop')}
                    className="w-full"
                    display="chip"
                  />
                </div>
              </div>
              
              <div className="col-12 md:col-4">
                <div className="field">
                  <label className="font-bold mb-2 block">{fm('weatherLayer')}</label>
                  <ToggleButton
                    checked={showWeatherLayer}
                    onChange={(e) => setShowWeatherLayer(e.value)}
                    onLabel={fm('weatherOn')}
                    offLabel={fm('weatherOff')}
                    onIcon="pi pi-cloud"
                    offIcon="pi pi-cloud"
                    className="w-full"
                    disabled={loadingWeather}
                  />
                </div>
              </div>
            </div>

            <Divider />

            <LoadScript
              googleMapsApiKey={process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}
              libraries={["places", "visualization"]}
            >
              <GoogleMap
                mapContainerStyle={containerStyle}
                center={mapCenter}
                zoom={zoomLevel}
                options={mapOptions}
                onClick={() => setSelectedField(null)}
                onLoad={(map) => {
                  mapRef.current = map;
                  if (window.google && window.google.maps) {
                    googleMapsRef.current = window.google;
                    setGoogleApiLoaded(true);
                    
                    const validFields = filteredFields.filter(field => isValidBoundary(field.boundary));
                    if (validFields.length > 0) {
                      calculateMapBounds(validFields, map);
                    }
                  }
                }}
              >
                {googleApiLoaded && window.google?.maps && filteredFields.map((field) => {
                  if (!isValidBoundary(field.boundary)) return null;
                  
                  const polygonPaths = extractPolygonPaths(field.boundary);
                  if (polygonPaths.length < 3) return null;
                  
                  const fieldColor = getFieldColor(field.id);
                  const centerPoint = extractCenterPoint(field.boundary);
                  
                  return (
                    <React.Fragment key={field.id}>
                      <Polygon
                        paths={polygonPaths}
                        options={{
                          fillColor: fieldColor,
                          fillOpacity: 0.3,
                          strokeColor: fieldColor,
                          strokeOpacity: 0.8,
                          strokeWeight: 2,
                        }}
                        onClick={() => handleFieldClick(field)}
                      />
                      
                      {centerPoint && (
                        <Marker
                          position={centerPoint}
                          label={{
                            text: field.name,
                            color: "#FFFFFF",
                            fontWeight: "bold",
                            fontSize: "12px",
                          }}
                          icon={{
                            url: "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%2216%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20fill%3D%22none%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%3C%2Fsvg%3E",
                            scaledSize: new google.maps.Size(1, 1),
                          }}
                        />
                      )}
                      
                      {showWeatherLayer && centerPoint && weatherData[field.id] && (
                        <InfoWindow
                          position={centerPoint}
                          options={{ pixelOffset: new google.maps.Size(0, -20) }}
                        >
                          {renderWeatherInfo(field.id, centerPoint)}
                        </InfoWindow>
                      )}
                      
                      {selectedField && selectedField.id === field.id && (
                        <InfoWindow
                          position={polygonPaths[0]}
                          onCloseClick={() => setSelectedField(null)}
                        >
                          <div className="p-2">
                            <h3 className="text-lg font-bold m-0 mb-2">{field.name}</h3>
                            <p className="m-0 mb-1">{fm('area')}: {field.area} {fm('hectares')}</p>
                            <p className="m-0 mb-2">{fm('currentCrop')}: {field.crop ? field.crop.name : fm('notSpecified')}</p>
                            <Button
                              label={fm('viewDetails')}
                              className="p-button-sm p-button-primary mt-2"
                              onClick={handleViewDetails}
                            />
                          </div>
                        </InfoWindow>
                      )}
                    </React.Fragment>
                  );
                })}
                
                {googleApiLoaded && window.google?.maps && userLocation && (
                  <Marker
                    position={userLocation}
                    icon={{
                      path: google.maps.SymbolPath.CIRCLE,
                      scale: 10,
                      fillColor: "#4285F4",
                      fillOpacity: 1,
                      strokeColor: "#FFFFFF",
                      strokeWeight: 2,
                    }}
                    title={fm('myLocation')}
                  />
                )}
              </GoogleMap>
            </LoadScript>
            
            <div className="mt-4 p-3 bg-gray-100 border-round">
              <div className="flex align-items-center justify-content-between">
                <div className="flex align-items-center gap-2">
                  <i className="pi pi-map-marker text-primary"></i>
                  <span>
                    <strong className="text-primary">{filteredFields.filter(field => isValidBoundary(field.boundary)).length}</strong> {fm('fieldsDisplayed')}
                    {selectedCrops.length > 0 && (
                      <span className="text-gray-600"> ({fm('filteredFrom')} {fields.length} {fm('total')})</span>
                    )}
                  </span>
                </div>
                {loadingWeather && (
                  <div className="flex align-items-center gap-2">
                    <ProgressSpinner style={{ width: '20px', height: '20px' }} />
                    <span className="text-gray-600">{fm('loadingWeather')}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
        
      {/* Field Details Dialog */}
      <Dialog
        header={selectedField ? selectedField.name : fm('fieldDetails')}
        visible={detailsVisible}
        style={{ width: "600px" }}
        onHide={() => {
          setDetailsVisible(false);
          setSelectedFieldTasks([]);
        }}
        footer={
          <div className="flex justify-content-end gap-2">
            <Button
              label={fm('close')}
              icon="pi pi-times"
              className="p-button-text"
              onClick={() => setDetailsVisible(false)}
            />
            <Button
              label={fm('inspectField')}
              icon="pi pi-search"
              onClick={handleInspectField}
            />
          </div>
        }
      >
        {selectedField && (
          <div>
            <Panel header={fm('fieldInfo')} className="mb-3">
              <div className="flex flex-column gap-3">
                <div className="flex justify-content-between">
                  <span className="font-semibold">{fm('fieldName')}:</span>
                  <span>{selectedField.name}</span>
                </div>
                <div className="flex justify-content-between">
                  <span className="font-semibold">{fm('area')}:</span>
                  <Tag value={`${selectedField.area} ${fm('hectares')}`} severity="success" />
                </div>
                <div className="flex justify-content-between">
                  <span className="font-semibold">{fm('perimeter')}:</span>
                  <Tag value={`${selectedField.perimeter} ${fm('meters')}`} severity="info" />
                </div>
                <div className="flex justify-content-between">
                  <span className="font-semibold">{fm('currentCrop')}:</span>
                  <span>{selectedField.crop ? selectedField.crop.name : fm('notSpecified')}</span>
                </div>
              </div>
            </Panel>

            {showWeatherLayer && weatherData[selectedField.id] && (
              <Panel header={fm('weatherConditions')} className="mb-3">
                <div className="flex align-items-center gap-3">
                  <img 
                    src={`https://openweathermap.org/img/w/${weatherData[selectedField.id].weather[0].icon}.png`} 
                    alt="Weather icon"
                    className="w-3rem h-3rem"
                  />
                  <div className="flex-1">
                    <div className="flex justify-content-between mb-2">
                      <span className="font-semibold">{fm('temperature')}:</span>
                      <span>{Math.round(weatherData[selectedField.id].main.temp)}°C</span>
                    </div>
                    <div className="flex justify-content-between mb-2">
                      <span className="font-semibold">{fm('conditions')}:</span>
                      <span className="capitalize">{weatherData[selectedField.id].weather[0].description}</span>
                    </div>
                    <div className="flex justify-content-between mb-2">
                      <span className="font-semibold">{fm('wind')}:</span>
                      <span>{weatherData[selectedField.id].wind.speed} m/s</span>
                    </div>
                    <div className="flex justify-content-between">
                      <span className="font-semibold">{fm('humidity')}:</span>
                      <span>{weatherData[selectedField.id].main.humidity}%</span>
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {canViewTasks && (
              <Panel header={fm('recentTasks')} className="mb-3">
                {loadingTasks ? (
                  <div className="flex justify-content-center py-3">
                    <ProgressSpinner style={{ width: '30px', height: '30px' }} />
                  </div>
                ) : selectedFieldTasks.length > 0 ? (
                  <div className="flex flex-column gap-2">
                    {selectedFieldTasks.map((task) => (
                      <div key={task.id} className="p-2 border-1 surface-border border-round hover:surface-hover cursor-pointer" 
                           onClick={() => router.push(`/tasks/${task.id}`)}>
                        <div className="flex justify-content-between align-items-center">
                          <div className="flex-1">
                            <div className="font-medium">{task.type.name}</div>
                            <div className="text-sm text-gray-600">
                              {task.dueDate 
                                ? `${taskT('dueDate')}: ${new Date(task.dueDate).toLocaleDateString('lt-LT')}`
                                : task.completionDate
                                  ? `${taskT('completedDate')}: ${new Date(task.completionDate).toLocaleDateString('lt-LT')}`
                                  : taskT('noDate')
                              }
                            </div>
                          </div>
                          <Tag 
                            value={task.status.name} 
                            severity={
                              task.status.name === 'Completed' ? 'success' :
                              task.status.name === 'Pending' ? 'warning' :
                              task.status.name === 'Canceled' ? 'danger' :
                              'info'
                            }
                            className="ml-2"
                          />
                        </div>
                      </div>
                    ))}
                    <div className="text-center mt-2">
                      <Button
                        label={fm('viewAllTasks')}
                        className="p-button-text p-button-sm"
                        onClick={() => router.push(`/fields/${selectedField.id}`)}
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500">
                    <i className="pi pi-inbox text-3xl mb-2"></i>
                    <p className="m-0">{fm('noTasks')}</p>
                  </div>
                )}
              </Panel>
            )}

            {canCreateTask && (
              <div className="text-center mt-4">
                <Button
                  label={fm('createTask')}
                  icon="pi pi-plus"
                  className="p-button-outlined p-button-success"
                  onClick={() => router.push(`/create-task/${selectedField.id}`)}
                />
              </div>
            )}
          </div>
        )}
      </Dialog>
    </ProtectedRoute>
  );
};

export default FieldsMapView;