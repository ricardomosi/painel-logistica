import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useLogistics } from '../../contexts/LogisticsContext';
import {
  extractCoordinates,
  extractFirstShortMapsUrl,
  formatResolvedAddressForForm,
} from '../../lib/locationUtils';
import { resolveShortMapsUrlClient } from '../../services/mapsLinkService';

export function extractCoordinatesFromUrl(val) {
  return extractCoordinates(val);
}

const DEFAULT_MOSSORO = { lat: -5.1882, lng: -37.3441 };

function safeClearListeners(instance) {
  try {
    if (instance && typeof window !== 'undefined' && window.google?.maps?.event) {
      window.google.maps.event.clearInstanceListeners(instance);
    }
  } catch {
    // Ignore Google Maps teardown warnings
  }
}

export default function MapPickerModal({ isOpen, initialAddress = '', onConfirmAddress, onClose }) {
  const { showAlert } = useLogistics();
  const [searchInput, setSearchInput] = useState('');
  const [pickedAddress, setPickedAddress] = useState('');
  const [resolvingAddress, setResolvingAddress] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerInstanceRef = useRef(null);
  const geocoderRef = useRef(null);
  const autocompleteRef = useRef(null);
  const searchInputRef = useRef(null);
  const isOpenRef = useRef(false);
  const geocodeSeqRef = useRef(0);
  const initialAddressRef = useRef(initialAddress);

  initialAddressRef.current = initialAddress;
  isOpenRef.current = isOpen;

  const geocodePosition = useCallback((pos) => {
    const seq = ++geocodeSeqRef.current;
    const lat = typeof pos.lat === 'function' ? pos.lat() : Number(pos.lat);
    const lng = typeof pos.lng === 'function' ? pos.lng() : Number(pos.lng);
    const coordFallback = isFinite(lat) && isFinite(lng) ? `${lat.toFixed(6)}, ${lng.toFixed(6)}` : '';

    // Set coordinate immediately so the button works right away even while address text resolves
    if (coordFallback) {
      setPickedAddress(coordFallback);
    }

    if (!geocoderRef.current) {
      setResolvingAddress(false);
      return;
    }

    setResolvingAddress(true);
    let settled = false;
    const safetyTimer = setTimeout(() => {
      if (!settled && isOpenRef.current && seq === geocodeSeqRef.current) {
        settled = true;
        setResolvingAddress(false);
      }
    }, 3500);

    try {
      geocoderRef.current.geocode({ location: { lat, lng } }, (responses, status) => {
        if (settled) return;
        settled = true;
        clearTimeout(safetyTimer);
        if (!isOpenRef.current || seq !== geocodeSeqRef.current) return;

        setResolvingAddress(false);
        if (status === 'OK' && responses && responses[0]?.formatted_address) {
          setPickedAddress(responses[0].formatted_address);
        } else if (coordFallback) {
          setPickedAddress(coordFallback);
        }
      });
    } catch {
      if (!settled) {
        settled = true;
        clearTimeout(safetyTimer);
        if (isOpenRef.current && seq === geocodeSeqRef.current) {
          setResolvingAddress(false);
        }
      }
    }
  }, []);

  const focusLocation = useCallback((latLngOrLiteral, zoom = 17) => {
    const map = mapInstanceRef.current;
    const marker = markerInstanceRef.current;
    if (!map || !marker || !latLngOrLiteral) return;
    marker.setPosition(latLngOrLiteral);
    map.setCenter(latLngOrLiteral);
    map.setZoom(zoom);
  }, []);

  useEffect(() => {
    if (!isOpen) return undefined;

    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (!isOpen) {
      // Important: since `if (!isOpen) return null` unmounts the DOM div,
      // clean up cached Google Maps instances so the next open initializes cleanly without freezing.
      safeClearListeners(autocompleteRef.current);
      safeClearListeners(markerInstanceRef.current);
      safeClearListeners(mapInstanceRef.current);
      autocompleteRef.current = null;
      markerInstanceRef.current = null;
      mapInstanceRef.current = null;
      geocoderRef.current = null;
      setResolvingAddress(false);
      return undefined;
    }

    const initial = initialAddressRef.current || '';
    setSearchInput('');
    setPickedAddress(initial);
    setResolvingAddress(false);

    let cancelled = false;

    const timer = setTimeout(() => {
      if (cancelled || !mapContainerRef.current) return;
      if (typeof window === 'undefined' || !window.google?.maps) return;

      try {
        geocoderRef.current = new window.google.maps.Geocoder();

        const map = new window.google.maps.Map(mapContainerRef.current, {
          zoom: 14,
          center: DEFAULT_MOSSORO,
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          gestureHandling: 'greedy',
        });
        mapInstanceRef.current = map;

        const marker = new window.google.maps.Marker({
          map,
          draggable: true,
          position: DEFAULT_MOSSORO,
        });
        markerInstanceRef.current = marker;

        map.addListener('click', (e) => {
          if (!e?.latLng || !isOpenRef.current) return;
          marker.setPosition(e.latLng);
          geocodePosition(e.latLng);
        });

        marker.addListener('dragend', (e) => {
          if (!e?.latLng || !isOpenRef.current) return;
          geocodePosition(e.latLng);
        });

        // Attach Places Autocomplete cleanly if library is available
        if (searchInputRef.current && window.google.maps.places?.Autocomplete) {
          const ac = new window.google.maps.places.Autocomplete(searchInputRef.current, {
            componentRestrictions: { country: 'br' },
            fields: ['geometry', 'formatted_address', 'name'],
          });
          ac.bindTo('bounds', map);
          autocompleteRef.current = ac;

          ac.addListener('place_changed', () => {
            if (!isOpenRef.current) return;
            const place = ac.getPlace();
            if (!place?.geometry?.location) {
              const val = searchInputRef.current?.value || '';
              const extractedCoords = extractCoordinates(val);
              if (extractedCoords) {
                focusLocation(extractedCoords, 18);
                geocodePosition(extractedCoords);
              }
              return;
            }

            if (place.geometry.viewport) {
              map.fitBounds(place.geometry.viewport);
            } else {
              map.setCenter(place.geometry.location);
              map.setZoom(17);
            }

            marker.setPosition(place.geometry.location);
            setResolvingAddress(false);
            setPickedAddress(place.formatted_address || place.name || '');
          });
        }

        // Resolve initialAddress safely once after mount
        if (initial) {
          const extractedCoords = extractCoordinates(initial);
          const shortUrl = extractFirstShortMapsUrl(initial);
          if (extractedCoords) {
            focusLocation(extractedCoords, 17);
            geocodePosition(extractedCoords);
          } else if (shortUrl) {
            setResolvingAddress(true);
            resolveShortMapsUrlClient(shortUrl).then((resolved) => {
              if (cancelled || !isOpenRef.current) return;
              setResolvingAddress(false);
              if (resolved?.ok && typeof resolved.lat === 'number' && typeof resolved.lng === 'number') {
                focusLocation({ lat: resolved.lat, lng: resolved.lng }, 18);
                setPickedAddress(formatResolvedAddressForForm(initial, resolved));
              }
            });
          } else if (!initial.trim().startsWith('http')) {
            const seq = ++geocodeSeqRef.current;
            setResolvingAddress(true);
            geocoderRef.current.geocode(
              { address: initial, componentRestrictions: { country: 'BR' } },
              (results, status) => {
                if (cancelled || !isOpenRef.current || seq !== geocodeSeqRef.current) return;
                setResolvingAddress(false);
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                  focusLocation(results[0].geometry.location, 17);
                  setPickedAddress(results[0].formatted_address || initial);
                }
              }
            );
          }
        }
      } catch {
        setResolvingAddress(false);
      }
    }, 60);

    return () => {
      cancelled = true;
      clearTimeout(timer);
      safeClearListeners(autocompleteRef.current);
      safeClearListeners(markerInstanceRef.current);
      safeClearListeners(mapInstanceRef.current);
      autocompleteRef.current = null;
      markerInstanceRef.current = null;
      mapInstanceRef.current = null;
      geocoderRef.current = null;
    };
  }, [isOpen, focusLocation, geocodePosition]);

  const handleSearchSubmit = async () => {
    const val = searchInput.trim();
    if (!val) return;

    const extractedCoords = extractCoordinates(val);
    if (extractedCoords) {
      if (mapInstanceRef.current) {
        focusLocation(extractedCoords, 18);
        geocodePosition(extractedCoords);
      } else {
        setPickedAddress(`${extractedCoords.lat}, ${extractedCoords.lng}`);
      }
      return;
    }

    const shortUrl = extractFirstShortMapsUrl(val);
    if (shortUrl) {
      setResolvingAddress(true);
      try {
        const resolved = await resolveShortMapsUrlClient(shortUrl);
        if (!isOpenRef.current) return;
        setResolvingAddress(false);
        if (resolved?.ok && typeof resolved.lat === 'number' && typeof resolved.lng === 'number') {
          if (mapInstanceRef.current) {
            focusLocation({ lat: resolved.lat, lng: resolved.lng }, 18);
          }
          setPickedAddress(formatResolvedAddressForForm(val, resolved));
        } else {
          showAlert({
            title: 'Não foi possível converter o link',
            message: resolved?.error || 'Não foi possível expandir este link encurtado. Tente abrir no Maps ou marcar no pino.',
          });
        }
      } catch {
        setResolvingAddress(false);
      }
      return;
    }

    if (!geocoderRef.current || !mapInstanceRef.current) {
      setPickedAddress(val);
      return;
    }

    const seq = ++geocodeSeqRef.current;
    setResolvingAddress(true);
    geocoderRef.current.geocode(
      { address: val, componentRestrictions: { country: 'BR' } },
      (results, status) => {
        if (!isOpenRef.current || seq !== geocodeSeqRef.current) return;
        setResolvingAddress(false);
        if (status === 'OK' && results?.[0]?.geometry?.location) {
          focusLocation(results[0].geometry.location, 17);
          setPickedAddress(results[0].formatted_address || val);
        } else {
          showAlert({
            title: 'Aviso',
            message: 'Local exato não encontrado via texto. Arraste o pino no mapa ou cole coordenadas/link.',
          });
        }
      }
    );
  };

  const handleConfirm = () => {
    if (pickedAddress && onConfirmAddress) {
      onConfirmAddress(pickedAddress);
    }
    onClose?.();
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
              aria-label="Fechar mapa"
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
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSearchSubmit();
                }
              }}
              className="w-full bg-gray-50 border border-gray-300 rounded-lg text-sm py-2 px-3 text-gray-900 outline-none focus:border-blue-500 transition-colors shadow-inner"
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
          <div className="w-full md:flex-1 flex items-center gap-2">
            <input
              type="text"
              value={pickedAddress}
              onChange={(e) => setPickedAddress(e.target.value)}
              className="w-full bg-blue-50/50 border border-blue-100 rounded-lg text-sm py-2 px-3 outline-none font-bold text-blue-900 shadow-inner"
              placeholder="Clique no mapa, arraste o pino ou pesquise para selecionar um endereço..."
            />
            {resolvingAddress && (
              <span className="text-[11px] font-bold text-blue-600 whitespace-nowrap shrink-0">
                Buscando...
              </span>
            )}
          </div>
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
