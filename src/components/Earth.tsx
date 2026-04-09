'use client';

import { useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/satellite-store';
import { latLonToVector3 } from '@/lib/satellite-utils';

const EARTH_RADIUS = 5;

function EarthSphere() {
  // Use realistic textures for a "Google Earth" style view
  const textureLoader = new THREE.TextureLoader();
  const earthMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');
  const bumpMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-topology.png');
  const waterMap = textureLoader.load('https://unpkg.com/three-globe/example/img/earth-water.png');
  const cloudMap = textureLoader.load('https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png');

  return (
    <group>
      {/* Real Earth Body */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS, 64, 64]} />
        <meshPhongMaterial
          map={earthMap}
          bumpMap={bumpMap}
          bumpScale={0.03}
          specularMap={waterMap}
          specular={new THREE.Color(0x333333)}
          shininess={15}
        />
      </mesh>
      
      {/* Atmosphere / Clouds */}
      <mesh>
        <sphereGeometry args={[EARTH_RADIUS * 1.01, 64, 64]} />
        <meshPhongMaterial
          map={cloudMap}
          transparent={true}
          opacity={0.4}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}

function Satellites() {
  const { satellites, filters, selectedSatellite } = useSatelliteStore();
  const selectSatellite = useSatelliteStore((state) => state.selectSatellite);
  const showLabels = useSatelliteStore((state) => state.showLabels);

  const filteredSatellites = useSatelliteStore.getState().getFilteredSatellites();
  
  // Removed useFrame mutation of zustand state to prevent infinite loops.
  // Positions are now updated alongside currentTime.

  return (
    <group>
      {filteredSatellites.map((sat) => {
        if (!sat.position) return null;
        
        // Render each satellite
        // In a real high-perf app with 10k items, we should use InstancedMesh.
        // For keeping React simplicity and < 2000 items, normal meshes can work, 
        // but let's just render the selected one distinctly.
        
        const isSelected = selectedSatellite?.id === sat.id;
        const [x, y, z] = latLonToVector3(sat.position.latitude, sat.position.longitude, sat.position.altitude, EARTH_RADIUS);
        
        let color = '#4ade80'; // Default green
        if (isSelected) color = '#facc15'; // Yellow if selected
        else if (sat.orbitType === 'GEO') color = '#60a5fa'; // Blue
        else if (sat.orbitType === 'MEO') color = '#a78bfa'; // Purple

        return (
          <group key={sat.id} position={[x, y, z]}>
            <mesh onClick={(e) => { e.stopPropagation(); selectSatellite(sat); }}>
              <sphereGeometry args={[isSelected ? 0.08 : 0.04, 16, 16]} />
              <meshBasicMaterial color={color} />
            </mesh>
            {(showLabels || isSelected) && (
              <Html distanceFactor={15} center>
                <div className={`text-xs px-2 py-1 rounded bg-black/70 whitespace-nowrap 
                  ${isSelected ? 'text-yellow-400 border border-yellow-400 font-bold' : 'text-white/80'}`}>
                  {sat.name}
                </div>
              </Html>
            )}
            
            {/* Draw brief trail or orbit path if selected */}
          </group>
        );
      })}
    </group>
  );
}

// Draw the full orbit path for the selected satellite
function SelectedOrbitPath() {
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);
  const showOrbitPaths = useSatelliteStore((state) => state.showOrbitPaths);
  const currentTime = useSatelliteStore((state) => state.currentTime);
  const { calculateOrbitPath } = require('@/lib/satellite-utils');
  
  if (!selectedSatellite || !showOrbitPaths) return null;

  const pathPoints = calculateOrbitPath(selectedSatellite.tle, currentTime, 120, 1);
  const points = pathPoints.map((p: any) => {
    const [x, y, z] = latLonToVector3(p.lat, p.lng, p.alt, EARTH_RADIUS);
    return new THREE.Vector3(x, y, z);
  });

  if (points.length === 0) return null;

  const lineGeometry = new THREE.BufferGeometry().setFromPoints(points);

  const line = new THREE.Line(
    lineGeometry, 
    new THREE.LineBasicMaterial({ color: 0xfacc15, linewidth: 2, transparent: true, opacity: 0.6 })
  );

  return <primitive object={line} />;
}

export default function EarthGlobe() {
  const { isPlaying, setCurrentTime, updatePositions } = useSatelliteStore();

  useEffect(() => {
    if (!isPlaying) return;
    const interval = setInterval(() => {
      setCurrentTime(new Date());
      updatePositions();
    }, 100);
    return () => clearInterval(interval);
  }, [isPlaying, setCurrentTime, updatePositions]);

  return (
    <div className="w-full h-full relative cursor-crosshair">
      <Canvas camera={{ position: [0, 0, 12], fov: 45 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1.5} />
        
        <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade speed={1} />
        
        <EarthSphere />
        <Satellites />
        <SelectedOrbitPath />
        
        <OrbitControls 
          enablePan={false} 
          minDistance={EARTH_RADIUS * 1.1} 
          maxDistance={EARTH_RADIUS * 5} 
          autoRotate={!useSatelliteStore.getState().selectedSatellite}
          autoRotateSpeed={0.5}
        />
      </Canvas>
    </div>
  );
}
