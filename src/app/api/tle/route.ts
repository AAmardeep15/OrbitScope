import { NextResponse } from 'next/server';

// Fetch active satellites from CelesTrak
const CELESTRAK_URL = 'https://celestrak.org/NORAD/elements/gp.php?GROUP=active&FORMAT=tle';

// Cache for 1 hour to avoid hitting Celestrak too often
export const revalidate = 3600;

export async function GET() {
  try {
    const response = await fetch(CELESTRAK_URL, {
      next: { revalidate: 3600 }
    });

    if (!response.ok) {
      if (response.status === 400 || response.status === 403 || response.status === 429) {
        // Rate limited or not modified, use fallback data
        console.log('Using fallback TLE data due to CelesTrak API limits');
        return NextResponse.json(FALLBACK_TLES);
      }
      throw new Error(`Failed to fetch TLE data: ${response.statusText}`);
    }

    const text = await response.text();
    if (text.includes("GP data has not updated")) {
       return NextResponse.json(FALLBACK_TLES);
    }
    const lines = text.split('\n').map(line => line.trim());
    
    // Parse 3-line format (Name, Line 1, Line 2)
    const tles = [];
    for (let i = 0; i < lines.length - 2; i += 3) {
      const name = lines[i];
      const line1 = lines[i + 1];
      const line2 = lines[i + 2];
      
      if (name && line1 && line2 && line1.startsWith('1 ') && line2.startsWith('2 ')) {
        tles.push({ name, line1, line2 });
      }
    }

    return NextResponse.json(tles.length > 0 ? tles : FALLBACK_TLES);
  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(FALLBACK_TLES);
  }
}

const FALLBACK_TLES = [
  {
    name: "ISS (ZARYA)",
    line1: "1 25544U 98067A   23315.65706484  .00014022  00000-0  25368-3 0  9997",
    line2: "2 25544  51.6413 250.6033 0001170  89.7046  14.6593 15.49842407424683"
  },
  {
    name: "HUBBLE SPACE TELESCOPE",
    line1: "1 20580U 90037B   23315.53422473  .00005720  00000-0  21323-3 0  9991",
    line2: "2 20580  28.4697 104.9961 0002888   5.5085 304.8194 15.08638332560373"
  },
  {
    name: "NOAA 19",
    line1: "1 33591U 09005A   23315.51261574  .00000122  00000-0  11340-3 0  9991",
    line2: "2 33591  99.1025  76.5369 0013961 228.1820 131.8157 14.12879555762029"
  },
  {
    name: "GOES 16",
    line1: "1 41866U 16071A   23315.46083161 -.00000238  00000-0  00000-0 0  9996",
    line2: "2 41866   0.0076 270.4735 0001889 198.8158 126.9698  1.00275815 25852"
  },
  {
    name: "STARLINK-1007",
    line1: "1 44713U 19074A   23315.67980315  .00012480  00000-0  74404-3 0  9996",
    line2: "2 44713  53.0535 342.3160 0001267  74.0049 286.1070 15.06399120227918"
  }
];
