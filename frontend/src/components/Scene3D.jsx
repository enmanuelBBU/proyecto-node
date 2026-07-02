import { useEffect, useRef } from 'react';
import * as THREE from 'three';

export default function Scene3D({ onBlockClick }) {
  const containerRef = useRef(null);
  const labelCrafteosRef = useRef(null);
  const labelConstruccionesRef = useRef(null);
  const labelPerfilRef = useRef(null);
  const hintRef = useRef(null);
  const onBlockClickRef = useRef(onBlockClick);
  onBlockClickRef.current = onBlockClick;

  useEffect(() => {
    const container = containerRef.current;
    const hintText = hintRef.current;

    // ====================== THREE.JS SCENE ======================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0a0a0f);
    scene.fog = new THREE.Fog(0x0a0a0f, 8, 24);

    const camera = new THREE.PerspectiveCamera(48, window.innerWidth / window.innerHeight, 0.5, 40);
    camera.position.set(0, 4.2, 7.5);
    camera.lookAt(0, 1.0, 0);

    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    container.appendChild(renderer.domElement);

    // ====================== LIGHTING ======================
    scene.add(new THREE.AmbientLight(0x2a2a40, 1.6));
    const sun = new THREE.DirectionalLight(0xffeedd, 4.2);
    sun.position.set(6, 14, 5);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 0.5; sun.shadow.camera.far = 30;
    sun.shadow.camera.left = -10; sun.shadow.camera.right = 10;
    sun.shadow.camera.top = 10; sun.shadow.camera.bottom = -10;
    sun.shadow.bias = -0.0002;
    scene.add(sun);
    scene.add(new THREE.DirectionalLight(0x8899cc, 1.2, -3, 2, -2));

    const glowGreen = new THREE.PointLight(0x4ade80, 7, 5.5, 1.5); glowGreen.position.set(-2.2, 1.5, 0); scene.add(glowGreen);
    const glowBlue = new THREE.PointLight(0x60a5fa, 7, 5.5, 1.5); glowBlue.position.set(0, 1.5, 0); scene.add(glowBlue);
    const glowAmber = new THREE.PointLight(0xfbbf24, 7, 5.5, 1.5); glowAmber.position.set(2.2, 1.5, 0); scene.add(glowAmber);

    // ====================== TEXTURES ======================
    const texLoader = new THREE.TextureLoader();
    function loadTex(path) {
      const t = texLoader.load(path);
      t.magFilter = THREE.NearestFilter;
      t.minFilter = THREE.NearestMipmapNearestFilter;
      t.generateMipmaps = true;
      t.colorSpace = THREE.SRGBColorSpace;
      return t;
    }
    const texGrassTop = loadTex('/textures/block/grass_block_top.png');
    texGrassTop.wrapS = texGrassTop.wrapT = THREE.RepeatWrapping; texGrassTop.repeat.set(8, 8);
    const texGrassSide = loadTex('/textures/block/grass_block_side.png');
    texGrassSide.wrapS = texGrassSide.wrapT = THREE.RepeatWrapping; texGrassSide.repeat.set(8, 1);
    const texDirt = loadTex('/textures/block/dirt.png');
    const texCraftTop = loadTex('/textures/block/crafting_table_top.png');
    const texCraftSide = loadTex('/textures/block/crafting_table_side.png');
    const texStone = loadTex('/textures/block/stone.png');

    // ====================== GRASS PLATFORM ======================
    const platformGeo = new THREE.BoxGeometry(7, 0.25, 4.5);
    const platformMats = [
      new THREE.MeshStandardMaterial({ map: texGrassSide, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: texGrassSide, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: texGrassTop, roughness: 0.6, color: 0xaaddaa }),
      new THREE.MeshStandardMaterial({ roughness: 0.9, color: 0x5a3a1a }),
      new THREE.MeshStandardMaterial({ map: texGrassSide, roughness: 0.7 }),
      new THREE.MeshStandardMaterial({ map: texGrassSide, roughness: 0.7 }),
    ];
    const platform = new THREE.Mesh(platformGeo, platformMats);
    platform.position.set(0, -0.1, 0);
    platform.receiveShadow = true; platform.castShadow = true;
    scene.add(platform);

    // Ground plane
    const groundGeo = new THREE.PlaneGeometry(30, 30);
    const groundCanvas = document.createElement('canvas'); groundCanvas.width = 512; groundCanvas.height = 512;
    const gctx = groundCanvas.getContext('2d');
    gctx.fillStyle = '#1a2840'; gctx.fillRect(0, 0, 512, 512);
    for (let i = 0; i <= 512; i += 32) {
      gctx.fillStyle = 'rgba(255,255,255,0.015)';
      gctx.fillRect(i, 0, 1, 512); gctx.fillRect(0, i, 512, 1);
    }
    const groundTex = new THREE.CanvasTexture(groundCanvas);
    groundTex.wrapS = groundTex.wrapT = THREE.RepeatWrapping; groundTex.repeat.set(8, 8);
    groundTex.magFilter = THREE.NearestFilter;
    const ground = new THREE.Mesh(groundGeo, new THREE.MeshStandardMaterial({ map: groundTex, roughness: 0.9, color: 0x1a2a40 }));
    ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true;
    scene.add(ground);

    // ====================== HUB BLOCKS ======================
    const hoveredBlocks = [];
    const blockDataMap = new Map();
    function createBlock(x, y, z, topTex, sideTex, bottomTex, pointLight) {
      const mats = Array(6).fill(null).map((_, i) =>
        new THREE.MeshStandardMaterial({
          map: i === 2 ? topTex : i === 3 ? (bottomTex || sideTex) : sideTex,
          roughness: 0.55
        })
      );
      const geo = new THREE.BoxGeometry(1.2, 1.2, 1.0, 4, 4, 4);
      const mesh = new THREE.Mesh(geo, mats);
      mesh.position.set(x, y, z);
      mesh.castShadow = true; mesh.receiveShadow = true;
      mesh.userData = { baseY: y, pointLight };
      scene.add(mesh);
      hoveredBlocks.push(mesh);
      return mesh;
    }
    const blockCrafteos = createBlock(-2.2, 1.3, 0, texGrassTop, texGrassSide, texDirt, glowGreen);
    const blockConstrucciones = createBlock(0, 1.3, 0, texCraftTop, texCraftSide, texCraftSide, glowBlue);
    const blockPerfil = createBlock(2.2, 1.3, 0, texStone, texStone, texStone, glowAmber);

    blockDataMap.set(blockCrafteos, { id: 'crafteos', icon: '🪨', label: 'Crafteos', labelEl: labelCrafteosRef.current });
    blockDataMap.set(blockConstrucciones, { id: 'construcciones', icon: '🏗️', label: 'Construcciones', labelEl: labelConstruccionesRef.current });
    blockDataMap.set(blockPerfil, { id: 'perfil', icon: '👤', label: 'Perfil', labelEl: labelPerfilRef.current });

    // ====================== PARTICLES ======================
    const particlesGeo = new THREE.BufferGeometry();
    const pCount = 100;
    const pPos = new Float32Array(pCount * 3);
    const pCol = new Float32Array(pCount * 3);
    for (let i = 0; i < pCount; i++) {
      pPos[i * 3] = (Math.random() - 0.5) * 10;
      pPos[i * 3 + 1] = Math.random() * 5;
      pPos[i * 3 + 2] = (Math.random() - 0.5) * 6;
      const c = new THREE.Color().setHSL(0.36 + Math.random() * 0.14, 0.8, 0.5 + Math.random() * 0.4);
      pCol[i * 3] = c.r; pCol[i * 3 + 1] = c.g; pCol[i * 3 + 2] = c.b;
    }
    particlesGeo.setAttribute('position', new THREE.BufferAttribute(pPos, 3));
    particlesGeo.setAttribute('color', new THREE.BufferAttribute(pCol, 3));
    const partCanvas = document.createElement('canvas'); partCanvas.width = 6; partCanvas.height = 6;
    partCanvas.getContext('2d').fillRect(1, 1, 4, 4);
    const particles = new THREE.Points(particlesGeo, new THREE.PointsMaterial({
      size: 0.07, map: new THREE.CanvasTexture(partCanvas), vertexColors: true,
      blending: THREE.AdditiveBlending, depthWrite: false, transparent: true, opacity: 0.7,
    }));
    scene.add(particles);

    // ====================== RAYCASTER ======================
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    let hoveredBlock = null;

    function onMouseMove(e) {
      mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
      mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
    }
    function onClick(e) {
      if (e.target.closest('#login-overlay') || e.target.closest('#panel-overlay') || e.target.closest('#user-chip')) return;
      if (hoveredBlock && blockDataMap.has(hoveredBlock)) onBlockClickRef.current(blockDataMap.get(hoveredBlock).id);
    }
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('click', onClick);

    // ====================== LABELS ======================
    function updateLabels() {
      blockDataMap.forEach((data, block) => {
        const pos = block.position.clone(); pos.y += 0.85;
        pos.project(camera);
        const x = (pos.x * 0.5 + 0.5) * window.innerWidth;
        const y = (-pos.y * 0.5 + 0.5) * window.innerHeight;
        if (data.labelEl) {
          data.labelEl.style.left = x + 'px';
          data.labelEl.style.top = y + 'px';
          data.labelEl.style.opacity = pos.z < 1 ? '1' : '0';
        }
      });
    }

    function hl(b) { b.scale.set(1.1, 1.1, 1.1); b.userData.pointLight.intensity = 14; }
    function resetHL(b) { b.scale.set(1, 1, 1); b.userData.pointLight.intensity = 4.5; }

    // ====================== ANIMATION LOOP ======================
    const clock = new THREE.Clock();
    let rafId;
    function animate() {
      rafId = requestAnimationFrame(animate);
      const t = clock.getElapsedTime();
      [blockCrafteos, blockConstrucciones, blockPerfil].forEach((b, i) => {
        b.position.y = b.userData.baseY + Math.sin(t * 1.3 + i * 1.8) * 0.10;
        b.rotation.y += 0.0015;
      });
      const pa = particles.geometry.attributes.position.array;
      for (let i = 0; i < pCount; i++) {
        pa[i * 3 + 1] += 0.002;
        if (pa[i * 3 + 1] > 4) { pa[i * 3 + 1] = 0; pa[i * 3] = (Math.random() - 0.5) * 10; pa[i * 3 + 2] = (Math.random() - 0.5) * 6; }
      }
      particles.geometry.attributes.position.needsUpdate = true;
      glowGreen.intensity = 5 + Math.sin(t * 1.8) * 2;
      glowBlue.intensity = 5 + Math.sin(t * 1.8 + 1.5) * 2;
      glowAmber.intensity = 5 + Math.sin(t * 1.8 + 3) * 2;

      raycaster.setFromCamera(mouse, camera);
      const ints = raycaster.intersectObjects(hoveredBlocks);
      if (ints.length > 0) {
        const obj = ints[0].object;
        if (hoveredBlock !== obj) {
          if (hoveredBlock) resetHL(hoveredBlock);
          hoveredBlock = obj; hl(obj);
          if (hintText) hintText.style.opacity = '0';
          document.body.style.cursor = 'pointer';
        }
      } else if (hoveredBlock) {
        resetHL(hoveredBlock); hoveredBlock = null;
        if (hintText) hintText.style.opacity = '1';
        document.body.style.cursor = 'default';
      }
      updateLabels();
      renderer.render(scene, camera);
    }
    animate();

    // ====================== RESIZE ======================
    function onResize() {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    }
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
      window.removeEventListener('resize', onResize);
      document.body.style.cursor = 'default';
      renderer.dispose();
      if (renderer.domElement.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <>
      <div id="three-container" ref={containerRef}></div>
      <div id="label-crafteos" className="block-label" ref={labelCrafteosRef}>Crafteos</div>
      <div id="label-construcciones" className="block-label" ref={labelConstruccionesRef}>Construcciones</div>
      <div id="label-perfil" className="block-label" ref={labelPerfilRef}>Perfil</div>
      <div id="hint-text" ref={hintRef}>Click en un bloque para explorar</div>
    </>
  );
}
