"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "primereact/card";
import { Button } from "primereact/button";
import { Dropdown } from "primereact/dropdown";
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
  const [weatherData, setWeatherData] = useState(null);
  const [userLocation, setUserLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

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
    if (showWeatherLayer) {
      fetchWeatherData();
    }
  }, [showWeatherLayer, mapCenter]);

  useEffect(() => {
    // Apply filtering whenever selected crops change
    filterFields();
  }, [selectedCrops, fields]);

  const fetchFields = async () => {
    try {
      setLoading(true);
      const response = await api.get("/fields");
      console.log("Fields data:", response.data);
      setFields(response.data);
      setFilteredFields(response.data);
      
      // Center map on the first field with valid coordinates if available
      if (response.data.length > 0) {
        const validField = response.data.find(field => isValidBoundary(field.boundary));
        if (validField) {
          const centerPoint = extractCenterPoint(validField.boundary);
          if (centerPoint) {
            setMapCenter(centerPoint);
          }
        }
      }
    } catch (error) {
      console.error("Error fetching fields:", error);
      toast.error("Failed to fetch fields.");
    } finally {
      setLoading(false);
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

// In the FieldsMapView component

const fetchWeatherData = async () => {
    try {
      const response = await api.get("/weather/forecast", {
        headers: {
          'x-coordinates-lat': mapCenter.lat.toString(),
          'x-coordinates-lng': mapCenter.lng.toString(),
        }
      });
      setWeatherData(response.data);
    } catch (error) {
      console.error("Error fetching weather data:", error);
      toast.error("Failed to load weather data.");
      setShowWeatherLayer(false);
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
                  />
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
                      
                      // Add weather layer if enabled
                      if (showWeatherLayer) {
                        const weatherLayer = new google.maps.weather.WeatherLayer({
                          temperatureUnits: google.maps.weather.TemperatureUnit.CELSIUS,
                          windSpeedUnits: google.maps.weather.WindSpeedUnit.KILOMETERS_PER_HOUR
                        });
                        weatherLayer.setMap(map);
                        
                        const cloudLayer = new google.maps.weather.CloudLayer();
                        cloudLayer.setMap(map);
                      }
                    }}
                  >
                    {filteredFields.map((field) => {
                      if (!isValidBoundary(field.boundary)) return null;
                      
                      const polygonPaths = extractPolygonPaths(field.boundary);
                      if (polygonPaths.length < 3) return null; // Need at least 3 points for a polygon
                      
                      const fieldColor = getRandomColor(field.id);
                      
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
                    {userLocation && (
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
                        title="Your Location"
                      />
                    )}
                    
                    {/* Weather data display */}
                    {showWeatherLayer && weatherData && (
                      <InfoWindow
                        position={mapCenter}
                        options={{ pixelOffset: new google.maps.Size(0, -40) }}
                      >
                        <div className="p-2 text-center">
                          <h4 className="font-bold">{weatherData.name}</h4>
                          <p className="text-lg">
                            {weatherData.main.temp}°C
                            <img 
                              src={`http://openweathermap.org/img/w/${weatherData.weather[0].icon}.png`} 
                              alt={weatherData.weather[0].description}
                              className="inline ml-2"
                            />
                          </p>
                          <p>{weatherData.weather[0].description}</p>
                          <p>Wind: {weatherData.wind.speed} m/s</p>
                        </div>
                      </InfoWindow>
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