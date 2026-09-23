import { useEffect, useMemo } from 'react';
import { Circle, MapContainer, Marker, TileLayer, Tooltip, useMap } from 'react-leaflet';
import L, { type PathOptions } from 'leaflet';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@everythingme/ui';
import type { DriverInfo } from '../hooks/use-drivers';
import type { AnyEvent, LockInfo } from '../lib/lock-types';
import {
  deriveBookingMapState,
  RIDE_LANE_COLORS,
  SEARCH_RADIUS_KM,
  type DriverPin,
  type DriverPinStatus,
  type LatLng,
  type MapLine,
  type RideLane,
} from '../lib/booking-map-state';
import type { RoutePreset } from '../lib/route-presets';
import { useRoadRoutes } from '../hooks/use-road-routes';
import 'leaflet/dist/leaflet.css';

const SF_CENTER: [number, number] = [37.7749, -122.4194];

const SEARCH_RADIUS_STYLE: PathOptions = {
  color: '#2563eb',
  weight: 1,
  dashArray: '5 7',
  fillColor: '#2563eb',
  fillOpacity: 0.06,
};
const PREVIEW_ROUTE_STYLE: PathOptions = { color: '#111827', weight: 3, opacity: 0.7 };
const OFFER_LINE_STYLE: PathOptions = { weight: 2.5, dashArray: '7 7', opacity: 0.9 };
const LOCK_LINE_STYLE: PathOptions = { weight: 2, dashArray: '3 8', opacity: 0.55 };
const EN_ROUTE_STYLE: PathOptions = {
  weight: 4,
  opacity: 0.95,
  lineCap: 'round',
  className: 'booking-map-enroute',
};
const TRIP_STYLE: PathOptions = { weight: 3.5, opacity: 0.8 };

type StopKind = 'pickup' | 'dropoff';

const PIN_LABELS: Record<DriverPinStatus, string> = {
  available: 'Available',
  busy: 'Busy',
  offering: 'Offer waiting',
  skipped: 'Declined or timed out',
  matched: 'Matched',
};

const LEGEND_STOPS: Array<{ kind: StopKind; label: string }> = [
  { kind: 'pickup', label: 'Pickup' },
  { kind: 'dropoff', label: 'Dropoff' },
];

const LEGEND_PINS: Array<{ status: DriverPinStatus; label: string }> = [
  { status: 'available', label: 'Available' },
  { status: 'offering', label: 'Offering' },
  { status: 'skipped', label: 'Skipped' },
  { status: 'matched', label: 'Matched' },
];

const RACE_LANES: Array<{ lane: RideLane; label: string }> = [
  { lane: 'a', label: 'Ride A' },
  { lane: 'b', label: 'Ride B' },
];

interface Props {
  route: RoutePreset;
  drivers: DriverInfo[];
  sseEvents: AnyEvent[];
  rideIds: string[];
  locks: LockInfo[];
}

function toTuple(point: LatLng): [number, number] {
  return [point.lat, point.lng];
}

function stopIcon(kind: StopKind, label: string) {
  return L.divIcon({
    className: 'booking-map-marker',
    html: `<div class="booking-map-stop">
      <span class="booking-map-stop-dot booking-map-stop-dot--${kind}"></span>
      <span class="booking-map-stop-label">${label}</span>
    </div>`,
    iconSize: [88, 28],
    iconAnchor: kind === 'pickup' ? [8, 8] : [7, 7],
  });
}

function driverIcon(pin: DriverPin) {
  const laneClass = pin.rideLane ? ` booking-map-pin--lane-${pin.rideLane}` : '';
  return L.divIcon({
    className: 'booking-map-marker',
    html: `<span class="booking-map-pin booking-map-pin--${pin.pinStatus}${laneClass}"></span>`,
    iconSize: [18, 18],
    iconAnchor: [9, 9],
  });
}

function FitRoute({ pickup, dropoff }: { pickup: LatLng; dropoff: LatLng }) {
  const map = useMap();
  const { lat: pickupLat, lng: pickupLng } = pickup;
  const { lat: dropoffLat, lng: dropoffLng } = dropoff;

  // Keyed on coordinates only so live SSE/match updates never refit the view.
  useEffect(() => {
    map.fitBounds(
      L.latLngBounds([
        [pickupLat, pickupLng],
        [dropoffLat, dropoffLng],
      ]),
      { padding: [48, 48], maxZoom: 14, animate: false },
    );
  }, [map, pickupLat, pickupLng, dropoffLat, dropoffLng]);

  return null;
}

function MapResize() {
  const map = useMap();

  useEffect(() => {
    const resize = () => map.invalidateSize({ animate: false });
    const observer = new ResizeObserver(resize);
    observer.observe(map.getContainer());
    resize();
    return () => observer.disconnect();
  }, [map]);

  return null;
}

function RoadLine({ line, style }: { line: MapLine; style: PathOptions }) {
  const map = useMap();
  const geometry = line.points.map(toTuple).join(';');

  useEffect(() => {
    const layer = L.polyline(
      line.points.map(toTuple),
      { ...style, color: line.color, smoothFactor: 0 },
    );
    layer.addTo(map);
    return () => {
      map.removeLayer(layer);
    };
  }, [map, line.id, line.color, geometry, style]);

  return null;
}

function Lines({ lines, style }: { lines: MapLine[]; style: PathOptions }) {
  return lines
    .filter((line): line is MapLine => Boolean(line && line.points.length >= 2))
    .map((line) => <RoadLine key={line.id} line={line} style={style} />);
}

export function BookingMap({ route, drivers, sseEvents, rideIds, locks }: Props) {
  const model = useMemo(
    () => deriveBookingMapState({ route, drivers, sseEvents, rideIds, locks }),
    [route, drivers, sseEvents, rideIds, locks],
  );

  const previewLine = useMemo<MapLine>(
    () => ({
      id: 'preview',
      points: [route.pickup, route.dropoff],
      color: PREVIEW_ROUTE_STYLE.color as string,
    }),
    [route.pickup, route.dropoff],
  );

  const straightLines = useMemo(() => {
    const lines: MapLine[] = [];
    if (model.showPreviewRoute) lines.push(previewLine);
    lines.push(
      ...model.offerLines,
      ...model.lockLines,
      ...model.tripLines,
      ...model.enRouteLines,
    );
    return lines;
  }, [model, previewLine]);

  const routedLines = useRoadRoutes(straightLines);
  const routedById = useMemo(
    () => Object.fromEntries(routedLines.map((line) => [line.id, line])),
    [routedLines],
  );
  const routedPreview = previewLine.id in routedById ? [routedById[previewLine.id]] : [];
  const routedOffers = model.offerLines.map((line) => routedById[line.id] ?? line);
  const routedLocks = model.lockLines.map((line) => routedById[line.id] ?? line);
  const routedTrips = model.tripLines.map((line) => routedById[line.id] ?? line);
  const routedEnRoute = model.enRouteLines.map((line) => routedById[line.id] ?? line);

  const pickupIcon = useMemo(
    () => stopIcon('pickup', route.pickup.address),
    [route.pickup.address],
  );
  const dropoffIcon = useMemo(
    () => stopIcon('dropoff', route.dropoff.address),
    [route.dropoff.address],
  );

  return (
    <Card className="h-full min-h-0 gap-0 overflow-hidden py-0 shadow-none">
      <CardHeader className="shrink-0 px-4 py-3">
        <CardTitle className="text-sm">Booking map</CardTitle>
        <CardDescription className="text-xs">{model.statusLabel}</CardDescription>
      </CardHeader>
      <CardContent className="min-h-0 flex-1 p-0">
        <div className="booking-map-shell">
          <MapContainer
            center={SF_CENTER}
            zoom={13}
            scrollWheelZoom
            className="booking-map"
            attributionControl
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <FitRoute pickup={route.pickup} dropoff={route.dropoff} />
            <MapResize />

            {model.showSearchRadius && (
              <Circle
                center={toTuple(route.pickup)}
                radius={SEARCH_RADIUS_KM * 1000}
                pathOptions={SEARCH_RADIUS_STYLE}
              />
            )}

            {model.showPreviewRoute && (
              <Lines lines={routedPreview} style={PREVIEW_ROUTE_STYLE} />
            )}

            <Lines lines={routedOffers} style={OFFER_LINE_STYLE} />
            <Lines lines={routedLocks} style={LOCK_LINE_STYLE} />
            <Lines lines={routedTrips} style={TRIP_STYLE} />
            <Lines lines={routedEnRoute} style={EN_ROUTE_STYLE} />

            <Marker position={toTuple(route.pickup)} icon={pickupIcon} zIndexOffset={400} />
            <Marker position={toTuple(route.dropoff)} icon={dropoffIcon} zIndexOffset={400} />

            {model.drivers.map((pin) => (
              <Marker
                key={pin.id}
                position={toTuple(pin)}
                icon={driverIcon(pin)}
                zIndexOffset={pin.pinStatus === 'offering' || pin.pinStatus === 'matched' ? 500 : 200}
              >
                <Tooltip direction="top" offset={[0, -10]}>
                  <span className="font-medium">{pin.name}</span>
                  <span className="text-muted-foreground"> · {PIN_LABELS[pin.pinStatus]}</span>
                </Tooltip>
              </Marker>
            ))}
          </MapContainer>

          <div className="booking-map-legend" aria-hidden>
            {LEGEND_STOPS.map(({ kind, label }) => (
              <div key={kind} className="booking-map-legend-item">
                <span className={`booking-map-stop-dot booking-map-stop-dot--${kind}`} />
                <span>{label}</span>
              </div>
            ))}
            {LEGEND_PINS.map(({ status, label }) => (
              <div key={status} className="booking-map-legend-item">
                <span className={`booking-map-pin booking-map-pin--${status}`} />
                <span>{label}</span>
              </div>
            ))}
            {model.showSearchRadius && (
              <div className="booking-map-legend-item">
                <span className="booking-map-legend-radius" />
                <span>{SEARCH_RADIUS_KM} km search</span>
              </div>
            )}
            {model.enRouteLines.length > 0 && (
              <>
                <div className="booking-map-legend-item">
                  <span className="booking-map-legend-enroute" />
                  <span>Driver coming</span>
                </div>
                <div className="booking-map-legend-item">
                  <span className="booking-map-legend-trip" />
                  <span>Trip</span>
                </div>
              </>
            )}
            {model.isRace &&
              RACE_LANES.map(({ lane, label }) => (
                <div key={lane} className="booking-map-legend-item">
                  <span
                    className="booking-map-legend-swatch"
                    style={{ background: RIDE_LANE_COLORS[lane] }}
                  />
                  <span>{label}</span>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
