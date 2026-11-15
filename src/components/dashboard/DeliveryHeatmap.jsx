import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  MapPin,
  Navigation,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
  Crosshair,
  Layers,
} from 'lucide-react';
import { loadGeocodeCache, saveGeocodeCache } from '../../lib/locationUtils';
import { formatCurrencyBRL } from '../../lib/reportAnalytics';

const MOSSORO_CENTER = { lat: -5.1882, lng: -37.3441 };

const DARK_BLUEPRINT_MAP_STYLE = [
  { elementType: 'geometry', stylers: [{ color: '#071526' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#020D1A' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#7ea2c4' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke', stylers: [{ color: '#1b3b5c' }] },
  { featureType: 'administrative.locality', elementType: 'labels.text.fill', stylers: [{ color: '#bae6fd' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#102a46' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#184770' }] },
  { featureType: 'road.highway', elementType: 'geometry.stroke', stylers: [{ color: '#0081A7' }] },
  { featureType: 'transit', stylers: [{ visibility: 'off' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#020b16' }] },
];

export default function DeliveryHeatmap({
  locationsRanking = [],
  mapStats = null,
  heightClass = 'h-[320px] sm:h-[360px]',
  maxLocationsList = 10,
}) {
  const mapContainerRef = useRef(null);
  const googleMapRef = useRef(null);
  const overlaysRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [geocodeCache, setGeocodeCache] = useState(() => loadGeocodeCache());
  const [selectedLocKey, setSelectedLocKey] = useState(null);
  const [googleMapsReady, setGoogleMapsReady] = useState(
    () => typeof window !== 'undefined' && Boolean(window.google?.maps?.Map)
  );
  const [geocodingPending, setGeocodingPending] = useState(false);

  // Watch briefly for async Google Maps script load
  useEffect(() => {
    if (googleMapsReady) return undefined;
    let attempts = 0;
    const timer = setInterval(() => {
      attempts += 1;
      if (typeof window !== 'undefined' && window.google?.maps?.Map) {
        setGoogleMapsReady(true);
        clearInterval(timer);
      } else if (attempts >= 12) {
        clearInterval(timer);
      }
    }, 350);
    return () => clearInterval(timer);
  }, [googleMapsReady]);

  // Resolve coordinates for visible locations
  const resolvedLocations = useMemo(() => {
    return (locationsRanking || []).map((loc, idx) => {
      const cached = geocodeCache?.[loc.key];
      const coords =
        loc.explicitCoords ||
        loc.presetCoords ||
        (cached && typeof cached.lat === 'number' && typeof cached.lng === 'number'
          ? { lat: cached.lat, lng: cached.lng }
          : null);

      const resolutionType = loc.explicitCoords
        ? 'Coordenada exata'
        : loc.presetCoords
          ? 'Polo / Bairro RN'
          : coords
            ? 'Geocodificado'
            : loc.isShortUrl
              ? 'Link curto maps.app.goo.gl'
              : loc.isEmpty
                ? 'Sem endereço'
                : 'Texto / Observação';

      return {
        ...loc,
        rank: idx + 1,
        coords,
        resolutionType,
      };
    });
  }, [locationsRanking, geocodeCache]);

  const mappablePoints = useMemo(
    () => resolvedLocations.filter((l) => l.coords && typeof l.coords.lat === 'number' && typeof l.coords.lng === 'number'),
    [resolvedLocations]
  );

  const coverageStats = useMemo(() => {
    const mappedDeliveries = mappablePoints.reduce((sum, l) => sum + (l.entregas || 0), 0);
    const shortUrlDeliveries =
      mapStats?.shortUrlCount ??
      resolvedLocations.filter((l) => l.isShortUrl).reduce((sum, l) => sum + (l.entregas || 0), 0);
    const totalEntregas =
      mapStats?.totalEntregas ??
      resolvedLocations.reduce((sum, l) => sum + (l.entregas || 0), 0);
    return {
      mappedHubs: mappablePoints.length,
      mappedDeliveries,
      shortUrlDeliveries,
      totalEntregas,
      coveragePct: totalEntregas > 0 ? (mappedDeliveries / totalEntregas) * 100 : 0,
    };
  }, [mappablePoints, resolvedLocations, mapStats]);

  // Background throttled geocoding for unresolved textual addresses when Google Maps is loaded
  useEffect(() => {
    if (!googleMapsReady || typeof window === 'undefined' || !window.google?.maps?.Geocoder) {
      return undefined;
    }

    const candidates = resolvedLocations
      .filter((loc) => !loc.coords && !loc.isShortUrl && !loc.isEmpty && loc.geocodeQuery)
      .slice(0, 14);

    if (candidates.length === 0) return undefined;

    let cancelled = false;
    const geocoder = new window.google.maps.Geocoder();

    async function runGeocodeQueue() {
      setGeocodingPending(true);
      const nextCache = { ...loadGeocodeCache() };
      let updated = false;

      for (const candidate of candidates) {
        if (cancelled) break;
        if (nextCache[candidate.key]) continue;

        try {
          const result = await new Promise((resolve) => {
            geocoder.geocode(
              {
                address: candidate.geocodeQuery,
                region: 'BR',
              },
              (results, status) => {
                if (status === 'OK' && results?.[0]?.geometry?.location) {
                  resolve({
                    lat: results[0].geometry.location.lat(),
                    lng: results[0].geometry.location.lng(),
                    formattedAddress: results[0].formatted_address || '',
                  });
                } else {
                  resolve(null);
                }
              }
            );
          });

          if (result) {
            nextCache[candidate.key] = result;
            updated = true;
          }
        } catch {
          // Ignore single geocode failure
        }

        await new Promise((r) => setTimeout(r, 150));
      }

      if (!cancelled) {
        if (updated) {
          saveGeocodeCache(nextCache);
          setGeocodeCache(nextCache);
        }
        setGeocodingPending(false);
      }
    }

    runGeocodeQueue();
    return () => {
      cancelled = true;
    };
  }, [googleMapsReady, resolvedLocations]);

  // Initialize & sync Google Map overlays
  useEffect(() => {
    if (!googleMapsReady || !mapContainerRef.current || typeof window === 'undefined' || !window.google?.maps) {
      return undefined;
    }

    if (!googleMapRef.current) {
      googleMapRef.current = new window.google.maps.Map(mapContainerRef.current, {
        center: MOSSORO_CENTER,
        zoom: 11,
        styles: DARK_BLUEPRINT_MAP_STYLE,
        disableDefaultUI: false,
        mapTypeControl: false,
        streetViewControl: false,
        fullscreenControl: true,
        zoomControl: true,
        backgroundColor: '#020D1A',
      });
      infoWindowRef.current = new window.google.maps.InfoWindow();
    }

    const map = googleMapRef.current;

    // Clear old overlays
    overlaysRef.current.forEach((ov) => ov.setMap(null));
    overlaysRef.current = [];

    if (mappablePoints.length === 0) {
      map.setCenter(MOSSORO_CENTER);
      map.setZoom(11);
      return undefined;
    }

    const bounds = new window.google.maps.LatLngBounds();
    const maxEntregas = Math.max(...mappablePoints.map((p) => p.entregas), 1);

    mappablePoints.forEach((loc, idx) => {
      const position = { lat: loc.coords.lat, lng: loc.coords.lng };
      bounds.extend(position);

      const isHotspot = idx < 3;
      const isSelected = selectedLocKey === loc.key;
      const ratio = loc.entregas / maxEntregas;
      const fillColor = isSelected ? '#00D4FF' : isHotspot ? '#F07127' : '#0081A7';
      const strokeColor = isSelected ? '#ffffff' : isHotspot ? '#fdba74' : '#38bdf8';

      const circle = new window.google.maps.Circle({
        map,
        center: position,
        radius: 520 + Math.sqrt(loc.entregas) * 650,
        strokeColor,
        strokeOpacity: 0.78,
        strokeWeight: isSelected ? 2.5 : 1.5,
        fillColor,
        fillOpacity: 0.16 + ratio * 0.24,
        clickable: true,
      });

      const marker = new window.google.maps.Marker({
        map,
        position,
        title: `${loc.label} (${loc.entregas} entregas)`,
        label: {
          text: String(loc.entregas),
          color: '#ffffff',
          fontSize: '11px',
          fontWeight: '700',
        },
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: isSelected ? 15 : 10 + ratio * 7,
          fillColor,
          fillOpacity: 0.94,
          strokeColor: '#ffffff',
          strokeWeight: isSelected ? 2.5 : 1.5,
        },
        zIndex: isSelected ? 999 : 100 - idx,
      });

      const openPopup = () => {
        setSelectedLocKey(loc.key);
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="font-family: 'Hanken Grotesk', sans-serif; color: #0f172a; min-width: 190px; padding: 2px;">
              <div style="font-weight: 800; font-size: 13px; margin-bottom: 4px;">${loc.label}</div>
              <div style="font-size: 11px; color: #475569; margin-bottom: 6px;">${loc.category} • ${loc.resolutionType}</div>
              <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 6px; font-size: 11px; border-top: 1px solid #e2e8f0; padding-top: 6px;">
                <div><strong>${loc.entregas}</strong> entregas (${loc.sharePct.toFixed(1)}%)</div>
                <div><strong>${loc.km.toFixed(0)}</strong> km</div>
                <div style="grid-column: span 2; color: #0369a1; font-weight: 700;">Total: ${formatCurrencyBRL(loc.valorTotal)}</div>
              </div>
            </div>
          `);
          infoWindowRef.current.open({ map, anchor: marker });
        }
      };

      circle.addListener('click', openPopup);
      marker.addListener('click', openPopup);
      overlaysRef.current.push(circle, marker);
    });

    if (selectedLocKey) {
      const activeLoc = mappablePoints.find((p) => p.key === selectedLocKey);
      if (activeLoc) {
        map.panTo(activeLoc.coords);
        if ((map.getZoom() || 10) < 12) map.setZoom(12);
      }
    } else if (mappablePoints.length === 1) {
      map.setCenter(mappablePoints[0].coords);
      map.setZoom(13);
    } else {
      map.fitBounds(bounds, { top: 36, right: 36, bottom: 36, left: 36 });
    }

    return undefined;
  }, [googleMapsReady, mappablePoints, selectedLocKey]);

  const selectedLocation = useMemo(
    () => resolvedLocations.find((l) => l.key === selectedLocKey) || resolvedLocations[0] || null,
    [resolvedLocations, selectedLocKey]
  );

  // Blueprint SVG radar projection bounds (used when Google Maps isn't available or headless)
  const radarNodes = useMemo(() => {
    if (mappablePoints.length === 0) return [];
    const lats = mappablePoints.map((p) => p.coords.lat);
    const lngs = mappablePoints.map((p) => p.coords.lng);
    const minLat = Math.min(...lats, MOSSORO_CENTER.lat - 0.15);
    const maxLat = Math.max(...lats, MOSSORO_CENTER.lat + 0.15);
    const minLng = Math.min(...lngs, MOSSORO_CENTER.lng - 0.18);
    const maxLng = Math.max(...lngs, MOSSORO_CENTER.lng + 0.18);
    const latSpan = Math.max(maxLat - minLat, 0.08);
    const lngSpan = Math.max(maxLng - minLng, 0.08);
    const maxEntregas = Math.max(...mappablePoints.map((p) => p.entregas), 1);

    return mappablePoints.map((loc, idx) => {
      const x = 12 + ((loc.coords.lng - minLng) / lngSpan) * 76;
      const y = 86 - ((loc.coords.lat - minLat) / latSpan) * 72;
      const r = 7 + (loc.entregas / maxEntregas) * 14;
      return { ...loc, x, y, r, isHotspot: idx < 3 };
    });
  }, [mappablePoints]);

  return (
    <div className="flex flex-col gap-3 min-w-0">
      {/* Coverage Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
        <div className="bg-[#020D1A]/75 border border-white/10 rounded-[4px] px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">
              Polos Mapeados
            </div>
            <div className="text-base font-bold font-data-mono tabular-nums text-[#00D4FF]">
              {coverageStats.mappedHubs} <span className="text-[11px] font-normal text-slate-400">locais</span>
            </div>
          </div>
          <MapPin size={16} className="text-[#00D4FF] shrink-0" />
        </div>

        <div className="bg-[#020D1A]/75 border border-white/10 rounded-[4px] px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">
              Cobertura Geográfica
            </div>
            <div className="text-base font-bold font-data-mono tabular-nums text-emerald-400">
              {coverageStats.coveragePct.toFixed(0)}%{' '}
              <span className="text-[11px] font-normal text-slate-400">
                ({coverageStats.mappedDeliveries}/{coverageStats.totalEntregas})
              </span>
            </div>
          </div>
          <CheckCircle2 size={16} className="text-emerald-400 shrink-0" />
        </div>

        <div className="bg-[#020D1A]/75 border border-white/10 rounded-[4px] px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">
              Maior Concentração
            </div>
            <div className="text-xs sm:text-sm font-bold text-white truncate" title={resolvedLocations[0]?.label || '-'}>
              {resolvedLocations[0] ? `${resolvedLocations[0].label}` : 'Sem dados'}
            </div>
          </div>
          <Navigation size={16} className="text-[#F07127] shrink-0" />
        </div>

        <div className="bg-[#020D1A]/75 border border-white/10 rounded-[4px] px-3 py-2 flex items-center justify-between gap-2 min-w-0">
          <div className="min-w-0">
            <div className="text-[10px] font-bold uppercase tracking-wider text-on-surface-variant truncate">
              Links Curtos (Goo.gl)
            </div>
            <div className="text-base font-bold font-data-mono tabular-nums text-amber-400">
              {coverageStats.shortUrlDeliveries}{' '}
              <span className="text-[10px] font-normal text-slate-400">agrupadas</span>
            </div>
          </div>
          <AlertCircle size={16} className="text-amber-400 shrink-0" />
        </div>
      </div>

      {/* Main Map + Ranking Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 min-w-0">
        {/* Left: Interactive Map or Blueprint Geo Radar */}
        <div className="xl:col-span-7 flex flex-col bg-[#020D1A] border border-white/10 rounded-[4px] overflow-hidden min-w-0">
          <div className="px-3.5 py-2.5 bg-[#07182c] border-b border-white/10 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <Crosshair size={15} className="text-[#00D4FF] shrink-0" />
              <span className="text-xs font-bold uppercase tracking-wider text-white truncate">
                Mapa de Concentração de Entregas (Mossoró/RN & Região)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider">
              {geocodingPending && (
                <span className="px-2 py-0.5 rounded-[4px] bg-[#0081A7]/25 border border-[#0081A7]/40 text-[#00D4FF]">
                  Geocodificando endereços...
                </span>
              )}
              <span className="px-2 py-0.5 rounded-[4px] bg-white/5 border border-white/10 text-slate-300">
                {googleMapsReady ? 'Google Maps Ativo' : 'Radar Espacial Blueprint'}
              </span>
            </div>
          </div>

          <div className={`relative w-full ${heightClass}`}>
            {googleMapsReady ? (
              <div ref={mapContainerRef} className="w-full h-full" />
            ) : (
              <div className="w-full h-full relative bg-[#020D1A] overflow-hidden flex items-center justify-center">
                <svg
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                  className="w-full h-full"
                  aria-label="Radar espacial de entregas"
                >
                  {/* Grid lines */}
                  {[20, 40, 60, 80].map((v) => (
                    <g key={v}>
                      <line x1={v} y1="0" x2={v} y2="100" stroke="#0c2642" strokeWidth="0.3" />
                      <line x1="0" y1={v} x2="100" y2={v} stroke="#0c2642" strokeWidth="0.3" />
                    </g>
                  ))}
                  <circle cx="50" cy="50" r="16" fill="none" stroke="#0081A7" strokeOpacity="0.25" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
                  <circle cx="50" cy="50" r="32" fill="none" stroke="#0081A7" strokeOpacity="0.18" strokeWidth="0.35" strokeDasharray="1.5 1.5" />
                  <circle cx="50" cy="50" r="46" fill="none" stroke="#0081A7" strokeOpacity="0.12" strokeWidth="0.35" />

                  {radarNodes.map((node) => {
                    const isSelected = selectedLocation?.key === node.key;
                    const color = isSelected ? '#00D4FF' : node.isHotspot ? '#F07127' : '#0081A7';
                    return (
                      <g
                        key={node.key}
                        className="cursor-pointer"
                        onClick={() => setSelectedLocKey(node.key)}
                      >
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={node.r * 0.55}
                          fill={color}
                          fillOpacity="0.22"
                          stroke={color}
                          strokeWidth="0.4"
                        />
                        <circle
                          cx={node.x}
                          cy={node.y}
                          r={Math.max(node.r * 0.28, 2.2)}
                          fill={color}
                          stroke="#ffffff"
                          strokeWidth={isSelected ? '0.6' : '0.35'}
                        />
                        <text
                          x={node.x}
                          y={node.y + 0.8}
                          textAnchor="middle"
                          fontSize="2.6"
                          fontWeight="700"
                          fill="#ffffff"
                        >
                          {node.entregas}
                        </text>
                      </g>
                    );
                  })}
                </svg>

                {radarNodes.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                    <Layers size={24} className="text-slate-500 mb-2" />
                    <p className="text-xs font-semibold text-slate-300">
                      Nenhuma coordenada geográfica resolvida neste recorte.
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                      Os registros atuais usam links curtos (maps.app.goo.gl) ou observações operacionais sem bairro identificável.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Selected Location Floating HUD */}
            {selectedLocation && (
              <div className="absolute bottom-2.5 left-2.5 right-2.5 sm:right-auto sm:max-w-sm bg-[#031428]/95 border border-[#0081A7]/60 rounded-[4px] px-3 py-2 shadow-lg pointer-events-auto">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-[#00D4FF] truncate">
                      #{selectedLocation.rank} • {selectedLocation.category}
                    </div>
                    <div className="text-xs font-bold text-white truncate" title={selectedLocation.label}>
                      {selectedLocation.label}
                    </div>
                  </div>
                  {selectedLocation.sampleAddress && selectedLocation.sampleAddress.startsWith('http') && (
                    <a
                      href={selectedLocation.sampleAddress}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[#00D4FF] hover:text-white shrink-0 p-1"
                      title="Abrir link de localização"
                    >
                      <ExternalLink size={13} />
                    </a>
                  )}
                </div>
                <div className="mt-1.5 flex flex-wrap items-center gap-3 text-[11px] font-data-mono tabular-nums text-slate-300">
                  <span>
                    <strong className="text-white">{selectedLocation.entregas}</strong> entregas ({selectedLocation.sharePct.toFixed(1)}%)
                  </span>
                  <span>
                    <strong className="text-white">{selectedLocation.km.toFixed(0)}</strong> km
                  </span>
                  <span className="text-emerald-400 font-semibold">
                    {formatCurrencyBRL(selectedLocation.valorTotal)}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Transparent limitation notice */}
          {coverageStats.shortUrlDeliveries > 0 && (
            <div className="px-3.5 py-2 bg-[#07182c]/80 border-t border-white/10 text-[11px] text-slate-300 flex items-start gap-2">
              <AlertCircle size={14} className="text-amber-400 shrink-0 mt-0.5" />
              <span>
                <strong className="text-amber-300">{coverageStats.shortUrlDeliveries}</strong> entregas no período foram cadastradas com link curto (<code className="text-[#00D4FF]">maps.app.goo.gl</code>). Elas estão contabilizadas nos rankings e indicadores, mas exigem expansão server-side para plotagem de pino exato no mapa.
              </span>
            </div>
          )}
        </div>

        {/* Right: Top Locations List */}
        <div className="xl:col-span-5 bg-[#020D1A]/75 border border-white/10 rounded-[4px] flex flex-col min-w-0 overflow-hidden">
          <div className="px-3.5 py-2.5 bg-[#07182c] border-b border-white/10 flex items-center justify-between gap-2">
            <span className="text-xs font-bold uppercase tracking-wider text-white">
              Lugares com Mais Entregas (Clique para focar)
            </span>
            <span className="text-[11px] font-data-mono text-slate-400 tabular-nums">
              {resolvedLocations.length} agrupamentos
            </span>
          </div>

          <div className="divide-y divide-white/5 overflow-y-auto max-h-[360px]">
            {resolvedLocations.slice(0, maxLocationsList).map((loc) => {
              const isSelected = selectedLocation?.key === loc.key;
              return (
                <button
                  key={loc.key}
                  type="button"
                  onClick={() => setSelectedLocKey(loc.key)}
                  className={`w-full text-left px-3.5 py-2.5 transition-colors flex items-center justify-between gap-3 ${
                    isSelected ? 'bg-[#0081A7]/25 border-l-2 border-l-[#00D4FF]' : 'hover:bg-white/[0.04]'
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 min-w-0">
                      <span
                        className={`inline-flex items-center justify-center w-5 h-5 rounded-[4px] text-[10px] font-bold font-data-mono shrink-0 ${
                          loc.rank <= 3
                            ? 'bg-[#F07127]/25 text-[#F07127] border border-[#F07127]/40'
                            : 'bg-[#0081A7]/20 text-[#00D4FF] border border-[#0081A7]/30'
                        }`}
                      >
                        {loc.rank}
                      </span>
                      <span className="text-xs font-bold text-white truncate" title={loc.label}>
                        {loc.label}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-slate-400 pl-7">
                      <span className="px-1.5 py-0.5 rounded-[4px] bg-white/5 text-slate-300">
                        {loc.category}
                      </span>
                      <span className={loc.coords ? 'text-emerald-400' : 'text-amber-400'}>
                        {loc.coords ? 'Plotado no mapa' : loc.resolutionType}
                      </span>
                    </div>
                  </div>

                  <div className="text-right shrink-0 font-data-mono tabular-nums">
                    <div className="text-sm font-bold text-white">
                      {loc.entregas} <span className="text-[10px] font-normal text-slate-400">entregas</span>
                    </div>
                    <div className="text-[11px] text-[#00D4FF]">
                      {loc.sharePct.toFixed(1)}% • {loc.km.toFixed(0)} km
                    </div>
                  </div>
                </button>
              );
            })}

            {resolvedLocations.length === 0 && (
              <div className="p-6 text-center text-xs text-slate-400">
                Nenhum endereço registrado no período filtrado.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

