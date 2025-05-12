import React, { useMemo } from 'react';
import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';

interface GoogleMapComponentProps {
  center: { lat: number; lng: number };
  boundary?: any;
}

// Memoized constants
const containerStyle = {
  width: '100%',
  height: '300px'
};

const googleMapOptions = {
  mapTypeId: 'satellite',
  streetViewControl: false,
  fullscreenControl: false,
  mapTypeControl: false,
  zoomControl: false,
  gestureHandling: 'cooperative'
};

const polygonOptions = {
  fillColor: 'blue',
  fillOpacity: 0.2,
  strokeColor: 'blue',
  strokeOpacity: 0.6,
  strokeWeight: 2
};

const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({ center, boundary }) => {
  const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';
  
  // Memoized polygon paths
  const polygonPaths = useMemo(() => {
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
  }, [boundary]);
  
  // Only render polygon if we have at least 3 points
  const shouldRenderPolygon = polygonPaths.length >= 3;

  return (
    <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
      <GoogleMap 
        mapContainerStyle={containerStyle} 
        center={center} 
        zoom={15} 
        options={googleMapOptions}
      >
        {shouldRenderPolygon && (
          <Polygon
            paths={polygonPaths}
            options={polygonOptions}
          />
        )}
      </GoogleMap>
    </LoadScript>
  );
};

export default React.memo(GoogleMapComponent);