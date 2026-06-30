import * as THREE from "three";
import { useEffect, useRef, useState } from "react";

function isWebGLSupported(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return !!(
      canvas.getContext("webgl") ||
      canvas.getContext("experimental-webgl")
    );
  } catch {
    return false;
  }
}

export function InteractiveParticlesBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [webglOk, setWebglOk] = useState(true);

  useEffect(() => {
    setWebglOk(isWebGLSupported());
  }, []);

  useEffect(() => {
    if (!webglOk || !containerRef.current) return;

    console.log("InteractiveParticlesBackground mounted");

    const container = containerRef.current;
    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    const range = Math.max(width, height) * 0.7;
    const rangeZ = range * 0.25;

    const scene = new THREE.Scene();

    const camera = new THREE.PerspectiveCamera(60, width / height, 0.1, 2000);
    camera.position.z = range * 1.1;

    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    const count = 2500;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);

    const particleData: {
      baseX: number;
      baseY: number;
      baseZ: number;
      currentX: number;
      currentY: number;
      currentZ: number;
      driftX: number;
      driftY: number;
      driftZ: number;
    }[] = [];

    const purple = { r: 0.42, g: 0.30, b: 0.95 };
    const blue = { r: 0.23, g: 0.51, b: 0.96 };
    const lightPurple = { r: 0.60, g: 0.50, b: 1.0 };
    const lightBlue = { r: 0.50, g: 0.65, b: 1.0 };

    const palette = [purple, blue, lightPurple, lightBlue];

    for (let i = 0; i < count; i++) {
      const bx = (Math.random() - 0.5) * range;
      const by = (Math.random() - 0.5) * range;
      const bz = (Math.random() - 0.5) * rangeZ;

      particleData.push({
        baseX: bx,
        baseY: by,
        baseZ: bz,
        currentX: bx,
        currentY: by,
        currentZ: bz,
        driftX: (Math.random() - 0.5) * 0.3,
        driftY: (Math.random() - 0.5) * 0.3,
        driftZ: (Math.random() - 0.5) * 0.15,
      });

      positions[i * 3] = bx;
      positions[i * 3 + 1] = by;
      positions[i * 3 + 2] = bz;

      const c = palette[Math.floor(Math.random() * palette.length)];
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      size: 2.0,
      vertexColors: true,
      transparent: true,
      opacity: 0.45,
      depthWrite: false,
      sizeAttenuation: true,
    });

    const points = new THREE.Points(geometry, material);
    scene.add(points);

    let mouseX = 0;
    let mouseY = 0;
    let mouseActive = false;

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      mouseActive = true;
    };

    const onMouseLeave = () => {
      mouseActive = false;
    };

    container.addEventListener("mousemove", onMouseMove);
    container.addEventListener("mouseleave", onMouseLeave);

    let animId: number;

    const animate = () => {
      animId = requestAnimationFrame(animate);

      const pos = geometry.attributes.position.array as Float32Array;
      const repRadius = 0.35;
      const repStrength = 0.04;
      const returnSpeed = 0.012;

      for (let i = 0; i < count; i++) {
        const p = particleData[i];

        p.currentX += p.driftX;
        p.currentY += p.driftY;
        p.currentZ += p.driftZ;

        const dx = p.currentX - p.baseX;
        const dy = p.currentY - p.baseY;
        const dz = p.currentZ - p.baseZ;
        const limit = range * 0.06;

        if (Math.abs(dx) > limit) p.driftX *= -0.5;
        if (Math.abs(dy) > limit) p.driftY *= -0.5;
        if (Math.abs(dz) > limit) p.driftZ *= -0.5;

        if (mouseActive) {
          const nx = p.currentX / (range * 0.5);
          const ny = p.currentY / (range * 0.5);
          const mx = nx - mouseX;
          const my = ny - mouseY;
          const dist = Math.sqrt(mx * mx + my * my);

          if (dist < repRadius && dist > 0.001) {
            const force = ((repRadius - dist) / repRadius) * repStrength;
            const norm = range * 0.5;
            p.currentX += (mx / dist) * force * norm;
            p.currentY += (my / dist) * force * norm;
          }
        }

        p.currentX += (p.baseX - p.currentX) * returnSpeed;
        p.currentY += (p.baseY - p.currentY) * returnSpeed;
        p.currentZ += (p.baseZ - p.currentZ) * returnSpeed;

        pos[i * 3] = p.currentX;
        pos[i * 3 + 1] = p.currentY;
        pos[i * 3 + 2] = p.currentZ;
      }

      geometry.attributes.position.needsUpdate = true;
      renderer.render(scene, camera);
    };

    animate();

    const onResize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (w === 0 || h === 0) return;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", onResize);
      container.removeEventListener("mousemove", onMouseMove);
      container.removeEventListener("mouseleave", onMouseLeave);
      renderer.dispose();
      geometry.dispose();
      material.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [webglOk]);

  if (!webglOk) {
    return (
      <div
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(180deg, rgba(108,76,241,0.06) 0%, rgba(59,130,246,0.03) 50%, transparent 100%)",
        }}
      />
    );
  }

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 z-0"
    />
  );
}
