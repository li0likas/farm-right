"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { MultiSelect } from "primereact/multiselect";
import { ProgressSpinner } from "primereact/progressspinner";
import { Dialog } from "primereact/dialog";
import { ToggleButton } from "primereact/togglebutton";
import { GoogleMap, LoadScript, Polygon, InfoWindow, Marker } from "@react-google-maps/api";
import { toast } from "sonner";
import ProtectedRoute from "@/utils/ProtectedRoute";
import api from "@/utils/api";
import { usePermissions } from "@/context/PermissionsContext";

const FieldsMapView = () => {
  const router = useRouter();
  const { hasPermission } = usePermissions();
  const mapRef = useRef(null);
  const [fields, setFields] = useState([]);
  const [filteredFields, setFilteredFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedField, setSelectedField] = useState(null);
  const [mapCenter, setMapCenter] = useState({ lat: 55.1694, lng: 23.8813 }); // Default center for Lithuania
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(9);
  const [cropOptions, setCropOptions] = useState([]);
  const [selectedCrops, setSelectedCrops] = useState([]);
  const [showWeatherLayer, setShowWeatherLayer] = useState(false);
  const [weatherData, setWeatherData] = useState({});
  const [loadingWeather, setLoadingWeather] = useState(false);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);
  const [mapBounds, setMapBounds] = useState(null);
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const googleMapsRef = useRef(null);

  const canReadFields = hasPermission("FIELD_READ");

  // Random color generator for field boundaries
  const getRandomColor = (seed) => {
    const colors = [
      "#FF5252", "#FF4081", "#E040FB", "#7C4DFF",
      "#536DFE", "#448AFF", "#40C4FF", "#18FFFF",
      "#64FFDA", "#69F0AE", "#B2FF59", "#EEFF41",
      "#FFFF00", "#FFD740", "#FFAB40", "#FF6E40"
    ];
    const index = Math.abs(seed) % colors.length;
    return colors[index];
  };

  useEffect(() => {
    if (canReadFields) {
      fetchFields();
      fetchCropOptions();
    }
  }, [canReadFields]);

  useEffect(() => {
    // Apply filtering whenever selected crops change
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
    if (!googleApiLoaded || !mapRef.current) return;
  
    const validFields = filteredFields.filter(field => isValidBoundary(field.boundary));
    if (validFields.length > 0) {
      calculateMapBounds(validFields, mapRef.current);
    }
  }, [filteredFields, googleApiLoaded]);  

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await api.get("/fields");
      console.log("Fields data:", response.data);
      setFields(response.data);
      setFilteredFields(response.data);
      
      // We'll calculate bounds after Google Maps API is loaded
    } catch (error) {
      console.error("Error fetching fields:", error);
      toast.error("Failed to fetch fields.");
    } finally {
      setLoading(false);
    }
  };

  const calculateMapBounds = (fieldsToFit, map) => {
    if (!googleApiLoaded || !googleMapsRef.current || !map) return;
  
    const bounds = new googleMapsRef.current.maps.LatLngBounds();
  
    fieldsToFit.forEach(field => {
      const paths = extractPolygonPaths(field.boundary);
      if (paths.length > 0) {
        paths.forEach(path => {
          bounds.extend(path);
        });
      }
    });
  
    // ✅ Apply bounds immediately
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
      console.error("Error fetching crop options:", error);
      toast.error("Failed to load crop options.");
    }
  };

  const fetchWeatherForFields = async () => {
    setLoadingWeather(true);
    const weatherResults = {};
    
    try {
      // Get weather data for each field
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
      console.error("Error fetching weather data:", error);
      toast.error("Failed to load weather data.");
    } finally {
      setLoadingWeather(false);
    }
  };

  const filterFields = () => {
    if (!fields.length) return;
    
    let filtered = [...fields];
    
    // Filter by selected crops
    if (selectedCrops.length > 0) {
      filtered = filtered.filter(field => 
        selectedCrops.includes(field.cropId)
      );
    }
    
    setFilteredFields(filtered);
  };

  // Check if boundary has valid coordinates
  const isValidBoundary = (boundary) => {
    if (!boundary) return false;
    
    try {
      // Check for different possible structures
      if (boundary.geometry && boundary.geometry.coordinates && 
          Array.isArray(boundary.geometry.coordinates[0]) && 
          boundary.geometry.coordinates[0].length > 0) {
        return true;
      }
      
      // Direct coordinates array
      if (Array.isArray(boundary.coordinates) && 
          Array.isArray(boundary.coordinates[0]) && 
          boundary.coordinates[0].length > 0) {
        return true;
      }
      
      // Direct polygon array
      if (Array.isArray(boundary) && 
          Array.isArray(boundary[0]) && 
          boundary[0].length > 0) {
        return true;
      }
    } catch (e) {
      console.error("Error validating boundary:", e);
      return false;
    }
    
    return false;
  };

  // Extract polygon paths from different possible boundary formats
  const extractPolygonPaths = (boundary) => {
    if (!boundary) return [];
    
    try {
      let coordinates = [];
      
      // GeoJSON format
      if (boundary.geometry && boundary.geometry.coordinates && 
          Array.isArray(boundary.geometry.coordinates[0])) {
        coordinates = boundary.geometry.coordinates[0];
      }
      // Direct coordinates array
      else if (Array.isArray(boundary.coordinates) && 
               Array.isArray(boundary.coordinates[0])) {
        coordinates = boundary.coordinates[0];
      }
      // Direct polygon array
      else if (Array.isArray(boundary) && 
               Array.isArray(boundary[0])) {
        coordinates = boundary[0];
      }
      
      // Convert to {lat, lng} format
      return coordinates.map(coord => {
        // Check if coord is an array with at least 2 elements
        if (Array.isArray(coord) && coord.length >= 2) {
          return {
            lat: coord[1],
            lng: coord[0]
          };
        }
        // If coord already has lat/lng properties
        else if (coord.lat !== undefined && coord.lng !== undefined) {
          return {
            lat: coord.lat,
            lng: coord.lng
          };
        }
        return null;
      }).filter(coord => coord !== null); // Filter out invalid coordinates
    } catch (e) {
      console.error("Error extracting polygon paths:", e);
      return [];
    }
  };

  // Extract center point from boundary
  const extractCenterPoint = (boundary) => {
    const paths = extractPolygonPaths(boundary);
    if (paths.length === 0) return null;
    
    // Calculate center as average of all coordinates
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
    
    // Center map on the selected field
    const centerPoint = extractCenterPoint(field.boundary);
    if (centerPoint) {
      setMapCenter(centerPoint);
      setZoomLevel(15); // Zoom in when field is selected
    }
  };

  const handleViewDetails = () => {
    setDetailsVisible(true);
  };

  const handleInspectField = () => {
    router.push(`/fields/${selectedField.id}`);
  };

  const getUserLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
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
        toast.success("Location found!");
      },
      (error) => {
        console.error("Error getting location:", error);
        toast.error("Unable to retrieve your location. " + error.message);
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );
  };

  const renderWeatherInfo = (fieldId, position) => {
    const weather = weatherData[fieldId];
    if (!weather) return null;
    
    return (
      <div 
        className="bg-white p-2 rounded shadow-lg text-center"
        style={{ minWidth: "120px" }}
      >
        <h4 className="text-sm font-bold">{weather.name}</h4>
        <div className="flex items-center justify-center">
          <span className="text-xl">{Math.round(weather.main.temp)}°C</span>
          <img 
            src={`https://openweathermap.org/img/w/${weather.weather[0].icon}.png`} 
            alt={weather.weather[0].description}
            className="w-8 h-8"
          />
        </div>
        <p className="text-xs capitalize">{weather.weather[0].description}</p>
        <p className="text-xs">Wind: {weather.wind.speed} m/s</p>
      </div>
    );
  };

  const containerStyle = {
    width: "100%",
    height: "75vh",
  };

  const mapOptions = {
    mapTypeId: "satellite",
    streetViewControl: false,
    mapTypeControl: true,
    zoomControl: true,
    fullscreenControl: true,
  };

  // Handle Google Maps API Load
  const handleGoogleApiLoaded = (google) => {
    googleMapsRef.current = google;
    setGoogleApiLoaded(true);
    
    // Now that Google Maps is loaded, we can calculate bounds
    const validFields = filteredFields.filter(field => isValidBoundary(field.boundary));
    if (validFields.length > 0) {
      calculateMapBounds(validFields, mapRef.current);
    }
  };

  if (!canReadFields) {
    return (
      <div className="container mx-auto p-6 text-center text-lg text-red-600 font-semibold">
        🚫 You do not have permission to view fields.
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="container mx-auto p-4">
        <Card title="Farm Fields Map View" className="mb-4">
          <div className="grid mb-4">
            <div className="col-12 md:col-6">
              <h5>Filter Fields</h5>
              <MultiSelect
                value={selectedCrops}
                options={cropOptions}
                onChange={(e) => setSelectedCrops(e.value)}
                placeholder="Filter by Crop Type"
                className="w-full"
                display="chip"
              />
            </div>
            <div className="col-12 md:col-6">
              <div className="flex flex-column md:flex-row justify-content-between align-items-center gap-3">
                <div className="flex align-items-center">
                  <ToggleButton
                    checked={showWeatherLayer}
                    onChange={(e) => setShowWeatherLayer(e.value)}
                    onLabel="Weather On"
                    offLabel="Weather Off"
                    onIcon="pi pi-cloud"
                    offIcon="pi pi-cloud"
                    className="mr-2"
                    disabled={loadingWeather}
                  />
                  {loadingWeather && <ProgressSpinner style={{ width: '20px', height: '20px' }} />}
                </div>
                
                <Button
                  icon={loadingLocation ? "pi pi-spin pi-spinner" : "pi pi-map-marker"}
                  label={loadingLocation ? "Locating..." : "My Location"}
                  onClick={getUserLocation}
                  disabled={loadingLocation}
                  className="p-button-info"
                />
              </div>
            </div>
          </div>
          
          {loading ? (
            <div className="flex justify-center p-6">
              <ProgressSpinner />
            </div>
          ) : (
            <div className="grid">
              <div className="col-12">
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
                      handleGoogleApiLoaded({ maps: window.google.maps });
                    
                      const validFields = filteredFields.filter(field => isValidBoundary(field.boundary));
                    
                      if (validFields.length > 0) {
                        calculateMapBounds(validFields, map);
                      }
                    }}
                    
                  >
                    {googleApiLoaded && filteredFields.map((field) => {
                      if (!isValidBoundary(field.boundary)) return null;
                      
                      const polygonPaths = extractPolygonPaths(field.boundary);
                      if (polygonPaths.length < 3) return null; // Need at least 3 points for a polygon
                      
                      const fieldColor = getRandomColor(field.id);
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
                          
                          {/* Field name marker */}
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
                                scaledSize: new googleMapsRef.current.maps.Size(1, 1),
                              }}
                            />
                          )}
                          
                          {/* Show weather info if enabled */}
                          {showWeatherLayer && centerPoint && weatherData[field.id] && (
                            <InfoWindow
                              position={centerPoint}
                              options={{ pixelOffset: new googleMapsRef.current.maps.Size(0, -20) }}
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
                                <h3 className="text-lg font-bold">{field.name}</h3>
                                <p>Area: {field.area} ha</p>
                                <p>Crop: {field.crop ? field.crop.name : "Not specified"}</p>
                                <Button
                                  label="View Details"
                                  className="p-button-sm p-button-primary mt-2"
                                  onClick={handleViewDetails}
                                />
                              </div>
                            </InfoWindow>
                          )}
                        </React.Fragment>
                      );
                    })}
                    
                    {/* User location marker */}
                    {googleApiLoaded && userLocation && (
                      <Marker
                        position={userLocation}
                        icon={{
                          path: googleMapsRef.current.maps.SymbolPath.CIRCLE,
                          scale: 10,
                          fillColor: "#4285F4",
                          fillOpacity: 1,
                          strokeColor: "#FFFFFF",
                          strokeWeight: 2,
                        }}
                        title="Your Location"
                      />
                    )}
                  </GoogleMap>
                </LoadScript>
                
                <div className="mt-4 flex justify-between">
                  <span className="text-sm text-gray-600">
                    {filteredFields.filter(field => isValidBoundary(field.boundary)).length} fields displayed
                    {selectedCrops.length > 0 && ` (filtered from ${fields.length} total)`}
                  </span>
                  <Button
                    label="Create New Field"
                    icon="pi pi-plus"
                    className="p-button-success"
                    onClick={() => router.push('/create-field')}
                    disabled={!hasPermission("FIELD_CREATE")}
                  />
                </div>
              </div>
            </div>
          )}
        </Card>
        
        {/* Field Details Dialog */}
        <Dialog
          header={selectedField ? selectedField.name : "Field Details"}
          visible={detailsVisible}
          style={{ width: "50vw" }}
          onHide={() => setDetailsVisible(false)}
          footer={
            <div className="flex justify-content-end">
              <Button
                label="Close"
                icon="pi pi-times"
                className="p-button-text"
                onClick={() => setDetailsVisible(false)}
              />
              <Button
                label="Inspect Field"
                icon="pi pi-search"
                onClick={handleInspectField}
              />
            </div>
          }
        >
          {selectedField && (
            <div className="p-2">
              <div className="grid">
                <div className="col-6">
                  <h5>Field Information</h5>
                  <p><strong>Name:</strong> {selectedField.name}</p>
                  <p><strong>Area:</strong> {selectedField.area} hectares</p>
                  <p><strong>Perimeter:</strong> {selectedField.perimeter} meters</p>
                  <p><strong>Current Crop:</strong> {
                    selectedField.crop ? selectedField.crop.name : "Not specified"
                  }</p>
                  
                  {showWeatherLayer && weatherData[selectedField.id] && (
                    <div className="mt-4 p-3 bg-gray-100 rounded">
                      <h5>Weather Conditions</h5>
                      <div className="flex items-center">
                        <img 
                          src={`https://openweathermap.org/img/w/${weatherData[selectedField.id].weather[0].icon}.png`} 
                          alt="Weather icon"
                        />
                        <div>
                          <p><strong>Temperature:</strong> {Math.round(weatherData[selectedField.id].main.temp)}°C</p>
                          <p><strong>Conditions:</strong> {weatherData[selectedField.id].weather[0].description}</p>
                          <p><strong>Wind:</strong> {weatherData[selectedField.id].wind.speed} m/s</p>
                          <p><strong>Humidity:</strong> {weatherData[selectedField.id].main.humidity}%</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="col-6">
                  <h5>Recent Activity</h5>
                  {/* You could add a list of recent tasks related to this field */}
                  <p className="text-gray-500">No recent activities found for this field.</p>
                  
                  <Button
                    label="Create Task"
                    icon="pi pi-plus"
                    className="p-button-outlined mt-3"
                    onClick={() => router.push(`/create-task/${selectedField.id}`)}
                    disabled={!hasPermission("FIELD_TASK_CREATE")}
                  />
                </div>
              </div>
            </div>
          )}
        </Dialog>
      </div>
    </ProtectedRoute>
  );
};

export default FieldsMapView;