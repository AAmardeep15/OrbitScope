import * as satellite from 'satellite.js';
import { SatellitePosition, OrbitType, OrbitPoint, TLERecord, SatelliteInfo } from './types';

const EARTH_RADIUS_KM = 6371;

/**
 * Propagate a TLE record to get current satellite position
 */
export function propagateSatellite(
  tle: TLERecord,
  date: Date
): SatellitePosition | null {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);
    const positionAndVelocity = satellite.propagate(satrec, date);

    if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') {
      return null;
    }

    const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
    const velocityEci = positionAndVelocity.velocity as satellite.EciVec3<number>;

    const gmst = satellite.gstime(date);
    const positionGd = satellite.eciToGeodetic(positionEci, gmst);

    const longitude = satellite.degreesLong(positionGd.longitude);
    const latitude = satellite.degreesLat(positionGd.latitude);
    const altitude = positionGd.height;

    const velocity = Math.sqrt(
      velocityEci.x ** 2 + velocityEci.y ** 2 + velocityEci.z ** 2
    );

    return {
      latitude,
      longitude,
      altitude,
      velocity,
      x: positionEci.x,
      y: positionEci.y,
      z: positionEci.z,
    };
  } catch {
    return null;
  }
}

/**
 * Calculate orbit path points for visualization
 */
export function calculateOrbitPath(
  tle: TLERecord,
  startDate: Date,
  durationMinutes: number = 90,
  stepMinutes: number = 1
): OrbitPoint[] {
  const points: OrbitPoint[] = [];
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

  for (let i = 0; i <= durationMinutes; i += stepMinutes) {
    const date = new Date(startDate.getTime() + i * 60 * 1000);
    try {
      const positionAndVelocity = satellite.propagate(satrec, date);
      if (!positionAndVelocity.position || typeof positionAndVelocity.position === 'boolean') continue;

      const positionEci = positionAndVelocity.position as satellite.EciVec3<number>;
      const gmst = satellite.gstime(date);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      points.push({
        lat: satellite.degreesLat(positionGd.latitude),
        lng: satellite.degreesLong(positionGd.longitude),
        alt: positionGd.height,
        time: date,
        x: positionEci.x,
        y: positionEci.y,
        z: positionEci.z,
      });
    } catch {
      continue;
    }
  }

  return points;
}

/**
 * Determine orbit type from altitude
 */
export function classifyOrbit(perigee: number, apogee: number, inclination: number): OrbitType {
  const avgAlt = (perigee + apogee) / 2;

  if (avgAlt < 2000) {
    if (Math.abs(inclination - 98) < 5) return 'SSO';
    return 'LEO';
  }
  if (avgAlt >= 2000 && avgAlt < 35786 - 1000) return 'MEO';
  if (avgAlt >= 35786 - 1000 && avgAlt <= 35786 + 1000) return 'GEO';
  if (apogee > 35786 + 1000) return 'HEO';
  return 'Unknown';
}

/**
 * Parse TLE data to extract satellite info
 */
export function parseTLEToSatelliteInfo(tle: TLERecord): Partial<SatelliteInfo> {
  try {
    const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

    // Extract NORAD ID from line 1
    const noradId = tle.line1.substring(2, 7).trim();

    // Extract orbital elements
    const inclination = satrec.inclo * (180 / Math.PI);
    const eccentricity = satrec.ecco;
    const meanMotion = satrec.no * (1440 / (2 * Math.PI)); // rev/day to rev/day
    const period = 1440 / meanMotion; // minutes

    // Calculate apogee and perigee
    const semiMajorAxis = Math.pow((8681663.653 / meanMotion), 2 / 3); // km (approximate)
    const apogee = semiMajorAxis * (1 + eccentricity) - EARTH_RADIUS_KM;
    const perigee = semiMajorAxis * (1 - eccentricity) - EARTH_RADIUS_KM;

    const orbitType = classifyOrbit(perigee, apogee, inclination);

    // Extract international designator for launch year
    const intlDesig = tle.line1.substring(9, 17).trim();
    let launchYear = '';
    if (intlDesig.length >= 2) {
      const yr = parseInt(intlDesig.substring(0, 2));
      launchYear = (yr >= 57 ? '19' : '20') + intlDesig.substring(0, 2);
    }

    // Determine country from name/catalog
    const country = guessCountry(tle.name, noradId);

    const description = generateSatelliteDescription({
      name: tle.name.trim(),
      id: noradId,
      country,
      orbitType,
      launchYear: launchYear ? `${launchYear}` : undefined,
      apogee: Math.max(0, apogee),
      perigee: Math.max(0, perigee),
      inclination,
      period,
    });

    return {
      id: noradId,
      name: tle.name.trim(),
      tle,
      orbitType,
      country,
      launchDate: launchYear ? `${launchYear}` : undefined,
      inclination,
      period,
      apogee: Math.max(0, apogee),
      perigee: Math.max(0, perigee),
      eccentricity,
      description,
      active: true,
    };
  } catch {
    return {
      id: tle.line1.substring(2, 7).trim(),
      name: tle.name.trim(),
      tle,
      orbitType: 'Unknown',
      country: 'Unknown',
      inclination: 0,
      period: 0,
      apogee: 0,
      perigee: 0,
      eccentricity: 0,
      active: true,
    };
  }
}

/**
 * Generate a descriptive, human-readable paragraph for a satellite
 */
function generateSatelliteDescription(info: any): string {
  const { name, id, country, orbitType, launchYear, apogee, perigee, inclination, period } = info;
  
  let desc = `${name} (NORAD ID: ${id}) is a `;
  
  if (country !== 'International' && country !== 'Unknown') {
    desc += `${country}-operated `;
  }
  
  desc += `satellite `;
  
  if (launchYear) {
    desc += `launched in ${launchYear}. `;
  } else {
    desc += `orbiting the Earth. `;
  }

  desc += `It follows a `;
  
  if (orbitType !== 'Unknown') {
     const orbitNames: Record<string, string> = {
       'LEO': 'Low Earth Orbit (LEO)',
       'MEO': 'Medium Earth Orbit (MEO)',
       'GEO': 'Geosynchronous Equatorial Orbit (GEO)',
       'HEO': 'High Earth Orbit (HEO)',
       'SSO': 'Sun-Synchronous Orbit (SSO)'
     };
     desc += `${orbitNames[orbitType] || orbitType} `;
  } else {
     desc += `trajectory `;
  }
  
  desc += `with an apogee (farthest point) of ${Math.round(apogee).toLocaleString()} km and a perigee (closest point) of ${Math.round(perigee).toLocaleString()} km. `;
  
  desc += `The orbit is inclined at ${inclination.toFixed(1)} degrees relative to the equator, and it takes approximately ${period.toFixed(1)} minutes to complete one full revolution around the Earth.`;
  
  // Custom tweaks based on common satellite names
  const upper = name.toUpperCase();
  if (upper.includes('STARLINK')) {
    desc += ` Starlink is a satellite internet constellation operated by SpaceX, providing satellite Internet access coverage to most of the Earth.`;
  } else if (upper.includes('ISS') || upper.includes('ZARYA')) {
    desc += ` The International Space Station (ISS) is a modular space station (habitable artificial satellite) in low Earth orbit. It is a multinational collaborative project.`;
  } else if (upper.includes('HUBBLE') || upper.includes('HST')) {
    desc += ` The Hubble Space Telescope is a large space telescope launched into low Earth orbit in 1990 and remains in operation.`;
  } else if (upper.includes('NOAA') || upper.includes('METEOR') || upper.includes('GOES')) {
    desc += ` This is a meteorological satellite primarily used for weather forecasting, storm tracking, and climate research.`;
  } else if (upper.includes('GPS') || upper.includes('GLONASS') || upper.includes('GALILEO') || upper.includes('BEIDOU')) {
    desc += ` It is part of a global navigation satellite system (GNSS) providing geolocation and time information to a GPS receiver.`;
  } else if (upper.includes('DEB') || upper.includes('DEBRIS') || upper.includes('R/B')) {
    desc += ` Note: This object appears to be space debris or a spent rocket body, rather than an active payload.`;
  }
  
  return desc;
}

/**
 * Guess country of origin from satellite name
 */
function guessCountry(name: string, _noradId: string): string {
  const upper = name.toUpperCase();
  const countryPatterns: [string, string[]][] = [
    ['USA', ['USA', 'NOAA', 'GOES', 'GPS', 'TDRS', 'LANDSAT', 'STARLINK', 'ONEWEB', 'IRIDIUM', 'GLOBALSTAR', 'ORBCOMM']],
    ['Russia', ['COSMOS', 'KOSMOS', 'MOLNIYA', 'GLONASS', 'RESURS', 'METEOR']],
    ['China', ['CZ-', 'YAOGAN', 'BEIDOU', 'FENGYUN', 'TIANLIAN', 'SHIJIAN', 'GAOFEN']],
    ['India', ['IRNSS', 'GSAT', 'CARTOSAT', 'RESOURCESAT', 'INSAT']],
    ['Japan', ['HIMAWARI', 'ALOS', 'QZS-', 'MICHIBIKI']],
    ['ESA', ['SENTINEL', 'GALILEO', 'AEOLUS', 'METEOSAT', 'ENVISAT']],
    ['Canada', ['RADARSAT', 'SCISAT']],
    ['South Korea', ['KOMPSAT', 'ARIRANG']],
    ['Israel', ['EROS', 'OFEQ']],
    ['France', ['SPOT', 'PLEIADES']],
  ];

  for (const [country, patterns] of countryPatterns) {
    for (const pattern of patterns) {
      if (upper.includes(pattern)) return country;
    }
  }

  return 'International';
}

/**
 * Convert lat/lon/alt to 3D globe coordinates
 */
export function latLonToVector3(
  lat: number,
  lon: number,
  alt: number,
  globeRadius: number = 1
): [number, number, number] {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  const r = globeRadius + (alt / EARTH_RADIUS_KM) * globeRadius * 0.1;

  const x = -(r * Math.sin(phi) * Math.cos(theta));
  const y = r * Math.cos(phi);
  const z = r * Math.sin(phi) * Math.sin(theta);

  return [x, y, z];
}

/**
 * Get ground track for 2D map visualization
 */
export function getGroundTrack(
  tle: TLERecord,
  startDate: Date,
  durationMinutes: number = 90,
  stepMinutes: number = 0.5
): Array<[number, number]> {
  const track: Array<[number, number]> = [];
  const satrec = satellite.twoline2satrec(tle.line1, tle.line2);

  for (let i = 0; i <= durationMinutes; i += stepMinutes) {
    const date = new Date(startDate.getTime() + i * 60 * 1000);
    try {
      const posAndVel = satellite.propagate(satrec, date);
      if (!posAndVel.position || typeof posAndVel.position === 'boolean') continue;

      const posEci = posAndVel.position as satellite.EciVec3<number>;
      const gmst = satellite.gstime(date);
      const posGd = satellite.eciToGeodetic(posEci, gmst);

      track.push([
        satellite.degreesLat(posGd.latitude),
        satellite.degreesLong(posGd.longitude),
      ]);
    } catch {
      continue;
    }
  }

  return track;
}
