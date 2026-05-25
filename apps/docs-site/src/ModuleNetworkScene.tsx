import React, { useEffect, useRef } from "react";
import { css } from "../styled-system/css";
import type * as ThreeNamespace from "three";

type ThreeModule = typeof ThreeNamespace;

type ModuleCard = {
  readonly group: ThreeNamespace.Group;
  readonly baseX: number;
  readonly baseY: number;
  readonly baseZ: number;
  readonly phase: number;
};

type OrbitNode = {
  readonly mesh: ThreeNamespace.Mesh;
  readonly radius: number;
  readonly angle: number;
  readonly speed: number;
  readonly height: number;
};

const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export function ModuleNetworkScene() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;

    if (!container) {
      return;
    }

    let disposed = false;
    let animationFrame = 0;
    let renderer: ThreeNamespace.WebGLRenderer | undefined;

    async function mountScene() {
      const THREE: ThreeModule = await import("three");

      if (disposed || !containerRef.current) {
        return;
      }

      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
      const root = new THREE.Group();
      const constellation = new THREE.Group();
      const orbit = new THREE.Group();
      const reducedMotion = prefersReducedMotion();

      camera.position.set(0, 0.38, 8.2);
      root.rotation.set(-0.12, -0.42, 0.03);
      root.position.set(0.18, 0.02, 0);
      scene.add(root);
      root.add(constellation, orbit);

      const ambient = new THREE.AmbientLight(0xf8fbff, 1.32);
      const keyLight = new THREE.PointLight(0x67e8f9, 86, 15);
      const rimLight = new THREE.PointLight(0xc084fc, 72, 15);
      const warmLight = new THREE.PointLight(0xfb7185, 26, 12);

      keyLight.position.set(2.7, 3.0, 4.2);
      rimLight.position.set(-3.4, -1.6, 4.6);
      warmLight.position.set(1.1, -2.8, 3.2);
      scene.add(ambient, keyLight, rimLight, warmLight);

      const cyanGlass = new THREE.MeshPhysicalMaterial({
        color: 0xa5f3fc,
        emissive: 0x0891b2,
        emissiveIntensity: 0.22,
        metalness: 0.08,
        roughness: 0.06,
        transmission: 0.36,
        transparent: true,
        opacity: 0.46,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      });
      const violetGlass = new THREE.MeshPhysicalMaterial({
        color: 0xc4b5fd,
        emissive: 0x7c3aed,
        emissiveIntensity: 0.18,
        metalness: 0.12,
        roughness: 0.09,
        transmission: 0.28,
        transparent: true,
        opacity: 0.38,
        clearcoat: 1,
        clearcoatRoughness: 0.05,
      });
      const emeraldGlass = new THREE.MeshPhysicalMaterial({
        color: 0x86efac,
        emissive: 0x059669,
        emissiveIntensity: 0.14,
        metalness: 0.1,
        roughness: 0.08,
        transmission: 0.22,
        transparent: true,
        opacity: 0.34,
        clearcoat: 1,
        clearcoatRoughness: 0.06,
      });
      const deepGlass = new THREE.MeshPhysicalMaterial({
        color: 0x0f172a,
        emissive: 0x082f49,
        emissiveIntensity: 0.72,
        metalness: 0.35,
        roughness: 0.18,
        transparent: true,
        opacity: 0.9,
      });
      const cyanLine = new THREE.LineBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.7 });
      const violetLine = new THREE.LineBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.58 });
      const softWhiteLine = new THREE.LineBasicMaterial({ color: 0xf0f9ff, transparent: true, opacity: 0.74 });
      const cyanSprite = new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.9 });
      const violetSprite = new THREE.MeshBasicMaterial({ color: 0xc084fc, transparent: true, opacity: 0.86 });
      const emeraldSprite = new THREE.MeshBasicMaterial({ color: 0x34d399, transparent: true, opacity: 0.8 });
      const whiteSprite = new THREE.MeshBasicMaterial({ color: 0xf8fafc, transparent: true, opacity: 0.82 });

      const core = new THREE.Mesh(new THREE.IcosahedronGeometry(0.82, 2), cyanGlass);
      const coreInner = new THREE.Mesh(new THREE.IcosahedronGeometry(0.46, 1), violetSprite);
      const coreWire = new THREE.LineSegments(
        new THREE.EdgesGeometry(new THREE.IcosahedronGeometry(0.84, 2)),
        new THREE.LineBasicMaterial({ color: 0xe0f2fe, transparent: true, opacity: 0.92 }),
      );
      const coreHalo = new THREE.Mesh(
        new THREE.TorusKnotGeometry(1.12, 0.012, 190, 8, 2, 3),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.54 }),
      );

      coreInner.scale.set(0.96, 0.96, 0.96);
      coreHalo.rotation.set(0.64, 0.2, -0.42);
      constellation.add(core, coreInner, coreWire, coreHalo);

      const moduleCards: ModuleCard[] = [];
      const cardGeometry = new THREE.BoxGeometry(1.1, 0.46, 0.07);
      const cardEdgeGeometry = new THREE.EdgesGeometry(cardGeometry);
      const cardBarGeometry = new THREE.BoxGeometry(0.44, 0.05, 0.04);
      const cardDotGeometry = new THREE.SphereGeometry(0.04, 16, 16);
      const cardPalette = [cyanGlass, violetGlass, emeraldGlass, cyanGlass, violetGlass, emeraldGlass];
      const moduleData = [
        { x: -1.88, y: 0.92, z: 0.34, rx: -0.1, ry: 0.46, rz: -0.12, phase: 0.1 },
        { x: 1.74, y: 0.66, z: 0.16, rx: 0.08, ry: -0.38, rz: 0.1, phase: 1.0 },
        { x: -1.52, y: -0.86, z: 0.58, rx: 0.14, ry: 0.34, rz: 0.13, phase: 1.8 },
        { x: 1.46, y: -0.96, z: 0.42, rx: -0.08, ry: -0.5, rz: -0.1, phase: 2.7 },
        { x: -0.18, y: 1.78, z: -0.08, rx: 0.18, ry: 0.12, rz: 0.04, phase: 3.6 },
        { x: 0.18, y: -1.86, z: 0.2, rx: -0.18, ry: -0.14, rz: -0.04, phase: 4.4 },
      ];

      moduleData.forEach((data, index) => {
        const group = new THREE.Group();
        const material = cardPalette[index]!.clone();
        const card = new THREE.Mesh(cardGeometry, material);
        const edge = new THREE.LineSegments(cardEdgeGeometry, index % 2 === 0 ? cyanLine : violetLine);
        const dot = new THREE.Mesh(cardDotGeometry, index % 3 === 0 ? emeraldSprite : whiteSprite);
        const firstBar = new THREE.Mesh(cardBarGeometry, deepGlass);
        const secondBar = new THREE.Mesh(cardBarGeometry, index % 2 === 0 ? violetSprite : emeraldSprite);
        const thirdBar = new THREE.Mesh(cardBarGeometry, cyanSprite);

        material.opacity = 0.34;
        dot.position.set(-0.43, 0.12, 0.08);
        firstBar.position.set(-0.07, 0.12, 0.09);
        secondBar.position.set(0.17, -0.02, 0.09);
        thirdBar.position.set(-0.12, -0.15, 0.09);
        firstBar.scale.x = 0.9;
        secondBar.scale.x = 0.66;
        thirdBar.scale.x = 0.48;
        edge.position.z = 0.015;
        group.position.set(data.x, data.y, data.z);
        group.rotation.set(data.rx, data.ry, data.rz);
        group.add(card, edge, dot, firstBar, secondBar, thirdBar);
        constellation.add(group);
        moduleCards.push({ group, baseX: data.x, baseY: data.y, baseZ: data.z, phase: data.phase });
      });

      moduleData.forEach((data, index) => {
        const curve = new THREE.CatmullRomCurve3([
          new THREE.Vector3(0, 0, 0),
          new THREE.Vector3(data.x * 0.34, data.y * 0.58, 0.72 + Math.sin(index) * 0.18),
          new THREE.Vector3(data.x * 0.68, data.y * 0.86, data.z + 0.22),
          new THREE.Vector3(data.x, data.y, data.z),
        ]);
        const geometry = new THREE.TubeGeometry(curve, 48, 0.006, 8, false);
        const line = new THREE.Mesh(
          geometry,
          new THREE.MeshBasicMaterial({ color: index % 2 === 0 ? 0x67e8f9 : 0xc084fc, transparent: true, opacity: 0.44 }),
        );

        constellation.add(line);
      });

      const orbitRings = [
        new THREE.Mesh(new THREE.TorusGeometry(2.6, 0.009, 8, 220), cyanSprite),
        new THREE.Mesh(new THREE.TorusGeometry(3.08, 0.007, 8, 220), violetSprite),
        new THREE.Mesh(new THREE.TorusGeometry(1.92, 0.006, 8, 220), emeraldSprite),
      ];

      orbitRings[0]!.rotation.set(1.12, 0.3, 0.28);
      orbitRings[1]!.rotation.set(1.38, -0.48, 0.72);
      orbitRings[2]!.rotation.set(1.0, 0.82, -0.54);
      orbitRings.forEach((ring) => orbit.add(ring));

      const nodeGeometry = new THREE.SphereGeometry(0.052, 18, 18);
      const orbitNodes: OrbitNode[] = Array.from({ length: 26 }, (_, index) => {
        const material = index % 4 === 0 ? emeraldSprite : index % 4 === 1 ? cyanSprite : index % 4 === 2 ? violetSprite : whiteSprite;
        const mesh = new THREE.Mesh(nodeGeometry, material);
        const radius = 1.85 + (index % 7) * 0.22;
        const angle = (index / 26) * Math.PI * 2;
        const height = 0.88 + (index % 5) * 0.18;

        mesh.position.set(Math.cos(angle) * radius, Math.sin(angle * 1.24) * height, Math.sin(angle) * 0.78);
        orbit.add(mesh);

        return { mesh, radius, angle, speed: 0.14 + index * 0.006, height };
      });

      const shardGeometry = new THREE.BufferGeometry();
      const shardPositions = new Float32Array(220 * 3);

      for (let index = 0; index < 220; index += 1) {
        shardPositions[index * 3] = (Math.random() - 0.5) * 7.8;
        shardPositions[index * 3 + 1] = (Math.random() - 0.5) * 5.6;
        shardPositions[index * 3 + 2] = -2.2 + (Math.random() - 0.5) * 2.8;
      }

      shardGeometry.setAttribute("position", new THREE.BufferAttribute(shardPositions, 3));
      const shards = new THREE.Points(
        shardGeometry,
        new THREE.PointsMaterial({ color: 0xe0f2fe, size: 0.025, transparent: true, opacity: 0.62 }),
      );
      root.add(shards);

      const aurora = new THREE.Mesh(
        new THREE.PlaneGeometry(5.4, 3.8),
        new THREE.MeshBasicMaterial({ color: 0x67e8f9, transparent: true, opacity: 0.035, side: THREE.DoubleSide }),
      );
      aurora.position.set(0.12, 0.02, -0.9);
      aurora.rotation.set(0.18, -0.18, 0.38);
      root.add(aurora);

      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: "high-performance" });
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      containerRef.current.appendChild(renderer.domElement);

      const canvas = renderer.domElement;
      let isDragging = false;
      let lastPointerX = 0;
      let lastPointerY = 0;
      let targetRotationX = 0;
      let targetRotationY = 0;
      let smoothRotationX = 0;
      let smoothRotationY = 0;

      const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max);

      const setCursor = (cursor: "grab" | "grabbing") => {
        canvas.style.cursor = cursor;
      };

      const handlePointerDown = (event: PointerEvent) => {
        isDragging = true;
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        canvas.setPointerCapture(event.pointerId);
        setCursor("grabbing");
        event.preventDefault();
      };

      const handlePointerMove = (event: PointerEvent) => {
        if (!isDragging) {
          return;
        }

        const deltaX = event.clientX - lastPointerX;
        const deltaY = event.clientY - lastPointerY;

        targetRotationY = clamp(targetRotationY + deltaX * 0.006, -1.15, 1.15);
        targetRotationX = clamp(targetRotationX + deltaY * 0.0045, -0.62, 0.62);
        lastPointerX = event.clientX;
        lastPointerY = event.clientY;
        event.preventDefault();
      };

      const handlePointerUp = (event: PointerEvent) => {
        if (!isDragging) {
          return;
        }

        isDragging = false;

        if (canvas.hasPointerCapture(event.pointerId)) {
          canvas.releasePointerCapture(event.pointerId);
        }

        setCursor("grab");
      };

      canvas.style.touchAction = "none";
      setCursor("grab");
      canvas.addEventListener("pointerdown", handlePointerDown);
      canvas.addEventListener("pointermove", handlePointerMove);
      canvas.addEventListener("pointerup", handlePointerUp);
      canvas.addEventListener("pointercancel", handlePointerUp);
      canvas.addEventListener("lostpointercapture", handlePointerUp);

      const resize = () => {
        const currentContainer = containerRef.current;

        if (!currentContainer || !renderer) {
          return;
        }

        const width = currentContainer.clientWidth || 640;
        const height = currentContainer.clientHeight || 500;

        camera.aspect = width / height;
        camera.updateProjectionMatrix();
        renderer.setSize(width, height, false);
      };

      const render = (time: number) => {
        if (!renderer) {
          return;
        }

        const seconds = time * 0.001;

        smoothRotationX += (targetRotationX - smoothRotationX) * 0.09;
        smoothRotationY += (targetRotationY - smoothRotationY) * 0.09;

        root.rotation.y = -0.42 + smoothRotationY + (reducedMotion ? 0 : Math.sin(seconds * 0.2) * 0.14);
        root.rotation.x = -0.12 + smoothRotationX + (reducedMotion ? 0 : Math.sin(seconds * 0.32) * 0.05);

        if (!reducedMotion) {
          constellation.position.y = Math.sin(seconds * 0.58) * 0.06;
          core.rotation.y = seconds * 0.42;
          core.rotation.x = seconds * 0.22;
          coreInner.rotation.y = -seconds * 0.68;
          coreWire.rotation.y = seconds * 0.34;
          coreHalo.rotation.z = -0.42 + seconds * 0.36;
          orbit.rotation.z = seconds * 0.14;
          orbit.rotation.y = seconds * 0.12;
          shards.rotation.z = seconds * 0.014;
          aurora.rotation.z = 0.38 + Math.sin(seconds * 0.18) * 0.08;

          moduleCards.forEach(({ group, baseX, baseY, baseZ, phase }, index) => {
            group.position.x = baseX + Math.sin(seconds * 0.72 + phase) * 0.035;
            group.position.y = baseY + Math.sin(seconds * 1.04 + phase) * 0.08;
            group.position.z = baseZ + Math.cos(seconds * 0.82 + phase) * 0.055;
            group.rotation.z += Math.sin(seconds * 0.78 + phase + index) * 0.0009;
          });

          orbitNodes.forEach(({ mesh, radius, angle, speed, height }, index) => {
            const current = angle + seconds * speed;
            mesh.position.x = Math.cos(current) * radius;
            mesh.position.z = Math.sin(current) * 0.88;
            mesh.position.y = Math.sin(current * 1.36 + index * 0.35) * height;
          });
        }

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(render);
      };

      resize();
      window.addEventListener("resize", resize);
      animationFrame = window.requestAnimationFrame(render);

      return () => {
        window.removeEventListener("resize", resize);
        canvas.removeEventListener("pointerdown", handlePointerDown);
        canvas.removeEventListener("pointermove", handlePointerMove);
        canvas.removeEventListener("pointerup", handlePointerUp);
        canvas.removeEventListener("pointercancel", handlePointerUp);
        canvas.removeEventListener("lostpointercapture", handlePointerUp);
      };
    }

    let removeResizeListener: (() => void) | undefined;

    void mountScene().then((cleanup) => {
      removeResizeListener = cleanup;
    });

    return () => {
      disposed = true;
      removeResizeListener?.();
      window.cancelAnimationFrame(animationFrame);
      renderer?.dispose();

      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
    };
  }, []);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className={css({
        position: "absolute",
        zIndex: "1",
        inset: { base: "auto -118px -92px auto", sm: "auto -90px -112px auto", lg: "-4px -2px 4px auto" },
        w: { base: "430px", sm: "520px", md: "620px", lg: "690px" },
        h: { base: "380px", sm: "450px", md: "510px", lg: "570px" },
        opacity: { base: "0.78", sm: "0.88", lg: "0.99" },
        pointerEvents: "auto",
        filter: "drop-shadow(0 38px 110px rgba(103, 232, 249, 0.42)) drop-shadow(0 18px 54px rgba(192, 132, 252, 0.34))",
        transform: { base: "scale(0.86)", md: "scale(1)" },
        transformOrigin: "bottom right",
        '& canvas': {
          display: "block",
          w: "full!",
          h: "full!",
        },
      })}
    />
  );
}
