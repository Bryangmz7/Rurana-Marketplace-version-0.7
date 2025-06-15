
import React, { useRef, useEffect, useState } from 'react';
import * as mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface LocationPickerProps {
  mapboxToken: string;
  onLocationSelect: (address: string) => void;
  onClose: () => void;
}

const LocationPicker = ({ mapboxToken, onLocationSelect, onClose }: LocationPickerProps) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const marker = useRef<mapboxgl.Marker | null>(null);
  const [selectedAddress, setSelectedAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (!mapboxToken || !mapContainer.current) {
      console.error("Mapbox token or container not available.");
      return;
    }
    
    if (map.current) return; // initialize map only once

    mapboxgl.accessToken = mapboxToken;
    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-77.0428, -12.0464], // Lima, Peru
      zoom: 12,
    });

    const mapInstance = map.current;

    mapInstance.on('click', (e) => {
      const { lng, lat } = e.lngLat;
      
      if (marker.current) {
        marker.current.setLngLat([lng, lat]);
      } else {
        marker.current = new mapboxgl.Marker()
          .setLngLat([lng, lat])
          .addTo(mapInstance);
      }
      
      reverseGeocode(lng, lat);
    });

    return () => {
        mapInstance.remove();
        map.current = null;
    }
  }, [mapboxToken]);

  const reverseGeocode = async (lng: number, lat: number) => {
    setLoading(true);
    setSelectedAddress('');
    try {
      const response = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=address&access_token=${mapboxToken}`
      );
      if (!response.ok) {
        throw new Error('Failed to fetch address');
      }
      const data = await response.json();
      if (data.features && data.features.length > 0) {
        const address = data.features[0].place_name;
        setSelectedAddress(address);
      } else {
        setSelectedAddress('No se pudo encontrar una dirección para este punto.');
        toast({
          title: "Dirección no encontrada",
          description: "Intenta seleccionar otro punto en el mapa.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Error reverse geocoding:', error);
      toast({
        title: "Error",
        description: "No se pudo obtener la dirección para la ubicación seleccionada.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = () => {
    if (selectedAddress) {
      onLocationSelect(selectedAddress);
      onClose();
    } else {
        toast({
            title: "Selecciona una ubicación",
            description: "Por favor, haz clic en el mapa para seleccionar una dirección.",
            variant: "destructive",
        })
    }
  };

  return (
    <div className="h-[60vh] flex flex-col gap-4">
      <div className="flex-grow relative">
        <div ref={mapContainer} className="absolute inset-0 rounded-md" />
      </div>
      <div className="p-2 bg-gray-100 rounded-md text-sm min-h-[40px] flex items-center">
        {loading ? (
          <div className="flex items-center gap-2 text-gray-500">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>Buscando dirección...</span>
          </div>
        ) : selectedAddress ? (
          <span><strong>Dirección:</strong> {selectedAddress}</span>
        ) : (
          <span className="text-gray-500">Haz clic en el mapa para seleccionar una ubicación.</span>
        )}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button onClick={handleConfirm} disabled={!selectedAddress || loading}>
          Confirmar Dirección
        </Button>
      </div>
    </div>
  );
};

export default LocationPicker;
