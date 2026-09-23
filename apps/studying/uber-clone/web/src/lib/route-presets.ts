/**
 * Shared San Francisco route presets used by the rider panel and booking map.
 */

export interface RouteLocation {
  lat: number;
  lng: number;
  address: string;
}

export interface RoutePreset {
  label: string;
  pickup: RouteLocation;
  dropoff: RouteLocation;
}

export const ROUTE_PRESETS: RoutePreset[] = [
  {
    label: 'Tenderloin → Mission',
    pickup: { lat: 37.7845, lng: -122.4144, address: 'Tenderloin, SF' },
    dropoff: { lat: 37.7599, lng: -122.4148, address: 'Mission District, SF' },
  },
  {
    label: 'SoMa → Castro',
    pickup: { lat: 37.7785, lng: -122.4056, address: 'SoMa, SF' },
    dropoff: { lat: 37.7609, lng: -122.435, address: 'Castro, SF' },
  },
  {
    label: 'Marina → Chinatown',
    pickup: { lat: 37.8007, lng: -122.437, address: 'Marina, SF' },
    dropoff: { lat: 37.7949, lng: -122.4069, address: 'Chinatown, SF' },
  },
];
