import React, { useEffect, useRef, useState } from 'react';
import { useLogistics } from '../../contexts/LogisticsContext';

export function extractCoordinatesFromUrl(val) {
  if (!val) return null;
  // 1. Match modern Maps URL pattern: @lat,lng
  const atMatch = val.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
  if (atMatch) return { lat: parseFloat(atMatch[1]), lng: parseFloat(atMatch[2]) };
  
  // 2. Match legacy/query Maps URL pattern: ?q=lat,lng or ?q=lat%2Clng
  const qMatch = val.match(/[?&]q=(-?\d+\.\d+)(?:,|%2C)(-?\d+\.\d+)/i);
  if (qMatch) return { lat: parseFloat(qMatch[1]), lng: parseFloat(qMatch[2]) };
  
  return null;
}

export default function MapPickerModal({ isOpen, initialAddress = '', onConfirmAddress, onClose }) {
  const { showAlert } = useLogistics();
  const [searchInput, setSearchInput] = useState('');
  const [pickedAddress, setPickedAddress] = useState('');
  
  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);

  const defaultLocation = { lat: -5.1882, lng: -37.3441 }; // Mossoró-RN Base

  useEffect(() => {
    if (!isOpen) return;

    setSearchInput('');
    setPickedAddress(initialAddress || '');

    const timer = setTimeout(() => {
      initMap();
    }, 100);

    return () => clearTimeout(timer);
  }, [isOpen, initialAddress]);

  const initMap = () => {
    if (typeof window.google === 'undefined' || !window.google.maps) {
      return;
    }

    geocoderRef.current = new window.google.maps.Geocoder();

    if (!mapInstanceRef.current && mapContainerRef.current) {
      mapInstanceRef.current = new window.google.maps.Map(mapContainerRef.current, {
        zoom: 14,
        center: defaultLocation,
        mapTypeControl: false,
        streetViewControl: false,
        gestureHandling: 'greedy',
      });

      markerInstanceRef.current = new window.google.maps.Marker({
        map: mapInstanceRef.current,
        draggable: true,
        animation: window.google.maps.Animation.DROP,
        position: defaultLocation,
      });

      mapInstanceRef.current.addListener('click', (e) => {
        markerInstanceRef.current.setPosition(e.latLng);
        geocodePosition(e.latLng);
      });

      markerInstanceRef.current.addListener('dragend', (e) => {
        geocodePosition(e.latLng);
      });
    }

    // Set Autocomplete
    if (searchInputRef.current && !autocompleteRef.current) {
      autocompleteRef.current = new window.google.maps.places.Autocomplete(searchInputRef.current, {
        componentRestrictions: { country: 'br' },
        fields: ['geometry', 'formatted_address', 'name'],
      });

      if (mapInstanceRef.current) {
        autocompleteRef.current.bindTo('bounds', mapInstanceRef.current);
      }

      autocompleteRef.current.addListener('place_changed', () => {
        const place = autocompleteRef.current.getPlace();
        if (!place.geometry || !place.geometry.location) {
          const val = searchInputRef.current.value;
          const extractedCoords = extractCoordinatesFromUrl(val);
          if (extractedCoords && mapInstanceRef.current) {
            mapInstanceRef.current.setCenter(extractedCoords);
            mapInstanceRef.current.setZoom(18);
            markerInstanceRef.current.setPosition(extractedCoords);
            geocodePosition(extractedCoords);
          }
          return;
        }

        if (place.geometry.viewport) {
          mapInstanceRef.current.fitBounds(place.geometry.viewport);
        } else {
          mapInstanceRef.current.setCenter(place.geometry.location);
          mapInstanceRef.current.setZoom(17);
        }

        markerInstanceRef.current.setPosition(place.geometry.location);
        setPickedAddress(place.formatted_address || place.name || '');
      });
    }

    // Geocode initialAddress if present
    if (initialAddress && geocoderRef.current && mapInstanceRef.current) {
      const extractedCoords = extractCoordinatesFromUrl(initialAddress);
      if (extractedCoords) {
        mapInstanceRef.current.setCenter(extractedCoords);
        mapInstanceRef.current.setZoom(17);
        markerInstanceRef.current.setPosition(extractedCoords);
        geocodePosition(extractedCoords);
      } else if (!initialAddress.startsWith('http')) {
        geocoderRef.current.geocode(
          { address: initialAddress, componentRestrictions: { country: 'BR' } },
          (results, status) => {
            if (status === 'OK' && results && results[0]) {
              mapInstanceRef.current.setCenter(results[0].geometry.location);
              mapInstanceRef.current.setZoom(17);
              markerInstanceRef.current.setPosition(results[0].geometry.location);
              setPickedAddress(results[0].formatted_address);
            }
          }
        );
      }
    }
  };

  const geocodePosition = (pos) => {
    if (!geocoderRef.current) return;
    geocoderRef.current.geocode({ location: pos }, (responses, status) => {
      if (status === 'OK' && responses && responses[0]) {
        setPickedAddress(responses[0].formatted_address);
      } else {
        const lat = typeof pos.lat === 'function' ? pos.lat() : pos.lat;
        const lng = typeof pos.lng === 'function' ? pos.lng() : pos.lng;
        setPickedAddress(`${lat}, ${lng}`);
      }
    });
  };

  const handleSearchSubmit = () => {
    const val = searchInput.trim();
    if (!val || !geocoderRef.current || !mapInstanceRef.current) return;

    const extractedCoords = extractCoordinatesFromUrl(val);
    if (extractedCoords) {
      mapInstanceRef.current.setCenter(extractedCoords);
      mapInstanceRef.current.setZoom(18);
      markerInstanceRef.current.setPosition(extractedCoords);
      geocodePosition(extractedCoords);
      return;
    }

    geocoderRef.current.geocode(
      { address: val, componentRestrictions: { country: 'BR' } },
      (results, status) => {
        if (status === 'OK' && results && results[0]) {
          mapInstanceRef.current.setCenter(results[0].geometry.location);
          mapInstanceRef.current.setZoom(17);
          markerInstanceRef.current.setPosition(results[0].geometry.location);
          setPickedAddress(results[0].formatted_address);
        } else {
          showAlert({ title: 'Aviso', message: 'Local exato não encontrado via texto. Tente arrastar o pino no mapa.' });
        }
      }
    );
  };

  const handleConfirm = () => {
    if (pickedAddress && onConfirmAddress) {
      onConfirmAddress(pickedAddress);
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-sm flex items-center justify-center z-[200] transition-opacity p-0">
      <div className="bg-white w-full h-full flex flex-col animate-fade-slide relative">
        
        {/* Header & Search */}
        <div className="p-3 md:p-4 bg-white border-b border-gray-200 shadow-sm z-10 flex flex-col md:flex-row gap-3 items-start md:items-center">
          <div className="flex justify-between items-center w-full md:w-auto">
            <h3 className="text-lg font-bold text-gray-900 mr-4 whitespace-nowrap">Confirmar Local</h3>
            <button 
              type="button"
              onClick={onClose} 
              className="md:hidden text-gray-500 hover:text-red-500 p-1"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>

          <div className="flex-1 w-full relative flex gap-2">
            <input 
              ref={searchInputRef}
              type="text" 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSearchSubmit(); }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg text-sm py-2 px-3 outline-none focus:border-blue-500 transition-colors shadow-inner" 
              placeholder="Digite endereço, cole link ou coordenadas..."
            />
            <button 
              type="button"
              onClick={handleSearchSubmit} 
              className="px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded-lg text-sm font-bold shadow-md transition-colors whitespace-nowrap"
            >
              Buscar
            </button>
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="hidden md:block px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg text-sm font-bold transition-colors shrink-0"
          >
            Cancelar
          </button>
        </div>
        
        {/* Map Canvas */}
        <div ref={mapContainerRef} className="flex-grow bg-gray-200 relative w-full h-full" />
        
        {/* Footer Confirmation */}
        <div className="p-3 border-t border-gray-200 bg-white shadow-[0_-4px_10px_-1px_rgba(0,0,0,0.05)] z-10 flex flex-col md:flex-row gap-3 items-center justify-between">
          <input 
            type="text" 
            readOnly 
            value={pickedAddress} 
            className="w-full md:flex-1 bg-blue-50/50 border border-blue-100 rounded-lg text-sm py-2 px-3 outline-none font-bold text-blue-900 shadow-inner" 
            placeholder="Arraste o pino ou pesquise para selecionar um endereço..."
          />
          <button 
            type="button"
            onClick={handleConfirm} 
            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-bold shadow-md transition-all uppercase tracking-wide flex-shrink-0"
          >
            Confirmar Local
          </button>
        </div>

      </div>
    </div>
  );
}
