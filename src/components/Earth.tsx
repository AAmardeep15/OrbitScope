'use client';

import { useEffect } from 'react';
import { Canvas, useFrame, useLoader } from '@react-three/fiber';
import { OrbitControls, Stars, Html } from '@react-three/drei';
import * as THREE from 'three';
import { useSatelliteStore } from '@/lib/satellite-store';
import { latLonToVector3 } from '@/lib/satellite-utils';

const EARTH_RADIUS = 5;

function EarthSphere() {
  // Use useLoader to perfectly cache textures and prevent blinking/flickering in React Three Fiber
  const [earthMap, bumpMap, waterMap, cloudMap] = useLoader(THREE.TextureLoader, [
    'https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg',
    'https://unpkg.com/three-globe/example/img/earth-topology.png',
    'https://unpkg.com/three-globe/example/img/earth-water.png',
    'https://raw.githubusercontent.com/mrdoob/three.js/master/examples/textures/planets/earth_clouds_1024.png'
  ]);

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

import { useRef, useMemo } from 'react';

function FastSatelliteLabel({ sat, isSelected }: { sat: any, isSelected: boolean }) {
  const groupRef = useRef<THREE.Group>(null);
  
  // Update position directly in the WebGL loop using the ref, bypassing React completely!
  useFrame(() => {
    if (groupRef.current && sat.position) {
      const [x, y, z] = latLonToVector3(sat.position.latitude, sat.position.longitude, sat.position.altitude, EARTH_RADIUS);
      groupRef.current.position.set(x, y, z);
    }
  });

  return (
    <group ref={groupRef}>
      <Html distanceFactor={15} center zIndexRange={[100, 0]}>
        <div className={`text-xs px-2 py-1 rounded bg-black/70 whitespace-nowrap pointer-events-none 
          ${isSelected ? 'text-neon border border-neon font-bold shadow-[0_0_10px_rgba(0,255,255,0.8)]' : 'text-white/80'}`}>
          {sat.name}
        </div>
      </Html>
    </group>
  );
}

function SatelliteLabels() {
  const showLabels = useSatelliteStore((state) => state.showLabels);
  const selectedSatellite = useSatelliteStore((state) => state.selectedSatellite);
  
  // We need to re-render labels when labels toggle, or when selected changes.
  // We don't subscribe to satellites list directly to avoid 100ms re-renders.
  // Instead, when these trigger, we grab the latest state for rendering.
  const filteredSatellites = useSatelliteStore.getState().getFilteredSatellites();
  
  // Only render selected satellite if showLabels is off
  if (!showLabels && selectedSatellite) {
    const sat = filteredSatellites.find((s) => s.id === selectedSatellite.id);
    if (sat) return <FastSatelliteLabel sat={sat} isSelected={true} />;
    return null;
  }
  
  // If show labels, limit to 50 max to prevent HTML DOM from slowing the app to a crawl.
  // And ensure the selected one is always included.
  const MAX_LABELS = 50; 
  const visibleSats = showLabels ? filteredSatellites.slice(0, MAX_LABELS) : [];
  
  return (
    <group>
      {visibleSats.map((sat) => {
        const isSelected = selectedSatellite?.id === sat.id;
        return <FastSatelliteLabel key={sat.id} sat={sat} isSelected={isSelected} />;
      })}
      
      {showLabels && selectedSatellite && !visibleSats.find((s) => s.id === selectedSatellite.id) && (
        <FastSatelliteLabel 
          sat={filteredSatellites.find((s) => s.id === selectedSatellite.id)} 
          isSelected={true} 
        />
      )}
    </group>
  );
}

function Satellites() {
  const selectSatellite = useSatelliteStore((state) => state.selectSatellite);
  
  const meshRef = useRef<THREE.InstancedMesh>(null);
  
  // Use memoized three.js objects for fast mutation
  const dummy = useMemo(() => new THREE.Object3D(), []);
  const colorObj = useMemo(() => new THREE.Color(), []);

  // useFrame updates all satellite positions and colors every frame directly in WebGL
  useFrame(() => {
    if (!meshRef.current) return;
    
    // Get fresh data without causing any React re-renders!
    const sats = useSatelliteStore.getState().getFilteredSatellites();
    const currentSelected = useSatelliteStore.getState().selectedSatellite;
    
    sats.forEach((sat, i) => {
      if (!sat.position) return;
      
      const isSelected = currentSelected?.id === sat.id;
      const [x, y, z] = latLonToVector3(sat.position.latitude, sat.position.longitude, sat.position.altitude, EARTH_RADIUS);
      
      // Update Transform
      dummy.position.set(x, y, z);
      const scale = isSelected ? 2.5 : 1;
      dummy.scale.set(scale, scale, scale);
      dummy.updateMatrix();
      meshRef.current!.setMatrixAt(i, dummy.matrix);
      
      // Update Color
      let hex = '#0ff'; // Neon Cyan matching rest of UI
      if (isSelected) hex = '#fff'; // White for selected
      else if (sat.orbitType === 'GEO') hex = '#f0f'; // Neon Magenta
      else if (sat.orbitType === 'MEO') hex = '#a78bfa'; // Purple
      
      colorObj.set(hex);
      meshRef.current!.setColorAt(i, colorObj);
    });
    
    meshRef.current.instanceMatrix.needsUpdate = true;
    if (meshRef.current.instanceColor) {
      meshRef.current.instanceColor.needsUpdate = true;
    }
  });

  // Extract primitive count so React only re-renders the InstancedMesh when the filter result length changes
  const satelliteCount = useSatelliteStore((state) => state.getFilteredSatellites().length);

  return (
    <group>
      {/* 
        InstancedMesh allows us to render thousands of identical geometry meshes in a SINGLE draw call. 
        It is fundamentally required for performance in this kind of app.
      */}
      <instancedMesh
        ref={meshRef}
        args={[undefined as any, undefined as any, satelliteCount]}
        onClick={(e) => {
          e.stopPropagation();
          if (e.instanceId !== undefined) {
             const sats = useSatelliteStore.getState().getFilteredSatellites();
             const sat = sats[e.instanceId];
             if (sat) selectSatellite(sat);
          }
        }}
      >
        <sphereGeometry args={[0.04, 16, 16]} />
        <meshBasicMaterial />
      </instancedMesh>
      
      {/* HTML Labels managed separately to avoid main component re-renders */}
      <SatelliteLabels />
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
  const isPlaying = useSatelliteStore((state) => state.isPlaying);
  const setCurrentTime = useSatelliteStore((state) => state.setCurrentTime);
  const updatePositions = useSatelliteStore((state) => state.updatePositions);

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
          minDistance={EARTH_RADIUS * 1.05} 
          maxDistance={EARTH_RADIUS * 5} 
          autoRotate={false}
          onChange={(e) => {
            const controls = e?.target;
            if (controls) {
              const distance = controls.getDistance();
              if (distance < EARTH_RADIUS * 1.1) {
                // Throttle/prevent multiple rapid dispatches if already changing
                useSatelliteStore.getState().setViewMode('2d');
              }
            }
          }}
        />
      </Canvas>
    </div>
  );
}
