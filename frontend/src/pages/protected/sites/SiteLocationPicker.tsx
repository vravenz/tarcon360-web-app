import React, { useState, useCallback, useEffect } from 'react';
import { GoogleMap, useJsApiLoader, Marker, Circle } from '@react-google-maps/api';

interface SiteLocationPickerProps {
  onLocationChange: (latitude: number, longitude: number, radius: number) => void;
}

const containerStyle = {
  width: '100%',
  height: '400px',
};

const defaultCenter = { lat: 24.8607, lng: 67.0011 }; // Adjust as needed

const SiteLocationPicker: React.FC<SiteLocationPickerProps> = ({ onLocationChange }) => {
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.REACT_APP_GOOGLE_MAPS_API_KEY || '',
  });

  const [markerPosition, setMarkerPosition] = useState<{ lat: number; lng: number } | null>(null);
  const [radius, setRadius] = useState<number>(100);

  // Sync any change in marker or radius to parent once
  useEffect(() => {
    if (markerPosition) {
      onLocationChange(markerPosition.lat, markerPosition.lng, radius);
    }
  }, [markerPosition, radius, onLocationChange]);

  const onMapClick = useCallback((event: google.maps.MapMouseEvent) => {
    if (event.latLng) {
      const pos = { lat: event.latLng.lat(), lng: event.latLng.lng() };
      setMarkerPosition(pos);
      // onLocationChange will also fire via useEffect
    }
  }, []);

  const handleRadiusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newRadius = parseInt(e.target.value, 10);
    setRadius(newRadius);
    // onLocationChange will fire via useEffect
  };

  if (!isLoaded) {
    return <div>Loading map...</div>;
  }

  return (
    <div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPosition || defaultCenter}
        zoom={12}
        onClick={onMapClick}
      >
        {markerPosition && (
          <Marker
            position={markerPosition}
            draggable
            onDragEnd={(e) => {
              if (e.latLng) {
                const newPos = { lat: e.latLng.lat(), lng: e.latLng.lng() };
                setMarkerPosition(newPos);
                // onLocationChange will fire via useEffect
              }
            }}
          />
        )}

        {markerPosition && (
          <Circle
            center={markerPosition}
            radius={radius}
            options={{
              fillColor: '#00AA00',
              fillOpacity: 0.2,
              strokeColor: '#00AA00',
              strokeOpacity: 0.5,
              strokeWeight: 1,
            }}
          />
        )}
      </GoogleMap>

      <div className="mt-2">
        <label className="block mb-1">Site Radius (meters)</label>
        <input
          type="range"
          min="50"
          max="1000"
          value={radius}
          onChange={handleRadiusChange}
          className="w-full"
        />
        <p>{radius} meters</p>
      </div>
    </div>
  );
};

export default SiteLocationPicker;
