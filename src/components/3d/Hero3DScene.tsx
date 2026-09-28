import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

interface Hero3DSceneProps {
  interactive?: boolean;
  className?: string;
  showArtifacts?: boolean;
}

export const Hero3DScene: React.FC<Hero3DSceneProps> = ({
  interactive = true,
  className = '',
  showArtifacts = true,
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // --- Scene Setup ---
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090e, 0.04);

    const width = container.clientWidth || 600;
    const height = container.clientHeight || 450;

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(0, 0.5, 9);

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.75));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    container.appendChild(renderer.domElement);

    // --- Lighting ---
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.9);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0x818cf8, 2.5);
    mainLight.position.set(5, 8, 6);
    scene.add(mainLight);

    const cyanPointLight = new THREE.PointLight(0x06b6d4, 3, 15);
    cyanPointLight.position.set(-4, -1, 3);
    scene.add(cyanPointLight);

    const violetPointLight = new THREE.PointLight(0xa855f7, 3, 15);
    violetPointLight.position.set(4, 2, -2);
    scene.add(violetPointLight);

    const emeraldPointLight = new THREE.PointLight(0x10b981, 2, 10);
    emeraldPointLight.position.set(0, -3, 2);
    scene.add(emeraldPointLight);

    // --- Master Group ---
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // --- 1. Central Holographic Campus Beacon & Shield ---
    const coreGroup = new THREE.Group();
    masterGroup.add(coreGroup);

    // Core Crystal (Dr. RVR NRI University Beacon)
    const coreGeo = new THREE.OctahedronGeometry(1.0, 1);
    const coreMat = new THREE.MeshPhysicalMaterial({
      color: 0x4f46e5,
      emissive: 0x312e81,
      emissiveIntensity: 0.6,
      roughness: 0.15,
      metalness: 0.85,
      clearcoat: 1.0,
      clearcoatRoughness: 0.1,
      transmission: 0.35,
      opacity: 0.9,
      transparent: true,
      wireframe: false,
    });
    const coreMesh = new THREE.Mesh(coreGeo, coreMat);
    coreGroup.add(coreMesh);

    // Wireframe Cage
    const cageGeo = new THREE.IcosahedronGeometry(1.35, 1);
    const cageMat = new THREE.MeshBasicMaterial({
      color: 0x60a5fa,
      wireframe: true,
      transparent: true,
      opacity: 0.3,
    });
    const cageMesh = new THREE.Mesh(cageGeo, cageMat);
    coreGroup.add(cageMesh);

    // Orbit Ring 1 (Horizontal tilt)
    const ring1Geo = new THREE.TorusGeometry(1.85, 0.03, 16, 100);
    const ring1Mat = new THREE.MeshStandardMaterial({
      color: 0x38bdf8,
      emissive: 0x0284c7,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring1 = new THREE.Mesh(ring1Geo, ring1Mat);
    ring1.rotation.x = Math.PI / 3;
    ring1.rotation.y = Math.PI / 6;
    coreGroup.add(ring1);

    // Orbit Ring 2 (Counter tilt)
    const ring2Geo = new THREE.TorusGeometry(2.15, 0.025, 16, 100);
    const ring2Mat = new THREE.MeshStandardMaterial({
      color: 0xa855f7,
      emissive: 0x7e22ce,
      emissiveIntensity: 1.2,
      roughness: 0.2,
      metalness: 0.9,
    });
    const ring2 = new THREE.Mesh(ring2Geo, ring2Mat);
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.z = Math.PI / 5;
    coreGroup.add(ring2);

    // Satellite Beacon Node on Ring 1
    const satGeo = new THREE.SphereGeometry(0.12, 16, 16);
    const satMat = new THREE.MeshStandardMaterial({
      color: 0x34d399,
      emissive: 0x10b981,
      emissiveIntensity: 2.0,
      roughness: 0.1,
      metalness: 0.9,
    });
    const satNode = new THREE.Mesh(satGeo, satMat);
    coreGroup.add(satNode);

    // --- 2. Floating Campus Artifacts ---
    const artifactsGroup = new THREE.Group();
    if (showArtifacts) {
      masterGroup.add(artifactsGroup);

      // (A) Floating 3D Student ID Card
      const idGroup = new THREE.Group();
      idGroup.position.set(-2.8, 1.2, 0.5);
      idGroup.rotation.set(0.3, 0.5, -0.2);

      // Card body
      const idGeo = new THREE.BoxGeometry(1.2, 0.78, 0.04);
      const idMat = new THREE.MeshPhysicalMaterial({
        color: 0x1e1b4b,
        metalness: 0.5,
        roughness: 0.2,
        clearcoat: 0.8,
      });
      const idCard = new THREE.Mesh(idGeo, idMat);
      idGroup.add(idCard);

      // Photo block
      const photoGeo = new THREE.PlaneGeometry(0.32, 0.4);
      const photoMat = new THREE.MeshBasicMaterial({ color: 0x3b82f6 });
      const photo = new THREE.Mesh(photoGeo, photoMat);
      photo.position.set(-0.35, 0.08, 0.025);
      idGroup.add(photo);

      // Gold Chip
      const chipGeo = new THREE.PlaneGeometry(0.2, 0.16);
      const chipMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.95,
        roughness: 0.1,
        emissive: 0xd97706,
        emissiveIntensity: 0.4,
      });
      const chip = new THREE.Mesh(chipGeo, chipMat);
      chip.position.set(0.05, 0.15, 0.025);
      idGroup.add(chip);

      // Text lines
      for (let i = 0; i < 3; i++) {
        const lineGeo = new THREE.PlaneGeometry(0.55 - i * 0.1, 0.04);
        const lineMat = new THREE.MeshBasicMaterial({ color: 0x94a3b8 });
        const line = new THREE.Mesh(lineGeo, lineMat);
        line.position.set(0.22 - i * 0.05, -0.05 - i * 0.1, 0.025);
        idGroup.add(line);
      }
      artifactsGroup.add(idGroup);

      // (B) Floating 3D Smart Watch / Electronics Tracker
      const watchGroup = new THREE.Group();
      watchGroup.position.set(2.8, -1.1, 0.8);
      watchGroup.rotation.set(-0.25, -0.4, 0.2);

      // Bezel
      const watchGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.15, 32);
      const watchMat = new THREE.MeshStandardMaterial({
        color: 0x0f172a,
        metalness: 0.9,
        roughness: 0.2,
      });
      const watchBezel = new THREE.Mesh(watchGeo, watchMat);
      watchBezel.rotation.x = Math.PI / 2;
      watchGroup.add(watchBezel);

      // Screen Glass
      const screenGeo = new THREE.CircleGeometry(0.46, 32);
      const screenMat = new THREE.MeshPhysicalMaterial({
        color: 0x0284c7,
        emissive: 0x0369a1,
        emissiveIntensity: 0.8,
        roughness: 0.1,
        metalness: 0.8,
      });
      const screen = new THREE.Mesh(screenGeo, screenMat);
      screen.position.z = 0.08;
      watchGroup.add(screen);

      // Watch Straps
      const strapGeo = new THREE.BoxGeometry(0.48, 1.4, 0.06);
      const strapMat = new THREE.MeshStandardMaterial({
        color: 0x1e293b,
        roughness: 0.8,
        metalness: 0.1,
      });
      const strap = new THREE.Mesh(strapGeo, strapMat);
      watchGroup.add(strap);

      artifactsGroup.add(watchGroup);

      // (C) Floating Campus Keys
      const keysGroup = new THREE.Group();
      keysGroup.position.set(-2.4, -1.6, -0.5);
      keysGroup.rotation.set(0.4, 0.2, -0.5);

      // Ring
      const keyRingGeo = new THREE.TorusGeometry(0.3, 0.04, 16, 32);
      const brassMat = new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.9,
        roughness: 0.15,
        emissive: 0xb45309,
        emissiveIntensity: 0.3,
      });
      const keyRing = new THREE.Mesh(keyRingGeo, brassMat);
      keysGroup.add(keyRing);

      // Key 1
      const key1Geo = new THREE.CylinderGeometry(0.04, 0.04, 0.8, 12);
      const silverMat = new THREE.MeshStandardMaterial({
        color: 0xe2e8f0,
        metalness: 0.95,
        roughness: 0.1,
      });
      const key1 = new THREE.Mesh(key1Geo, silverMat);
      key1.position.set(0, -0.5, 0);
      keysGroup.add(key1);

      // Key 1 teeth
      const toothGeo = new THREE.BoxGeometry(0.12, 0.08, 0.04);
      const tooth1 = new THREE.Mesh(toothGeo, silverMat);
      tooth1.position.set(0.08, -0.7, 0);
      keysGroup.add(tooth1);

      artifactsGroup.add(keysGroup);

      // (D) Floating Campus Book / Notebook
      const bookGroup = new THREE.Group();
      bookGroup.position.set(2.6, 1.4, -0.8);
      bookGroup.rotation.set(-0.35, -0.3, 0.3);

      const coverGeo = new THREE.BoxGeometry(1.1, 1.4, 0.18);
      const coverMat = new THREE.MeshStandardMaterial({
        color: 0x4338ca,
        roughness: 0.4,
        metalness: 0.2,
      });
      const cover = new THREE.Mesh(coverGeo, coverMat);
      bookGroup.add(cover);

      const pageGeo = new THREE.BoxGeometry(1.0, 1.32, 0.14);
      const pageMat = new THREE.MeshStandardMaterial({
        color: 0xf1f5f9,
        roughness: 0.8,
        metalness: 0.0,
      });
      const pages = new THREE.Mesh(pageGeo, pageMat);
      pages.position.set(0.06, 0, 0);
      bookGroup.add(pages);

      artifactsGroup.add(bookGroup);
    }

    // --- 3. Ambient 3D Particle Cloud ---
    const particleCount = 220;
    const particleGeo = new THREE.BufferGeometry();
    const particlePos = new Float32Array(particleCount * 3);
    const particleScales = new Float32Array(particleCount);

    for (let i = 0; i < particleCount; i++) {
      particlePos[i * 3] = (Math.random() - 0.5) * 16;
      particlePos[i * 3 + 1] = (Math.random() - 0.5) * 12;
      particlePos[i * 3 + 2] = (Math.random() - 0.5) * 10 - 1;
      particleScales[i] = Math.random() * 0.08 + 0.02;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePos, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x818cf8,
      size: 0.09,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    // --- Interactive Mouse Dynamics ---
    let targetRotationX = 0;
    let targetRotationY = 0;
    let currentRotationX = 0;
    let currentRotationY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      if (!interactive) return;
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const windowHalfX = window.innerWidth / 2;
      const windowHalfY = window.innerHeight / 2;

      targetRotationY = ((clientX - windowHalfX) / windowHalfX) * 0.45;
      targetRotationX = ((clientY - windowHalfY) / windowHalfY) * 0.35;
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // --- Animation Loop ---
    let animationFrameId: number;
    const clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth camera / master tilt
      currentRotationX += (targetRotationX - currentRotationX) * 0.05;
      currentRotationY += (targetRotationY - currentRotationY) * 0.05;

      masterGroup.rotation.y = currentRotationY;
      masterGroup.rotation.x = currentRotationX;

      // Central Beacon animation
      coreMesh.rotation.y = elapsedTime * 0.4;
      coreMesh.rotation.x = Math.sin(elapsedTime * 0.5) * 0.2;
      cageMesh.rotation.y = -elapsedTime * 0.2;
      cageMesh.rotation.z = elapsedTime * 0.15;

      ring1.rotation.z = elapsedTime * 0.6;
      ring2.rotation.y = -elapsedTime * 0.5;

      // Orbiting satellite
      const satAngle = elapsedTime * 1.2;
      satNode.position.set(
        Math.cos(satAngle) * 1.85,
        Math.sin(satAngle) * 0.8,
        Math.sin(satAngle) * 1.5
      );

      // Floating artifacts bobbing
      if (showArtifacts && artifactsGroup.children.length > 0) {
        artifactsGroup.children.forEach((child, index) => {
          const offset = index * 1.2;
          child.position.y += Math.sin(elapsedTime * 1.4 + offset) * 0.003;
          child.rotation.y += 0.005;
          child.rotation.x += Math.cos(elapsedTime * 0.8 + offset) * 0.003;
        });
      }

      // Particles subtle drift
      particles.rotation.y = elapsedTime * 0.02;
      particles.rotation.x = Math.sin(elapsedTime * 0.03) * 0.05;

      renderer.render(scene, camera);
    };

    animate();
    setIsLoaded(true);

    // --- Resize Handling ---
    const handleResize = () => {
      if (!container) return;
      const newWidth = container.clientWidth;
      const newHeight = container.clientHeight;
      camera.aspect = newWidth / newHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(newWidth, newHeight);
    };

    window.addEventListener('resize', handleResize);

    // --- Cleanup on Unmount ---
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);

      if (container && renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }

      // Dispose resources
      coreGeo.dispose();
      coreMat.dispose();
      cageGeo.dispose();
      cageMat.dispose();
      ring1Geo.dispose();
      ring1Mat.dispose();
      ring2Geo.dispose();
      ring2Mat.dispose();
      satGeo.dispose();
      satMat.dispose();
      particleGeo.dispose();
      particleMat.dispose();
      renderer.dispose();
    };
  }, [interactive, showArtifacts]);

  return (
    <div
      ref={mountRef}
      className={`relative w-full h-full flex items-center justify-center overflow-hidden pointer-events-auto select-none ${className}`}
      style={{ touchAction: 'pan-y' }}
    >
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-indigo-500/20 border-t-indigo-500 animate-spin" />
        </div>
      )}
    </div>
  );
};
