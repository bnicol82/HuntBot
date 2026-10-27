/** Coordinate readouts (spec §5.1). GeoJSON order is [lon, lat]. UTM/MGRS arrive in M1. */

export type LonLat = readonly [lon: number, lat: number];

export function formatDecimal([lon, lat]: LonLat, digits = 6): string {
  return `${lat.toFixed(digits)}, ${lon.toFixed(digits)}`;
}

function dms(value: number, pos: string, neg: string): string {
  const hemi = value < 0 ? neg : pos;
  // Round once at the finest unit so 59.9995″ carries into the minutes instead of printing 60.0″.
  const tenthsOfSec = Math.round(Math.abs(value) * 36000);
  const deg = Math.floor(tenthsOfSec / 36000);
  const min = Math.floor((tenthsOfSec % 36000) / 600);
  const sec = (tenthsOfSec % 600) / 10;
  return `${deg}°${String(min).padStart(2, '0')}′${sec.toFixed(1).padStart(4, '0')}″${hemi}`;
}

export function formatDMS([lon, lat]: LonLat): string {
  return `${dms(lat, 'N', 'S')} ${dms(lon, 'E', 'W')}`;
}
