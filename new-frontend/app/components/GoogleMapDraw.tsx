import React, { useRef, useState, useEffect } from "react";
import { GoogleMap, LoadScript, Polygon, Marker } from "@react-google-maps/api";
import { area as turfArea, length as turfLength, polygon as turfPolygon, lineString } from "@turf/turf";
import { Button } from "primereact/button";
import { Card } from "primereact/card";
import { useTranslations } from "next-intl";

interface GoogleMapDrawProps {
  setBoundary: (boundary: any) => void;
  setFieldArea: (area: string) => void;
  setFieldPerimeter: (perimeter: string) => void;
  existingFields?: any[];
  resetTrigger?: number;
}

const containerStyle = { width: "100%", height: "500px" };

const googleMapOptions = {
  mapTypeId: "satellite",
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  zoomControl: true,
  gestureHandling: "cooperative",
};

const GoogleMapDraw: React.FC<GoogleMapDrawProps> = ({
  setBoundary,
  setFieldArea,
  setFieldPerimeter,
  existingFields = [],
  resetTrigger,
}) => {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";

  const t = useTranslations('mapDraw');

  const [drawingPath, setDrawingPath] = useState<{ lat: number; lng: number }[]>([]);
  const [mapCenter] = useState({ lat: 55.1694, lng: 23.8813 });
  const [googleApiLoaded, setGoogleApiLoaded] = useState(false);
  const [liveMeasurement, setLiveMeasurement] = useState<{
    area: number;
    perimeter: number;
    position: { lat: number; lng: number };
  } | null>(null);
  const [polygonFinished, setPolygonFinished] = useState(false);
  const [polygonCreated, setPolygonCreated] = useState(false);

  const mapRef = useRef<google.maps.Map | null>(null);
  const googleMapsRef = useRef<any>(null);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const extractPolygonPaths = (boundary: any) => {
    if (!boundary) return [];

    let coordinates: any[] = [];

    if (boundary.geometry?.coordinates) {
      coordinates = boundary.geometry.coordinates[0];
    } else if (boundary.coordinates) {
      coordinates = boundary.coordinates[0];
    } else if (Array.isArray(boundary) && Array.isArray(boundary[0])) {
      coordinates = boundary[0];
    }

    return coordinates.map(coord => ({ lat: coord[1], lng: coord[0] }));
  };

  const calculateBounds = (fieldsToFit: any[], map: google.maps.Map) => {
    if (!googleApiLoaded || !googleMapsRef.current || !map) return;

    const bounds = new googleMapsRef.current.maps.LatLngBounds();

    fieldsToFit.forEach(field => {
      const paths = extractPolygonPaths(field.boundary);
      paths.forEach(path => bounds.extend(path));
    });

    if (!bounds.isEmpty()) {
      map.fitBounds(bounds, { padding: 100 });
    }
  };

  const updateMeasurements = (path: { lat: number; lng: number }[]) => {
    if (path.length < 2) {
      setLiveMeasurement(null);
      return;
    }

    const coords = path.map(p => [p.lng, p.lat]) as [number, number][];
    const closedCoords = coords.length >= 3 ? [...coords, coords[0]] : coords;

    const turfPoly = turfPolygon([closedCoords]);
    const turfLine = lineString(coords);

    const areaHa = turfArea(turfPoly) / 10000;
    const perimeterM = turfLength(turfLine, { units: "meters" });

    const lastPoint = path[path.length - 1];
    setLiveMeasurement({
      area: areaHa,
      perimeter: perimeterM,
      position: lastPoint,
    });
  };

  const finishDrawing = (path: { lat: number; lng: number }[]) => {
    if (path.length < 3) return;

    const coords = path.map(p => [p.lng, p.lat]);
    const closedCoords = [...coords, coords[0]];

    const geoJsonBoundary = {
      type: "Feature",
      geometry: {
        type: "Polygon",
        coordinates: [closedCoords],
      },
    };

    setBoundary(geoJsonBoundary);

    const turfPoly = turfPolygon([closedCoords]);
    const areaHa = turfArea(turfPoly) / 10000;
    const perimeterM = turfLength(lineString(coords), { units: "meters" });

    setFieldArea(areaHa.toFixed(2));
    setFieldPerimeter(perimeterM.toFixed(2));

    setLiveMeasurement(null);
    setPolygonFinished(true);

    if (mapRef.current && googleMapsRef.current) {
      const bounds = new googleMapsRef.current.maps.LatLngBounds();
      path.forEach(p => bounds.extend(p));
      mapRef.current.fitBounds(bounds, { padding: 100 });
    }
  };

  const handleMapClick = (e: google.maps.MapMouseEvent) => {
    if (!e.latLng || polygonFinished) return;

    const newPoint = { lat: e.latLng.lat(), lng: e.latLng.lng() };
    const newPath = [...drawingPath, newPoint];

    setDrawingPath(newPath);
    updateMeasurements(newPath);

    if (mapRef.current) {
      mapRef.current.panTo(newPoint);
    }
  };

  const handleCancelDrawing = () => {
    setDrawingPath([]);
    setLiveMeasurement(null);
    setPolygonFinished(false);
    setPolygonCreated(false);
    setFieldArea("");
    setFieldPerimeter("");
    setBoundary(null);
  };

  const handleResetView = () => {
    if (mapRef.current && googleMapsRef.current) {
      const bounds = new googleMapsRef.current.maps.LatLngBounds();

      existingFields.forEach(field => {
        const paths = extractPolygonPaths(field.boundary);
        paths.forEach(path => bounds.extend(path));
      });

      if (drawingPath.length > 0) {
        drawingPath.forEach(p => bounds.extend(p));
      }

      if (!bounds.isEmpty()) {
        mapRef.current.fitBounds(bounds, { padding: 100 });
      }
    }
  };

  const handleFinishDrawing = () => {
    if (!polygonRef.current) return;

    const path = polygonRef.current.getPath().getArray().map((latLng: any) => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));

    finishDrawing(path);
  };

  const handlePolygonEdit = () => {
    if (!polygonRef.current) return;

    const path = polygonRef.current.getPath().getArray().map((latLng: any) => ({
      lat: latLng.lat(),
      lng: latLng.lng(),
    }));

    setDrawingPath(path);
    updateMeasurements(path);
  };

  useEffect(() => {
    if (googleApiLoaded && mapRef.current && existingFields.length > 0) {
      calculateBounds(existingFields, mapRef.current);
    }
  }, [googleApiLoaded, existingFields]);

  useEffect(() => {
    if (resetTrigger !== undefined) {
      handleCancelDrawing();
    }
  }, [resetTrigger]);

  return (
    <div className="relative">
      {/* PrimeReact Control Buttons */}
      <div className="flex gap-3 mb-3 flex-wrap">
      <Button
          label={t('cancelDrawing')}
          icon="pi pi-times"
          className="p-button-danger"
          onClick={handleCancelDrawing}
          disabled={drawingPath.length === 0}
        />
        <Button
          label={t('resetView')}
          icon="pi pi-refresh"
          className="p-button-secondary"
          onClick={handleResetView}
        />
        <Button
          label={t('finishDrawing')}
          icon="pi pi-check"
          className="p-button-success"
          onClick={handleFinishDrawing}
          disabled={drawingPath.length < 3 || polygonFinished}
        />
      </div>

      <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["geometry"]}>
        <GoogleMap
          mapContainerStyle={containerStyle}
          center={mapCenter}
          zoom={8}
          options={googleMapOptions}
          onLoad={(map) => {
            mapRef.current = map;
            googleMapsRef.current = window.google;
            setGoogleApiLoaded(true);
          }}
          onClick={handleMapClick}
        >
          {/* Existing fields */}
          {googleApiLoaded &&
            existingFields.map(field => {
              const paths = extractPolygonPaths(field.boundary);
              if (paths.length < 3) return null;

              const centerPoint = paths.reduce(
                (acc, coord) => ({
                  lat: acc.lat + coord.lat / paths.length,
                  lng: acc.lng + coord.lng / paths.length,
                }),
                { lat: 0, lng: 0 }
              );

              return (
                <React.Fragment key={field.id}>
                  <Polygon
                    paths={paths}
                    options={{
                      fillColor: "#FF5252",
                      fillOpacity: 0.3,
                      strokeColor: "#FF5252",
                      strokeOpacity: 0.8,
                      strokeWeight: 2,
                      clickable: false,
                      draggable: false,
                      editable: false,
                    }}
                  />
                  <Marker
                    position={centerPoint}
                    label={{
                      text: field.name,
                      color: "white",
                      fontWeight: "bold",
                      fontSize: "12px",
                    }}
                    icon={{
                      url: "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D%221%22%20height%3D%221%22%20viewBox%3D%220%200%201%201%22%20xmlns%3D%22http%3A//www.w3.org/2000/svg%22%3E%3C/svg%3E",
                      scaledSize: new google.maps.Size(1, 1),
                    }}
                  />
                </React.Fragment>
              );
            })}

          {/* Editable polygon */}
          {drawingPath.length > 1 && (
            <Polygon
              onLoad={(polygon) => {
                polygonRef.current = polygon;
                setPolygonCreated(true);
              }}
              paths={drawingPath.length >= 3 ? [...drawingPath, drawingPath[0]] : drawingPath}
              options={{
                fillColor: "#2196F3",
                fillOpacity: 0.4,
                strokeColor: "#2196F3",
                strokeOpacity: 0.9,
                strokeWeight: 2,
                editable: !polygonFinished,
                draggable: false,
              }}
              onMouseUp={handlePolygonEdit}
              onDragEnd={handlePolygonEdit}
            />
          )}

          {/* Manual point markers */}
          {drawingPath.length > 0 && drawingPath.length < 3 && !polygonCreated && drawingPath.map((point, index) => (
            <Marker
              key={`manual-point-${index}`}
              position={point}
              icon={{
                url: "data:image/svg+xml;charset=UTF-8,%3Csvg%20width%3D'10'%20height%3D'10'%20xmlns%3D'http://www.w3.org/2000/svg'%3E%3Ccircle%20cx%3D'5'%20cy%3D'5'%20r%3D'4'%20fill%3D'%23007BFF'%20stroke%3D'%23ffffff'%20stroke-width%3D'1'/%3E%3C/svg%3E",
                scaledSize: new google.maps.Size(10, 10),
              }}
            />
          ))}
        </GoogleMap>
      </LoadScript>

      {/* PrimeReact Floating Measurement Card */}
      {liveMeasurement && (
        <Card
          className="absolute top-4 right-4 shadow-2 p-3 text-sm"
          title={t('currentMeasurement')}
        >
          <div><strong>{t('area')}:</strong> {liveMeasurement.area.toFixed(2)} ha</div>
          <div><strong>{t('perimeter')}:</strong> {liveMeasurement.perimeter.toFixed(2)} m</div>
        </Card>
      )}
    </div>
  );
};

export default GoogleMapDraw;
