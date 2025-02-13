import React, { useEffect, useRef, useState } from "react";
import { GoogleMap, LoadScript, Polygon, DrawingManager } from "@react-google-maps/api";
import { area, length } from "@turf/turf";

interface GoogleMapDrawProps {
  setBoundary: (boundary: any) => void;
  setFieldArea: (area: string) => void;
  setFieldPerimeter: (perimeter: string) => void;
}

const containerStyle = { width: "100%", height: "400px" };
const googleMapOptions = {
  mapTypeId: "satellite",
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  zoomControl: true,
  gestureHandling: "cooperative",
};

const GoogleMapDraw: React.FC<GoogleMapDrawProps> = ({ setBoundary, setFieldArea, setFieldPerimeter }) => {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "";
  const [polygonPath, setPolygonPath] = useState<{ lat: number; lng: number }[]>([]);
  const polygonRef = useRef<google.maps.Polygon | null>(null);

  const handlePolygonComplete = (polygon: google.maps.Polygon) => {
    polygonRef.current = polygon;
    const path = polygon.getPath().getArray().map((point) => ({ lat: point.lat(), lng: point.lng() }));
    setPolygonPath(path);

    const geoJsonBoundary = {
      type: "Feature",
      geometry: { type: "Polygon", coordinates: [path.map((coord) => [coord.lng, coord.lat])] },
    };

    setBoundary(geoJsonBoundary);

    // Calculate area in hectares
    const fieldArea = area(geoJsonBoundary) / 10000; // Convert from square meters to hectares
    setFieldArea(fieldArea.toFixed(2));

    // Calculate perimeter in meters
    const fieldPerimeter = length(geoJsonBoundary, { units: "meters" });
    setFieldPerimeter(fieldPerimeter.toFixed(2));
  };

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={["drawing"]}>
      <GoogleMap mapContainerStyle={containerStyle} center={{ lat: 56.345, lng: 23.728 }} zoom={15} options={googleMapOptions}>
        {polygonPath.length > 0 && <Polygon paths={polygonPath} options={{ fillColor: "blue", fillOpacity: 0.2, strokeColor: "blue" }} />}
        <DrawingManager options={{ drawingControl: true, drawingControlOptions: { drawingModes: ["polygon"] } }} onPolygonComplete={handlePolygonComplete} />
      </GoogleMap>
    </LoadScript>
  );
};

export default GoogleMapDraw;
