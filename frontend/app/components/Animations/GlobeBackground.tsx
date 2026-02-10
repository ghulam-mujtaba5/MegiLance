'use client';

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useTheme } from 'next-themes';
import commonStyles from './GlobeBackground.common.module.css';

// Dynamically import Globe to avoid SSR issues with Three.js
const Globe = dynamic(() => import('react-globe.gl'), { ssr: false });

const GlobeBackground = () => {
  const globeEl = useRef<any>(null);
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (globeEl.current) {
      globeEl.current.controls().autoRotate = true;
      globeEl.current.controls().autoRotateSpeed = 0.5;
      globeEl.current.controls().enableZoom = false;
    }
  }, [mounted]);

  if (!mounted) return null;

  // Theme-based colors
  const isDark = resolvedTheme === 'dark';
  const globeColor = isDark ? '#1a202c' : '#f7fafc';
  const atmosphereColor = isDark ? '#4573df' : '#3182ce';
  const arcColor = isDark ? ['#ff9800', '#e81123'] : ['#4573df', '#27AE60'];

  // Sample data for arcs (connecting hubs)
  const arcsData = [
    { startLat: 40.7128, startLng: -74.0060, endLat: 51.5074, endLng: -0.1278 }, // NY to London
    { startLat: 51.5074, startLng: -0.1278, endLat: 28.6139, endLng: 77.2090 }, // London to Delhi
    { startLat: 28.6139, startLng: 77.2090, endLat: 35.6762, endLng: 139.6503 }, // Delhi to Tokyo
    { startLat: 35.6762, startLng: 139.6503, endLat: -33.8688, endLng: 151.2093 }, // Tokyo to Sydney
    { startLat: -33.8688, startLng: 151.2093, endLat: 37.7749, endLng: -122.4194 }, // Sydney to SF
    { startLat: 37.7749, startLng: -122.4194, endLat: 40.7128, endLng: -74.0060 }, // SF to NY
  ];

  return (
    <div className={commonStyles.canvasWrapper}>
      <Globe
        ref={globeEl}
        globeImageUrl="//unpkg.com/three-globe/example/img/earth-night.jpg"
        bumpImageUrl="//unpkg.com/three-globe/example/img/earth-topology.png"
        backgroundColor="rgba(0,0,0,0)"
        width={typeof window !== 'undefined' ? window.innerWidth : 1000}
        height={typeof window !== 'undefined' ? window.innerHeight : 1000}
        arcsData={arcsData}
        arcColor={() => arcColor}
        arcDashLength={0.4}
        arcDashGap={4}
        arcDashInitialGap={() => Math.random() * 5}
        arcDashAnimateTime={1000}
        atmosphereColor={atmosphereColor}
        atmosphereAltitude={0.15}
      />
    </div>
  );
};

export default GlobeBackground;
