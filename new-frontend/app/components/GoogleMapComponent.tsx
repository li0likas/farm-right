import { GoogleMap, LoadScript, Polygon } from '@react-google-maps/api';

interface GoogleMapComponentProps {
    center: { lat: number; lng: number };
    boundary?: { type: string; geometry: { type: string; coordinates: number[][][] } };
}

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

const GoogleMapComponent = ({ center, boundary }: GoogleMapComponentProps) => {
    const GOOGLE_MAPS_API_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || '';

    const polygonPaths =
        boundary?.geometry?.coordinates?.[0] && Array.isArray(boundary.geometry.coordinates[0])
            ? boundary.geometry.coordinates[0].map((coord) => ({
                  lat: coord[1], // Latitude
                  lng: coord[0]  // Longitude
              }))
            : [];
    return (
        <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY}>
            <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15} options={googleMapOptions}>
                {polygonPaths.length >= 3 && (
                    <Polygon
                        paths={polygonPaths}
                        options={{
                            fillColor: 'blue',
                            fillOpacity: 0.2,
                            strokeColor: 'blue',
                            strokeOpacity: 0.6,
                            strokeWeight: 2
                        }}
                    />
                )}
            </GoogleMap>
        </LoadScript>
    );
};

export default GoogleMapComponent;
