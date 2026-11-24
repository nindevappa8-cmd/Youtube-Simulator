import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import type { LaptopSpec } from '../lib/gameData';

interface Laptop3DViewerProps {
  laptop: LaptopSpec;
  heightClass?: string;
}

const _color = new THREE.Color();

function createBrandCanvasTexture(laptop: LaptopSpec, isScreen: boolean): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = isScreen ? 320 : 128;
  const ctx = canvas.getContext('2d');

  if (ctx) {
    if (isScreen) {
      const grad = ctx.createLinearGradient(0, 0, 512, 320);
      grad.addColorStop(0, '#0a0a0c');
      grad.addColorStop(0.55, '#131318');
      grad.addColorStop(1, '#1a0909');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 512, 320);

      // Subtle red grid lines
      ctx.strokeStyle = 'rgba(255, 32, 32, 0.14)';
      ctx.lineWidth = 1;
      for (let x = 0; x < 512; x += 32) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, 320);
        ctx.stroke();
      }
      for (let y = 0; y < 320; y += 32) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(512, y);
        ctx.stroke();
      }

      // Studio UI bars
      ctx.fillStyle = laptop.chassisStyle.accentColor;
      ctx.fillRect(28, 28, 12, 40);
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 26px sans-serif';
      ctx.fillText('YOUTUBE STUDIO', 54, 57);

      ctx.fillStyle = '#A0A0A0';
      ctx.font = '16px monospace';
      ctx.fillText(`${laptop.name}  |  ${laptop.cpu}`, 28, 96);
      ctx.fillText(`${laptop.storageLabel}  |  ${laptop.ramLabel}  |  ${laptop.cameraLabel}`, 28, 122);

      // Timeline graphic
      ctx.fillStyle = '#1f1f24';
      ctx.fillRect(28, 162, 456, 118);
      ctx.strokeStyle = 'rgba(255,255,255,0.12)';
      ctx.strokeRect(28, 162, 456, 118);

      ctx.fillStyle = '#FF2020';
      ctx.fillRect(44, 188, 240, 20);
      ctx.fillStyle = '#20D878';
      ctx.fillRect(44, 218, 340, 16);
      ctx.fillStyle = laptop.chassisStyle.accentColor;
      ctx.fillRect(44, 244, 180, 14);
    } else {
      ctx.fillStyle = laptop.id === 'geforce-maxed-gaming' ? '#e4e4e7' : '#121215';
      ctx.fillRect(0, 0, 512, 128);
      ctx.fillStyle = laptop.chassisStyle.accentColor;
      ctx.font = 'bold 34px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('GEFORCE STUDIO', 256, 64);
    }
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createContactShadowTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  if (ctx) {
    const grad = ctx.createRadialGradient(128, 128, 16, 128, 128, 128);
    grad.addColorStop(0, 'rgba(0,0,0,0.75)');
    grad.addColorStop(0.6, 'rgba(0,0,0,0.28)');
    grad.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 256, 256);
  }
  return new THREE.CanvasTexture(canvas);
}

function buildLaptopModel(laptop: LaptopSpec, maxAniso: number) {
  const root = new THREE.Group();
  const s = laptop.chassisStyle;
  const disposables: { geometries: THREE.BufferGeometry[]; materials: THREE.Material[]; textures: THREE.Texture[] } = {
    geometries: [],
    materials: [],
    textures: [],
  };

  const trackGeo = <T extends THREE.BufferGeometry>(g: T): T => {
    disposables.geometries.push(g);
    return g;
  };
  const trackMat = <T extends THREE.Material>(m: T): T => {
    disposables.materials.push(m);
    return m;
  };
  const trackTex = <T extends THREE.Texture>(t: T): T => {
    t.anisotropy = maxAniso;
    disposables.textures.push(t);
    return t;
  };

  const isMaxed = laptop.id === 'geforce-maxed-gaming';
  const bodyMat = trackMat(
    new THREE.MeshPhysicalMaterial({
      color: s.bodyColor,
      metalness: isMaxed ? 0.85 : 0.65,
      roughness: isMaxed ? 0.22 : 0.36,
      clearcoat: isMaxed || s.rgbMode === 'futuristic' ? 0.7 : 0.2,
      clearcoatRoughness: 0.25,
    })
  );
  const darkMetalMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#111114',
      metalness: 0.75,
      roughness: 0.35,
    })
  );
  const bezelMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#0b0b0e',
      metalness: 0.2,
      roughness: 0.7,
    })
  );
  const accentMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: s.accentColor,
      emissive: s.accentColor,
      emissiveIntensity: s.rgbMode === 'none' ? 0.12 : 0.85,
      metalness: 0.4,
      roughness: 0.25,
    })
  );
  const rubberMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#090909',
      metalness: 0.05,
      roughness: 0.9,
    })
  );

  const footHeight = 0.035;
  const baseY = footHeight + s.baseThickness / 2;

  // 12. Underside (bottom plate + 4 rubber feet)
  const undersideGroup = new THREE.Group();
  const bottomPlate = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(s.width * 0.96, 0.02, s.depth * 0.96)),
    darkMetalMat
  );
  bottomPlate.position.y = footHeight;
  undersideGroup.add(bottomPlate);

  const footGeo = trackGeo(new THREE.CylinderGeometry(0.09, 0.1, footHeight, 16));
  const fx = s.width * 0.41;
  const fz = s.depth * 0.39;
  for (const [x, z] of [[-fx, -fz], [fx, -fz], [-fx, fz], [fx, fz]]) {
    const foot = new THREE.Mesh(footGeo, rubberMat);
    foot.position.set(x, footHeight / 2, z);
    foot.castShadow = true;
    undersideGroup.add(foot);
  }
  root.add(undersideGroup);

  // 5. Keyboard base (visible thickness & distinct proportions)
  const baseMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(s.width, s.baseThickness, s.depth)),
    bodyMat
  );
  baseMesh.position.y = baseY;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  root.add(baseMesh);

  // 8. Front edge chamfer / accent lip
  const frontEdge = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(s.width * 0.98, s.baseThickness * 0.38, 0.06)),
    s.rgbMode === 'pro' || s.rgbMode === 'futuristic' || s.rgbMode === 'metallic' ? accentMat : darkMetalMat
  );
  frontEdge.position.set(0, baseY - s.baseThickness * 0.2, s.depth / 2 + 0.01);
  root.add(frontEdge);

  // 7. Trackpad
  const trackpadW = s.width * 0.32;
  const trackpadD = s.depth * 0.26;
  const trackpad = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(trackpadW, 0.015, trackpadD)),
    trackMat(
      new THREE.MeshStandardMaterial({
        color: isMaxed ? '#a1a1aa' : '#1f2026',
        metalness: 0.45,
        roughness: 0.25,
      })
    )
  );
  trackpad.position.set(0, baseY + s.baseThickness / 2 + 0.004, s.depth * 0.29);
  root.add(trackpad);

  // 6. Individual keycaps (InstancedMesh)
  const rows = 5;
  const cols = 13;
  const keyCount = rows * cols;
  const kbWidth = s.width * 0.82;
  const kbDepth = s.depth * 0.42;
  const keyW = (kbWidth / cols) * 0.82;
  const keyD = (kbDepth / rows) * 0.78;
  const keyGeo = trackGeo(new THREE.BoxGeometry(keyW, 0.022, keyD));
  const keyMat = trackMat(
    new THREE.MeshStandardMaterial({
      color: '#18181b',
      metalness: 0.15,
      roughness: 0.55,
      emissive: s.rgbMode === 'none' ? '#000000' : s.accentColor,
      emissiveIntensity: s.rgbMode === 'none' ? 0 : s.rgbMode === 'subtle' ? 0.18 : 0.45,
    })
  );
  const keycaps = new THREE.InstancedMesh(keyGeo, keyMat, keyCount);
  const dummy = new THREE.Object3D();
  let idx = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const kx = -kbWidth / 2 + (c + 0.5) * (kbWidth / cols);
      const kz = -s.depth * 0.28 + (r + 0.5) * (kbDepth / rows);
      dummy.position.set(kx, baseY + s.baseThickness / 2 + 0.012, kz);
      dummy.scale.set(r === 4 && c >= 4 && c <= 8 ? 1.15 : 1, 1, 1);
      dummy.updateMatrix();
      keycaps.setMatrixAt(idx, dummy.matrix);
      if (s.rgbMode === 'gamer' || s.rgbMode === 'pro' || s.rgbMode === 'futuristic' || s.rgbMode === 'metallic') {
        _color.setHSL((c / cols + r * 0.08) % 1, 0.85, 0.55);
        keycaps.setColorAt(idx, _color);
      }
      idx++;
    }
  }
  keycaps.instanceMatrix.needsUpdate = true;
  if (keycaps.instanceColor) keycaps.instanceColor.needsUpdate = true;
  keycaps.computeBoundingSphere();
  root.add(keycaps);

  // 9. Side ports (left and right)
  const portGeo = trackGeo(new THREE.BoxGeometry(0.03, s.baseThickness * 0.32, 0.11));
  for (let p = 0; p < 3; p++) {
    const portL = new THREE.Mesh(portGeo, darkMetalMat);
    portL.position.set(-s.width / 2 - 0.005, baseY, -s.depth * 0.22 + p * 0.24);
    root.add(portL);

    const portR = new THREE.Mesh(portGeo, darkMetalMat);
    portR.position.set(s.width / 2 + 0.005, baseY, -s.depth * 0.22 + p * 0.24);
    root.add(portR);
  }

  // 10. Cooling vents (rear & side fin array scaling by laptop tier)
  const ventGeo = trackGeo(new THREE.BoxGeometry(0.055, s.baseThickness * 0.45, 0.035));
  const ventMat = s.rgbMode === 'pro' || s.rgbMode === 'futuristic' || s.rgbMode === 'metallic' ? accentMat : darkMetalMat;
  for (let v = 0; v < s.ventCount; v++) {
    const offset = -s.width * 0.36 + (v / Math.max(1, s.ventCount - 1)) * (s.width * 0.72);
    const vent = new THREE.Mesh(ventGeo, ventMat);
    vent.position.set(offset, baseY, -s.depth / 2 - 0.008);
    root.add(vent);
  }

  // 4. Hinges
  const hingePivot = new THREE.Group();
  hingePivot.position.set(0, baseY + s.baseThickness / 2, -s.depth / 2 + 0.06);
  const hingeGeo = trackGeo(new THREE.CylinderGeometry(0.042, 0.042, s.width * 0.16, 16));
  hingeGeo.rotateZ(Math.PI / 2);
  for (const hx of [-s.width * 0.28, s.width * 0.28]) {
    const hinge = new THREE.Mesh(hingeGeo, darkMetalMat);
    hinge.position.set(hx, 0, 0);
    hingePivot.add(hinge);
  }

  // Lid group tilted open at ~108 degrees
  const lidGroup = new THREE.Group();
  lidGroup.rotation.x = -0.26;
  const lidHeight = s.depth * 0.96;

  // 3. Screen borders / outer lid shell
  const lidShell = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(s.width, lidHeight, s.lidThickness)),
    bodyMat
  );
  lidShell.position.set(0, lidHeight / 2, -s.lidThickness / 2);
  lidShell.castShadow = true;
  lidGroup.add(lidShell);

  // 2. Screen bezel
  const bezelMesh = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(s.width - 0.04, lidHeight - 0.04, 0.016)),
    bezelMat
  );
  bezelMesh.position.set(0, lidHeight / 2, 0.008);
  lidGroup.add(bezelMesh);

  // 1. Screen display panel
  const screenW = s.width - s.bezelWidth * 2;
  const screenH = lidHeight - s.bezelWidth * 2.1;
  const screenTex = trackTex(createBrandCanvasTexture(laptop, true));
  const screenMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: screenTex,
      emissiveMap: screenTex,
      emissive: new THREE.Color('#ffffff'),
      emissiveIntensity: 0.72,
      roughness: 0.15,
      metalness: 0.1,
    })
  );
  const screenMesh = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(screenW, screenH)),
    screenMat
  );
  screenMesh.position.set(0, lidHeight / 2 + s.bezelWidth * 0.15, 0.02);
  lidGroup.add(screenMesh);

  // 11. Branding (back lid plate + front chin badge)
  const brandTex = trackTex(createBrandCanvasTexture(laptop, false));
  const brandMat = trackMat(
    new THREE.MeshStandardMaterial({
      map: brandTex,
      roughness: 0.3,
      metalness: 0.5,
    })
  );
  const backBrand = new THREE.Mesh(
    trackGeo(new THREE.PlaneGeometry(s.width * 0.46, 0.24)),
    brandMat
  );
  backBrand.rotation.y = Math.PI;
  backBrand.position.set(0, lidHeight * 0.55, -s.lidThickness - 0.003);
  lidGroup.add(backBrand);

  const chinBadge = new THREE.Mesh(
    trackGeo(new THREE.BoxGeometry(0.46, 0.032, 0.008)),
    accentMat
  );
  chinBadge.position.set(0, s.bezelWidth * 0.52, 0.018);
  lidGroup.add(chinBadge);

  hingePivot.add(lidGroup);
  root.add(hingePivot);

  return {
    root,
    lidGroup,
    dispose: () => {
      disposables.geometries.forEach((g) => g.dispose());
      disposables.materials.forEach((m) => m.dispose());
      disposables.textures.forEach((t) => t.dispose());
    },
  };
}

export const Laptop3DViewer: React.FC<Laptop3DViewerProps> = ({
  laptop,
  heightClass = 'h-[360px]',
}) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [lidAngle, setLidAngle] = useState(105);
  const [cameraPreset, setCameraPreset] = useState<'hero' | 'top' | 'rear' | 'side'>('hero');
  const [dockOpen, setDockOpen] = useState(true);
  const [webglError, setWebglError] = useState(false);

  const lidAngleRef = useRef(lidAngle);
  const presetTargetRef = useRef<{ pos: THREE.Vector3; target: THREE.Vector3 } | null>(null);
  const requestRenderRef = useRef<() => void>(() => {});

  useEffect(() => {
    lidAngleRef.current = lidAngle;
    requestRenderRef.current();
  }, [lidAngle]);

  useEffect(() => {
    const presets: Record<'hero' | 'top' | 'rear' | 'side', { pos: [number, number, number]; target: [number, number, number] }> = {
      hero: { pos: [3.2, 2.35, 3.6], target: [0, 0.65, 0] },
      top: { pos: [0, 4.4, 1.3], target: [0, 0.35, 0] },
      rear: { pos: [-2.6, 1.85, -3.5], target: [0, 0.65, 0] },
      side: { pos: [4.2, 1.25, 0.4], target: [0, 0.6, 0] },
    };
    const p = presets[cameraPreset];
    presetTargetRef.current = {
      pos: new THREE.Vector3(...p.pos),
      target: new THREE.Vector3(...p.target),
    };
    requestRenderRef.current();
  }, [cameraPreset]);

  useEffect(() => {
    const mount = containerRef.current;
    if (!mount) return;

    const isSoftwareGl = (() => {
      try {
        const probe = document.createElement('canvas').getContext('webgl2');
        if (!probe) return true;
        const ext = probe.getExtension('WEBGL_debug_renderer_info');
        const param = ext ? ext.UNMASKED_RENDERER_WEBGL : probe.RENDERER;
        const gpu = String(probe.getParameter(param));
        probe.getExtension('WEBGL_lose_context')?.loseContext();
        return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
      } catch {
        return true;
      }
    })();

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        antialias: !isSoftwareGl,
        powerPreference: 'high-performance',
        alpha: true,
      });
    } catch {
      setWebglError(true);
      return;
    }

    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = !isSoftwareGl;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const width = mount.clientWidth || 640;
    const height = mount.clientHeight || 360;
    renderer.setSize(width, height);
    mount.innerHTML = '';
    mount.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c0c0f');
    scene.fog = new THREE.Fog('#0c0c0f', 9, 20);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const camera = new THREE.PerspectiveCamera(40, width / height, 0.1, 100);
    camera.position.set(3.2, 2.35, 3.6);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 0.65, 0);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.08;
    controls.minDistance = 2.2;
    controls.maxDistance = 8.5;
    controls.maxPolarAngle = Math.PI * 0.49;

    // 3-point studio lighting
    const hemi = new THREE.HemisphereLight('#b8d4ff', '#1c1917', 0.55);
    scene.add(hemi);

    const keyLight = new THREE.DirectionalLight('#fff5eb', 1.85);
    keyLight.position.set(4, 6, 4);
    keyLight.castShadow = !isSoftwareGl;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 15;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 3;
    keyLight.shadow.camera.bottom = -3;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#ff2020', 0.9);
    rimLight.position.set(-4, 3, -4);
    scene.add(rimLight);

    // Contact shadow grounding plane
    const shadowTex = createContactShadowTexture();
    const shadowPlaneGeo = new THREE.PlaneGeometry(5.6, 4.4);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTex,
      transparent: true,
      depthWrite: false,
      opacity: 0.6,
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeo, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = 0.002;
    scene.add(shadowPlane);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const model = buildLaptopModel(laptop, maxAniso);
    scene.add(model.root);

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }

    let frameId = 0;
    let disposed = false;
    let renderBusy = false;
    let renderDirty = false;
    const clock = new THREE.Clock();

    function afterDraw(cb: () => void) {
      const gl = renderer.getContext() as WebGL2RenderingContext;
      const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
      gl.flush();
      const poll = () => {
        if (disposed) return;
        const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
        if (state === gl.UNSIGNALED) {
          frameId = window.setTimeout(poll, 5);
        } else {
          if (sync) gl.deleteSync(sync);
          frameId = window.setTimeout(cb, 80);
        }
      };
      frameId = window.setTimeout(poll, 5);
    }

    const requestRender = () => {
      if (disposed) return;
      if (renderBusy) {
        renderDirty = true;
        return;
      }
      renderBusy = true;
      frameId = requestAnimationFrame(() => {
        if (disposed) return;
        renderDirty = false;
        const delta = Math.min(clock.getDelta(), 0.1);

        // Smooth lid angle interpolation
        const targetLidRad = THREE.MathUtils.degToRad(90 - lidAngleRef.current);
        model.lidGroup.rotation.x = THREE.MathUtils.damp(
          model.lidGroup.rotation.x,
          targetLidRad,
          10,
          delta || 0.016
        );
        const lidAnimating = Math.abs(model.lidGroup.rotation.x - targetLidRad) > 0.002;

        // Smooth camera preset interpolation
        let camAnimating = false;
        if (presetTargetRef.current) {
          const t = 1 - Math.exp(-8 * (delta || 0.016));
          camera.position.lerp(presetTargetRef.current.pos, t);
          controls.target.lerp(presetTargetRef.current.target, t);
          if (camera.position.distanceTo(presetTargetRef.current.pos) < 0.02) {
            presetTargetRef.current = null;
          } else {
            camAnimating = true;
          }
        }

        controls.update();
        renderer.render(scene, camera);

        const done = () => {
          renderBusy = false;
          if (!disposed && (renderDirty || lidAnimating || camAnimating)) {
            requestRender();
          }
        };
        if (isSoftwareGl) afterDraw(done);
        else done();
      });
    };

    requestRenderRef.current = requestRender;

    const onControlStart = () => {
      presetTargetRef.current = null;
    };
    const onControlChange = () => requestRender();

    controls.addEventListener('start', onControlStart);
    controls.addEventListener('change', onControlChange);

    const onResize = () => {
      if (!mount || disposed) return;
      const w = mount.clientWidth || 640;
      const h = mount.clientHeight || 360;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
      requestRender();
    };
    window.addEventListener('resize', onResize);

    const onContextLost = (e: Event) => {
      e.preventDefault();
      setWebglError(true);
    };
    renderer.domElement.addEventListener('webglcontextlost', onContextLost);

    requestRender();

    return () => {
      disposed = true;
      cancelAnimationFrame(frameId);
      clearTimeout(frameId);
      window.removeEventListener('resize', onResize);
      controls.removeEventListener('start', onControlStart);
      controls.removeEventListener('change', onControlChange);
      renderer.domElement.removeEventListener('webglcontextlost', onContextLost);
      controls.dispose();
      model.dispose();
      shadowPlaneGeo.dispose();
      shadowPlaneMat.dispose();
      shadowTex.dispose();
      envTex.dispose();
      renderer.dispose();
    };
  }, [laptop]);

  if (webglError) {
    return (
      <div className={`w-full ${heightClass} bg-[#111111] border border-zinc-800 rounded-2xl flex items-center justify-center p-6`}>
        <div className="text-center space-y-2">
          <div className="text-sm font-semibold text-white">{laptop.name}</div>
          <div className="text-xs text-[#A0A0A0]">
            {laptop.cpu} · {laptop.ramLabel} · {laptop.storageLabel} · {laptop.cameraLabel}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`relative w-full ${heightClass} bg-[#0c0c0f] border border-zinc-800 rounded-2xl overflow-hidden select-none`}>
      <div ref={containerRef} className="w-full h-full" />

      {/* Minimal Top-Left Hardware Spec Tag */}
      <div className="pointer-events-none absolute top-3.5 left-4 z-10 flex flex-col gap-0.5">
        <div className="text-xs font-medium text-[#A0A0A0]">{laptop.rarity} Chassis · Drag to Orbit</div>
        <div className="text-base font-bold text-white tracking-tight">{laptop.name}</div>
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center max-w-[94%]">
        <button
          type="button"
          onClick={() => setDockOpen((v) => !v)}
          className="px-3 py-1 bg-[#171717]/95 border border-zinc-700 text-[11px] font-medium text-zinc-300 hover:text-white rounded-t-lg transition-colors whitespace-nowrap"
        >
          {dockOpen ? 'Hide Controls' : 'Show Controls'}
        </button>

        {dockOpen && (
          <div className="bg-[#171717]/95 border border-zinc-800 rounded-xl px-4 py-2.5 flex flex-wrap items-center gap-4 shadow-xl">
            <div className="flex items-center gap-1.5">
              {(['hero', 'top', 'rear', 'side'] as const).map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setCameraPreset(preset)}
                  className={`px-2.5 py-1 text-xs font-medium rounded-lg transition-colors whitespace-nowrap ${
                    cameraPreset === preset
                      ? 'bg-[#FF2020] text-white'
                      : 'bg-zinc-900 text-zinc-300 hover:text-white'
                  }`}
                >
                  {preset === 'hero'
                    ? 'Hero'
                    : preset === 'top'
                      ? 'Deck'
                      : preset === 'rear'
                        ? 'Vents'
                        : 'Profile'}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2 border-l border-zinc-800 pl-3">
              <span className="text-xs text-[#A0A0A0] whitespace-nowrap">Lid</span>
              <input
                type="range"
                min={25}
                max={135}
                value={lidAngle}
                onChange={(e) => setLidAngle(Number(e.target.value))}
                className="w-24 accent-[#FF2020] cursor-pointer"
                aria-label="Laptop lid angle"
              />
              <span className="text-xs font-mono tabular-nums text-zinc-300 w-9 text-right">
                {lidAngle}°
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
