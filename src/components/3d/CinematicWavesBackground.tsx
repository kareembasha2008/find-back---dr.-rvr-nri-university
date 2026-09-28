import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

export type BackgroundIntensity = 'full' | 'medium' | 'subtle' | number;

interface CinematicWavesBackgroundProps {
  intensity?: BackgroundIntensity;
  className?: string;
}

export const CinematicWavesBackground: React.FC<CinematicWavesBackgroundProps> = ({
  intensity = 'full',
  className = '',
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const uniformsListRef = useRef<Record<string, { value: any }>[]>([]);
  const intensityRef = useRef<number>(1.0);

  // Convert intensity prop to numeric factor
  const getNumericIntensity = (val: BackgroundIntensity): number => {
    if (typeof val === 'number') return Math.max(0.1, Math.min(1.0, val));
    if (val === 'subtle') return 0.38;
    if (val === 'medium') return 0.65;
    return 1.0;
  };

  intensityRef.current = getNumericIntensity(intensity);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    // Check prefers-reduced-motion
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Screen dimension & mobile detection
    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;
    const isMobile = width < 768;

    // 1. Scene setup
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x07090e, 0.045);

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 100);
    camera.position.set(0, 0, 9.5);

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: !isMobile,
        powerPreference: 'high-performance',
      });
    } catch (e) {
      console.warn('WebGL not supported, falling back to CSS background');
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, isMobile ? 1.0 : 1.5));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;

    const canvas = renderer.domElement;
    canvas.style.position = 'absolute';
    canvas.style.top = '0';
    canvas.style.left = '0';
    canvas.style.width = '100%';
    canvas.style.height = '100%';
    canvas.style.pointerEvents = 'none';
    container.appendChild(canvas);

    // Master Group for smooth mouse parallax
    const masterGroup = new THREE.Group();
    scene.add(masterGroup);

    // 2. Vertex & Fragment Shaders for Cinematic Ribbons
    const vertexShader = `
      uniform float uTime;
      uniform vec2 uMouse;
      uniform float uSpeed;
      uniform float uFrequency;
      uniform float uAmplitude;
      uniform float uPhase;
      uniform float uMouseStrength;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vElevation;

      void main() {
        vUv = uv;
        vec3 pos = position;

        // Wave 1: Primary graceful sweep
        float w1 = sin(pos.x * uFrequency + uTime * uSpeed + uPhase) * uAmplitude;

        // Wave 2: Harmonic transverse wave
        float w2 = cos(pos.x * (uFrequency * 1.6) - uTime * (uSpeed * 0.7) + uPhase * 1.4) * (uAmplitude * 0.42);

        // Wave 3: Subtle cross-twist across the ribbon width
        float w3 = sin(pos.y * 0.6 + pos.x * 0.25 + uTime * 0.18) * 0.35;

        // Interactive mouse undulation
        float distToMouse = length(pos.xy - uMouse * 5.0);
        float mouseWave = exp(-distToMouse * 0.35) * sin(uTime * 1.6 - distToMouse * 1.2) * (uMouseStrength * 0.65);

        pos.z += w1 + w2 + w3 + mouseWave;
        // Subtle vertical curvature
        pos.y += sin(pos.x * 0.18 + uPhase * 0.8) * 0.55;

        vElevation = pos.z;

        vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
        vViewPosition = -mvPosition.xyz;
        vNormal = normalize(normalMatrix * normal);

        gl_Position = projectionMatrix * mvPosition;
      }
    `;

    const fragmentShader = `
      uniform vec3 uColorA;
      uniform vec3 uColorB;
      uniform vec3 uColorHighlight;
      uniform float uBaseOpacity;
      uniform float uGlobalIntensity;
      uniform float uTime;
      uniform float uDepthFade;

      varying vec2 vUv;
      varying vec3 vNormal;
      varying vec3 vViewPosition;
      varying float vElevation;

      void main() {
        vec3 viewDir = normalize(vViewPosition);
        vec3 normal = normalize(vNormal);

        // Smooth edge taper along ribbon borders (gives fluid silk look)
        float edgeFade = smoothstep(0.0, 0.22, vUv.y) * smoothstep(1.0, 0.78, vUv.y);

        // Soft dissolves at ends of ribbons
        float lengthFade = smoothstep(0.0, 0.14, vUv.x) * smoothstep(1.0, 0.86, vUv.x);

        // Cinematic Fresnel rim lighting (glass-like luminous reflections)
        float fresnel = pow(1.0 - abs(dot(viewDir, normal)), 2.6);

        // Dynamic dual-tone gradient along ribbon coordinates
        float t = vUv.x * 0.8 + sin(vElevation * 0.75 + uTime * 0.2) * 0.2;
        t = clamp(t, 0.0, 1.0);
        vec3 baseColor = mix(uColorA, uColorB, t);

        // Specular highlight on wave crests
        float crest = smoothstep(0.35, 1.1, vElevation);
        vec3 finalColor = mix(baseColor, uColorHighlight, crest * 0.4);

        // Glow injection from fresnel
        finalColor += uColorHighlight * (fresnel * 0.55);

        // Distance fog attenuation (distant sections fade into charcoal)
        float depth = length(vViewPosition);
        float depthFactor = clamp(1.0 - (depth - 5.0) * 0.075 * uDepthFade, 0.05, 1.0);

        float alpha = (0.28 + fresnel * 0.52 + crest * 0.2) * edgeFade * lengthFade * uBaseOpacity * uGlobalIntensity * depthFactor;

        gl_FragColor = vec4(finalColor, alpha);
      }
    `;

    // 3. Ribbon Configurations
    // Colors: Electric Blue, Royal Violet, Cyan, Soft White
    const colorElectricBlue = new THREE.Color(0x2563eb);
    const colorBrightCyan = new THREE.Color(0x06b6d4);
    const colorRoyalViolet = new THREE.Color(0x7c3aed);
    const colorDeepIndigo = new THREE.Color(0x4338ca);
    const colorHighlightWhite = new THREE.Color(0xf1f5f9);

    const ribbonConfigs = [
      // 1. Foreground Ribbon (Electric Blue & Cyan light trail)
      {
        width: 32,
        height: 4.8,
        segmentsX: isMobile ? 60 : 110,
        segmentsY: isMobile ? 12 : 24,
        position: new THREE.Vector3(0, -1.1, 1.2),
        rotation: new THREE.Euler(0.18, 0.04, -0.07),
        colorA: colorElectricBlue,
        colorB: colorBrightCyan,
        colorHighlight: colorHighlightWhite,
        baseOpacity: 0.58,
        speed: 0.22,
        frequency: 0.28,
        amplitude: 1.15,
        phase: 0.0,
        mouseStrength: 0.75,
        depthFade: 0.8,
      },
      // 2. Midground Violet Ribbon (Royal Violet & Indigo sweep)
      {
        width: 34,
        height: 5.2,
        segmentsX: isMobile ? 55 : 100,
        segmentsY: isMobile ? 12 : 22,
        position: new THREE.Vector3(0.6, 0.7, -2.4),
        rotation: new THREE.Euler(-0.14, -0.05, 0.08),
        colorA: colorRoyalViolet,
        colorB: colorDeepIndigo,
        colorHighlight: new THREE.Color(0xc084fc),
        baseOpacity: 0.52,
        speed: 0.17,
        frequency: 0.24,
        amplitude: 1.25,
        phase: 2.1,
        mouseStrength: 0.55,
        depthFade: 1.0,
      },
      // 3. Distant Ambient Flow (Deep mysterious background wave)
      {
        width: 38,
        height: 6.2,
        segmentsX: isMobile ? 40 : 80,
        segmentsY: isMobile ? 10 : 18,
        position: new THREE.Vector3(-1.0, 1.6, -5.8),
        rotation: new THREE.Euler(0.22, 0.02, -0.04),
        colorA: new THREE.Color(0x1e1b4b),
        colorB: new THREE.Color(0x0c4a6e),
        colorHighlight: new THREE.Color(0x38bdf8),
        baseOpacity: 0.44,
        speed: 0.12,
        frequency: 0.18,
        amplitude: 1.35,
        phase: 4.2,
        mouseStrength: 0.35,
        depthFade: 1.3,
      },
      // 4. Accent Filament (Luminous high-frequency light trail)
      {
        width: 30,
        height: 2.2,
        segmentsX: isMobile ? 50 : 90,
        segmentsY: isMobile ? 8 : 16,
        position: new THREE.Vector3(-0.3, -0.2, 0.3),
        rotation: new THREE.Euler(0.06, 0.08, -0.14),
        colorA: colorBrightCyan,
        colorB: colorElectricBlue,
        colorHighlight: colorHighlightWhite,
        baseOpacity: 0.65,
        speed: 0.26,
        frequency: 0.35,
        amplitude: 0.85,
        phase: 1.5,
        mouseStrength: 0.85,
        depthFade: 0.9,
      },
    ];

    const ribbonMeshes: THREE.Mesh[] = [];
    const ribbonGeos: THREE.BufferGeometry[] = [];
    const ribbonMats: THREE.ShaderMaterial[] = [];
    uniformsListRef.current = [];

    ribbonConfigs.forEach((cfg) => {
      const geo = new THREE.PlaneGeometry(
        cfg.width,
        cfg.height,
        cfg.segmentsX,
        cfg.segmentsY
      );

      const uniforms = {
        uTime: { value: 0 },
        uMouse: { value: new THREE.Vector2(0, 0) },
        uSpeed: { value: cfg.speed },
        uFrequency: { value: cfg.frequency },
        uAmplitude: { value: cfg.amplitude },
        uPhase: { value: cfg.phase },
        uMouseStrength: { value: cfg.mouseStrength },
        uColorA: { value: cfg.colorA },
        uColorB: { value: cfg.colorB },
        uColorHighlight: { value: cfg.colorHighlight },
        uBaseOpacity: { value: cfg.baseOpacity },
        uGlobalIntensity: { value: intensityRef.current },
        uDepthFade: { value: cfg.depthFade },
      };

      const mat = new THREE.ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });

      const mesh = new THREE.Mesh(geo, mat);
      mesh.position.copy(cfg.position);
      mesh.rotation.copy(cfg.rotation);

      masterGroup.add(mesh);
      ribbonMeshes.push(mesh);
      ribbonGeos.push(geo);
      ribbonMats.push(mat);
      uniformsListRef.current.push(uniforms);
    });

    // 4. Subtle Ambient Stardust (Sparse, controlled atmospheric motes - NOT excessive particles)
    const particleCount = isMobile ? 24 : 45;
    const particleGeo = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      particlePositions[i * 3] = (Math.random() - 0.5) * 22;
      particlePositions[i * 3 + 1] = (Math.random() - 0.5) * 14;
      particlePositions[i * 3 + 2] = (Math.random() - 0.5) * 10 - 2;
    }

    particleGeo.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));

    const particleMat = new THREE.PointsMaterial({
      color: 0x93c5fd,
      size: 0.05,
      transparent: true,
      opacity: 0.35,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    const particles = new THREE.Points(particleGeo, particleMat);
    masterGroup.add(particles);

    // 5. Interactive Cursor Dynamics with Damping
    let targetMouseX = 0;
    let targetMouseY = 0;
    let currentMouseX = 0;
    let currentMouseY = 0;

    const handlePointerMove = (e: MouseEvent | TouchEvent) => {
      const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
      const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;

      const halfW = window.innerWidth / 2;
      const halfH = window.innerHeight / 2;

      targetMouseX = (clientX - halfW) / halfW;
      targetMouseY = (clientY - halfH) / halfH;
    };

    window.addEventListener('mousemove', handlePointerMove, { passive: true });
    window.addEventListener('touchmove', handlePointerMove, { passive: true });

    // 6. Animation Loop
    let animationFrameId: number;
    const clock = new THREE.Clock();
    let isTabVisible = true;

    const handleVisibilityChange = () => {
      isTabVisible = document.visibilityState === 'visible';
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    const animate = () => {
      if (!isTabVisible) {
        animationFrameId = requestAnimationFrame(animate);
        return;
      }

      animationFrameId = requestAnimationFrame(animate);
      const elapsedTime = clock.getElapsedTime();

      // Smooth lerp mouse coordinates
      currentMouseX += (targetMouseX - currentMouseX) * 0.035;
      currentMouseY += (targetMouseY - currentMouseY) * 0.035;

      // Subtle scene tilt parallax
      masterGroup.rotation.y = currentMouseX * 0.08;
      masterGroup.rotation.x = -currentMouseY * 0.06;

      // Update shader uniforms
      const currentGlobalIntensity = intensityRef.current;
      uniformsListRef.current.forEach((u) => {
        u.uTime.value = elapsedTime;
        u.uMouse.value.set(currentMouseX, -currentMouseY);
        u.uGlobalIntensity.value = currentGlobalIntensity;
      });

      // Ambient particle slow drift
      if (particles) {
        particles.rotation.y = elapsedTime * 0.012;
        particles.rotation.x = Math.sin(elapsedTime * 0.02) * 0.02;
      }

      renderer.render(scene, camera);

      // If user prefers reduced motion, render one frame and freeze loop
      if (prefersReducedMotion) {
        cancelAnimationFrame(animationFrameId);
      }
    };

    animate();

    // 7. Window Resize Handler
    const handleResize = () => {
      if (!container) return;
      width = container.clientWidth || window.innerWidth;
      height = container.clientHeight || window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();

      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, width < 768 ? 1.0 : 1.5));
    };

    window.addEventListener('resize', handleResize);

    // 8. Cleanup
    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('resize', handleResize);
      document.removeEventListener('visibilitychange', handleVisibilityChange);

      ribbonGeos.forEach((g) => g.dispose());
      ribbonMats.forEach((m) => m.dispose());
      particleGeo.dispose();
      particleMat.dispose();

      if (canvas && container.contains(canvas)) {
        container.removeChild(canvas);
      }
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      aria-hidden="true"
      className={`fixed inset-0 pointer-events-none select-none overflow-hidden z-0 ${className}`}
      style={{
        background: '#07090e',
      }}
    >
      {/* Subtle atmospheric vignette and ambient backdrop glow */}
      <div
        className="absolute inset-0 pointer-events-none z-1"
        style={{
          backgroundImage: `
            radial-gradient(ellipse 85% 55% at 50% 0%, rgba(37, 99, 235, 0.14), transparent 70%),
            radial-gradient(circle 700px at 15% 40%, rgba(124, 58, 237, 0.09), transparent 60%),
            radial-gradient(circle 650px at 85% 65%, rgba(6, 182, 212, 0.08), transparent 60%),
            radial-gradient(ellipse 100% 100% at 50% 50%, transparent 40%, rgba(7, 9, 14, 0.75) 100%)
          `,
          backgroundAttachment: 'fixed',
        }}
      />
    </div>
  );
};
