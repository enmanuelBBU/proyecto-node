// ============================================
// CraftBuild — Minecraft UX (No JSON)
// ============================================
import * as THREE from 'three';

const API_BASE = '/api';

// ====================== SESSION ======================
let currentUser = null;
let cachedItems = [];

function saveSession(user) {
  currentUser = user;
  localStorage.setItem('craftbuild_user', JSON.stringify(user));
}
function clearSession() {
  currentUser = null;
  localStorage.removeItem('craftbuild_user');
}
function loadSession() {
  const raw = localStorage.getItem('craftbuild_user');
  if (raw) { try { currentUser = JSON.parse(raw); } catch (e) { currentUser = null; } }
  return currentUser;
}

// ====================== DOM REFS ======================
const container = document.getElementById('three-container');
const panelOverlay = document.getElementById('panel-overlay');
const panelTitle = document.getElementById('panel-title');
const panelBadge = document.getElementById('panel-badge');
const panelContent = document.getElementById('panel-content');
const labelCrafteos = document.getElementById('label-crafteos');
const labelConstrucciones = document.getElementById('label-construcciones');
const labelPerfil = document.getElementById('label-perfil');
const hintText = document.getElementById('hint-text');
const userChip = document.getElementById('user-chip');
const hudStatus = document.getElementById('hud-status');
const toast = document.getElementById('toast');
const loginOverlay = document.getElementById('login-overlay');
const loginUserList = document.getElementById('login-user-list');
const loginSectionExisting = document.getElementById('login-section-existing');
const loginSectionNew = document.getElementById('login-section-new');
const loginOptExisting = document.getElementById('login-opt-existing');
const loginOptNew = document.getElementById('login-opt-new');

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
const glowBlue  = new THREE.PointLight(0x60a5fa, 7, 5.5, 1.5); glowBlue.position.set(0, 1.5, 0); scene.add(glowBlue);
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
const texObsidian = loadTex('/textures/block/obsidian.png');
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

blockDataMap.set(blockCrafteos, { id: 'crafteos', icon: '🪨', label: 'Crafteos', labelEl: labelCrafteos });
blockDataMap.set(blockConstrucciones, { id: 'construcciones', icon: '🏗️', label: 'Construcciones', labelEl: labelConstrucciones });
blockDataMap.set(blockPerfil, { id: 'perfil', icon: '👤', label: 'Perfil', labelEl: labelPerfil });

// ====================== PARTICLES ======================
const particlesGeo = new THREE.BufferGeometry();
const pCount = 100;
const pPos = new Float32Array(pCount * 3);
const pCol = new Float32Array(pCount * 3);
for (let i = 0; i < pCount; i++) {
  pPos[i*3] = (Math.random() - 0.5) * 10;
  pPos[i*3+1] = Math.random() * 5;
  pPos[i*3+2] = (Math.random() - 0.5) * 6;
  const c = new THREE.Color().setHSL(0.36 + Math.random() * 0.14, 0.8, 0.5 + Math.random() * 0.4);
  pCol[i*3] = c.r; pCol[i*3+1] = c.g; pCol[i*3+2] = c.b;
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
window.addEventListener('mousemove', (e) => { mouse.x = (e.clientX / innerWidth) * 2 - 1; mouse.y = -(e.clientY / innerHeight) * 2 + 1; });
window.addEventListener('click', (e) => {
  if (e.target.closest('#login-overlay') || e.target.closest('#panel-overlay') || e.target.closest('#user-chip')) return;
  if (panelOverlay.classList.contains('hidden') && hoveredBlock && blockDataMap.has(hoveredBlock)) openPanel(blockDataMap.get(hoveredBlock));
});

// ====================== LABELS ======================
function updateLabels() {
  blockDataMap.forEach((data, block) => {
    const pos = block.position.clone(); pos.y += 0.85;
    pos.project(camera);
    const x = (pos.x * 0.5 + 0.5) * innerWidth;
    const y = (-pos.y * 0.5 + 0.5) * innerHeight;
    if (data.labelEl) { data.labelEl.style.left = x + 'px'; data.labelEl.style.top = y + 'px'; data.labelEl.style.opacity = pos.z < 1 ? '1' : '0'; }
  });
}

// ====================== ANIMATION LOOP ======================
const clock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const t = clock.getElapsedTime();
  [blockCrafteos, blockConstrucciones, blockPerfil].forEach((b, i) => {
    b.position.y = b.userData.baseY + Math.sin(t * 1.3 + i * 1.8) * 0.10;
    b.rotation.y += 0.0015;
  });
  const pa = particles.geometry.attributes.position.array;
  for (let i = 0; i < pCount; i++) { pa[i*3+1] += 0.002; if (pa[i*3+1] > 4) { pa[i*3+1] = 0; pa[i*3] = (Math.random()-0.5)*10; pa[i*3+2] = (Math.random()-0.5)*6; } }
  particles.geometry.attributes.position.needsUpdate = true;
  glowGreen.intensity = 5 + Math.sin(t * 1.8) * 2;
  glowBlue.intensity = 5 + Math.sin(t * 1.8 + 1.5) * 2;
  glowAmber.intensity = 5 + Math.sin(t * 1.8 + 3) * 2;

  raycaster.setFromCamera(mouse, camera);
  const ints = raycaster.intersectObjects(hoveredBlocks);
  if (ints.length > 0) {
    const obj = ints[0].object;
    if (hoveredBlock !== obj) { if (hoveredBlock) resetHL(hoveredBlock); hoveredBlock = obj; hl(obj); hintText.style.opacity = '0'; document.body.style.cursor = 'pointer'; }
  } else { if (hoveredBlock) { resetHL(hoveredBlock); hoveredBlock = null; hintText.style.opacity = '1'; document.body.style.cursor = 'default'; } }
  updateLabels();
  renderer.render(scene, camera);
}
function hl(b) { b.scale.set(1.1, 1.1, 1.1); b.userData.pointLight.intensity = 14; }
function resetHL(b) { b.scale.set(1, 1, 1); b.userData.pointLight.intensity = 4.5; }

// ====================== PANEL ======================
function openPanel(data) {
  panelTitle.textContent = data.icon + ' ' + data.label;
  panelOverlay.classList.remove('hidden');
  hintText.style.opacity = '0';
  renderSection(data.id);
}
function closePanel() { panelOverlay.classList.add('hidden'); hintText.style.opacity = currentUser ? '1' : '0'; }
document.getElementById('panel-close').addEventListener('click', closePanel);
panelOverlay.addEventListener('click', (e) => { if (e.target === panelOverlay) closePanel(); });
document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && !panelOverlay.classList.contains('hidden')) closePanel(); });

// ====================== TOAST ======================
function showToast(msg, type) {
  toast.textContent = msg; toast.className = 'toast ' + type; toast.classList.remove('hidden');
  clearTimeout(toast._timeout); toast._timeout = setTimeout(() => toast.classList.add('hidden'), 3000);
}

// ====================== API HELPERS ======================
async function api(method, path, body) {
  const opts = { method, headers: { 'Content-Type': 'application/json' } };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(API_BASE + path, opts);
  const data = await res.json();
  return { status: res.status, ok: res.ok, data };
}

function $v(id) { const el = document.getElementById(id); return el ? el.value.trim() : ''; }
function $sel(id) { const el = document.getElementById(id); return el ? el.value : ''; }

async function loadItems() {
  try { const { ok, data } = await api('GET', '/items'); if (ok && Array.isArray(data)) cachedItems = data; } catch (e) { cachedItems = []; }
}

function itemDropdown(id, selectedVal, placeholder) {
  let html = '<select id="' + id + '" class="mc-input"><option value="">' + (placeholder || 'Seleccionar...') + '</option>';
  cachedItems.forEach(item => {
    html += '<option value="' + item.id + '"' + (item.id === selectedVal ? ' selected' : '') + '>' + (item.nombre || item.id) + '</option>';
  });
  html += '</select>';
  return html;
}

function itemsDropdownMulti(id, selectedVal, placeholder, filterFn) {
  const list = filterFn ? cachedItems.filter(filterFn) : cachedItems;
  let html = '<select id="' + id + '" class="mc-input"><option value="">' + (placeholder || 'Seleccionar...') + '</option>';
  list.forEach(item => {
    html += '<option value="' + item.id + '"' + (item.id === selectedVal ? ' selected' : '') + '>' + (item.nombre || item.id) + '</option>';
  });
  html += '</select>';
  return html;
}

function formatOutput(obj) {
  if (!obj) return '<span style="color:var(--mc-text-muted)">Sin datos</span>';
  if (typeof obj === 'string') return obj;
  let html = '<div style="text-align:left">';
  if (obj.mensaje) html += '<div style="color:var(--mc-green);margin-bottom:4px">' + obj.mensaje + '</div>';
  if (obj.id) html += '<div style="color:var(--mc-text-muted);font-size:0.55rem">ID: ' + obj.id + '</div>';
  if (obj.nombre || obj.item) html += '<div style="color:#FFF;font-size:0.7rem">' + (obj.nombre || obj.item) + '</div>';
  if (obj.es_materia_prima !== undefined) html += '<div>Tipo: ' + (obj.es_materia_prima ? '<span class="tag prima">PRIMA</span>' : '<span class="tag elaborado">ELABORADO</span>') + '</div>';
  if (obj.stock !== undefined) html += '<div>Stock: ' + obj.stock + '</div>';
  if (obj.email) html += '<div style="color:var(--mc-text-muted);font-size:0.55rem">Email: ' + obj.email + '</div>';
  if (obj.estado) html += '<div>Estado: ' + obj.estado + '</div>';
  if (obj.proyectos_eliminados !== undefined) html += '<div>Proyectos eliminados: ' + obj.proyectos_eliminados + '</div>';
  if (obj.item_id) html += '<div style="color:var(--mc-text-muted);font-size:0.55rem">Item ID: ' + obj.item_id + '</div>';
  if (obj.cantidad_total_proyecto) html += '<div>Cantidad en proyecto: ' + obj.cantidad_total_proyecto + '</div>';
  html += '</div>';
  return html;
}

// ====================== RENDER SECTIONS ======================
function renderSection(section) {
  switch (section) {
    case 'crafteos': renderCrafteos(); break;
    case 'construcciones': renderConstrucciones(); break;
    case 'perfil': renderPerfil(); break;
  }
}

// === CRAFTEOS ===
function renderCrafteos() {
  panelContent.innerHTML = `
    <div class="mc-card">
      <div class="mc-label">Inventario</div>
      <button class="mc-btn green wide" onclick="window._listItems()">Abrir Inventario</button>
      <div id="r-items-list" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Nuevo Crafteo</div>
      <div class="mc-fld"><label>Nombre del Item</label><input id="f-item-nombre" class="mc-input" placeholder="Ej: Pico de Piedra"></div>
      <div class="mc-fld-row" style="margin-bottom:8px">
        <div class="mc-fld"><label>Tipo</label><select id="f-item-prima" class="mc-input"><option value="false">Elaborado</option><option value="true">Materia Prima</option></select></div>
        <div class="mc-fld"><label>Stock Inicial</label><input id="f-item-stock" class="mc-input" type="number" value="0" min="0"></div>
      </div>
      <div class="mc-fld"><label>Ingredientes</label></div>
      <div id="ingredientes-container" style="margin-bottom:6px"></div>
      <button class="mc-btn sm" onclick="window._addIngrediente()" style="margin-bottom:10px">+ Agregar Ingrediente</button>
      <div class="mc-fld"><label>Receta (Grid 3x3)</label></div>
      <div class="craft-grid" id="craft-grid">
        ${Array.from({length:9}, (_,i) => '<div class="craft-slot"><select id="slot-'+i+'" class="mc-input" style="width:100%;height:100%;border:none;background:transparent;font-size:0.4rem"><option value="">-</option></select></div>').join('')}
      </div>
      <button class="mc-btn green wide" onclick="window._createItem()">Craftear</button>
      <div id="r-item-create" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Calculadora de Materiales</div>
      <div class="mc-fld"><label>Seleccionar Item</label>${itemDropdown('f-mat-item', '', 'Elegir un crafteo...')}</div>
      <button class="mc-btn blue wide" onclick="window._getMateriales()">Calcular Materiales</button>
      <div id="r-materiales" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Editar Crafteo</div>
      <div class="mc-fld"><label>Seleccionar Item</label>${itemDropdown('f-upd-item-sel', '', 'Elegir...')}</div>
      <div class="mc-fld"><label>Tipo</label><select id="f-upd-prima" class="mc-input"><option value="">Sin cambio</option><option value="true">Materia Prima</option><option value="false">Elaborado</option></select></div>
      <div class="mc-fld"><label>Nuevo Nombre</label><input id="f-upd-nombre" class="mc-input" placeholder="Dejar vacio para no cambiar"></div>
      <div class="mc-fld"><label>Stock</label><input id="f-upd-stock" class="mc-input" type="number" value="" min="0" placeholder="Dejar vacio para no cambiar"></div>
      <div class="mc-fld"><label>Ingredientes</label></div>
      <div id="upd-ingredientes-container" style="margin-bottom:6px"></div>
      <button class="mc-btn sm" onclick="window._addUpdIngrediente()" style="margin-bottom:10px">+ Agregar Ingrediente</button>
      <div class="mc-fld"><label>Receta (Grid 3x3)</label></div>
      <div class="craft-grid" id="upd-craft-grid">
        ${Array.from({length:9}, (_,i) => '<div class="craft-slot"><select id="upd-slot-'+i+'" class="mc-input" style="width:100%;height:100%;border:none;background:transparent;font-size:0.4rem"><option value="">-</option></select></div>').join('')}
      </div>
      <button class="mc-btn gold wide" onclick="window._updateItem()">Actualizar</button>
      <div id="r-update-item" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Ajustar Stock</div>
      <div class="mc-fld"><label>Seleccionar Item</label>${itemDropdown('f-stock-sel', '', 'Elegir...')}</div>
      <div class="mc-fld"><label>Nuevo Stock</label><input id="f-stock-val" class="mc-input" type="number" value="64" min="0"></div>
      <button class="mc-btn gold wide" onclick="window._patchStock()">Ajustar Stock</button>
      <div id="r-stock" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Eliminar Crafteo</div>
      <div class="mc-fld"><label>Seleccionar Item</label>${itemDropdown('f-del-item-sel', '', 'Elegir...')}</div>
      <button class="mc-btn red wide" onclick="window._deleteItem()">Eliminar Permanentemente</button>
      <div id="r-delete-item" class="mc-result"></div>
    </div>
  `;
  // Populate dropdowns + rebuild craft grid selects
  setTimeout(() => {
    const gridSelects = document.querySelectorAll('#craft-grid select');
    gridSelects.forEach(s => { cachedItems.forEach(item => { s.innerHTML += '<option value="' + item.id + '">' + (item.nombre || item.id) + '</option>'; }); });
    const updGridSelects = document.querySelectorAll('#upd-craft-grid select');
    updGridSelects.forEach(s => { cachedItems.forEach(item => { s.innerHTML += '<option value="' + item.id + '">' + (item.nombre || item.id) + '</option>'; }); });
    window._addIngrediente();
  }, 100);
}

let ingredienteCount = 0;
let updIngredienteCount = 0;
window._addIngrediente = () => {
  const c = document.getElementById('ingredientes-container');
  const idx = ingredienteCount++;
  const div = document.createElement('div');
  div.className = 'mc-fld-row'; div.style.marginBottom = '4px'; div.id = 'ing-row-' + idx;
  div.innerHTML = '<div class="mc-fld" style="flex:1"><select id="ing-item-' + idx + '" class="mc-input"><option value="">Item...</option>' + cachedItems.map(item => '<option value="' + item.id + '">' + (item.nombre || item.id) + '</option>').join('') + '</select></div><div class="mc-fld" style="max-width:80px"><input id="ing-cant-' + idx + '" class="mc-input" type="number" value="1" min="1"></div><button class="mc-btn red sm" onclick="document.getElementById(\'ing-row-' + idx + '\').remove()" style="padding:6px 8px;font-size:0.5rem">X</button>';
  c.appendChild(div);
};

window._addUpdIngrediente = () => {
  const c = document.getElementById('upd-ingredientes-container');
  if (!c) return;
  const idx = updIngredienteCount++;
  const div = document.createElement('div');
  div.className = 'mc-fld-row'; div.style.marginBottom = '4px'; div.id = 'upd-ing-row-' + idx;
  div.innerHTML = '<div class="mc-fld" style="flex:1"><select id="upd-ing-item-' + idx + '" class="mc-input"><option value="">Item...</option>' + cachedItems.map(item => '<option value="' + item.id + '">' + (item.nombre || item.id) + '</option>').join('') + '</select></div><div class="mc-fld" style="max-width:80px"><input id="upd-ing-cant-' + idx + '" class="mc-input" type="number" value="1" min="1"></div><button class="mc-btn red sm" onclick="document.getElementById(\'upd-ing-row-' + idx + '\').remove()" style="padding:6px 8px;font-size:0.5rem">X</button>';
  c.appendChild(div);
};

// === CONSTRUCCIONES ===
function renderConstrucciones() {
  panelContent.innerHTML = `
    <div class="mc-card">
      <div class="mc-label">Mis Construcciones</div>
      <button class="mc-btn green wide" id="btn-toggle-proyectos" onclick="window._toggleProyectos()">Ver Proyectos</button>
      <div id="r-proyectos-list"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Nueva Construccion</div>
      <div class="mc-fld"><label>Nombre del Proyecto</label><input id="f-proy-nombre" class="mc-input" placeholder="Ej: Torre de Piedra"></div>
      <div class="mc-fld-row">
        <div class="mc-fld"><label>Estado</label><select id="f-proy-estado" class="mc-input"><option value="pendiente">Pendiente</option><option value="en progreso">En Progreso</option><option value="completado">Completado</option></select></div>
      </div>
      <div class="mc-fld"><label>Materiales Necesarios</label></div>
      <div id="objetivos-container" style="margin-bottom:6px"></div>
      <button class="mc-btn sm" onclick="window._addObjetivo()" style="margin-bottom:10px">+ Agregar Material</button>
      <button class="mc-btn green wide" onclick="window._createProyecto()">Iniciar Construccion</button>
      <div id="r-proyecto-create" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Gestionar Proyecto</div>
      <div class="mc-fld"><label>Seleccionar Proyecto</label><select id="f-gest-proy-sel" class="mc-input"><option value="">Elegir...</option></select></div>
      <div class="mc-fld-row">
        <div class="mc-fld" style="flex:1"><label>Nuevo Nombre</label><input id="f-patch-nombre" class="mc-input" placeholder="Nuevo nombre..."></div>
        <div class="mc-fld" style="flex:1"><label>Nuevo Estado</label><select id="f-patch-estado" class="mc-input"><option value="">Sin cambio</option><option value="pendiente">Pendiente</option><option value="en_progreso">En Progreso</option><option value="completado">Completado</option></select></div>
      </div>
      <div class="mc-fld-row">
        <button class="mc-btn gold sm" style="flex:1" onclick="window._patchNombre()">Renombrar</button>
        <button class="mc-btn gold sm" style="flex:1" onclick="window._patchEstado()">Cambiar Estado</button>
        <button class="mc-btn red sm" style="flex:1" onclick="window._deleteProyectoFromGest()">Eliminar</button>
      </div>
      <div id="r-update-proyecto" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Materiales del Proyecto</div>
      <div class="mc-fld"><label>Seleccionar Proyecto</label><select id="f-proy-items-sel" class="mc-input"><option value="">Elegir...</option></select></div>
      <button class="mc-btn blue wide" onclick="window._getProyectoItems()">Ver Materiales</button>
      <div id="r-proyecto-items" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Agregar Material a Proyecto</div>
      <div class="mc-fld"><label>Seleccionar Proyecto</label><select id="f-asignar-proy-sel" class="mc-input"><option value="">Elegir...</option></select></div>
      <div class="mc-fld"><label>Nombre del Item</label><input id="f-asignar-nombre" class="mc-input" placeholder="Ej: Espada de Hierro"></div>
      <div class="mc-fld-row">
        <div class="mc-fld"><label>Cantidad</label><input id="f-asignar-cant" class="mc-input" type="number" value="1" min="1"></div>
        <div class="mc-fld"><label>Tipo</label><select id="f-asignar-prima" class="mc-input"><option value="false">Elaborado</option><option value="true">Materia Prima</option></select></div>
      </div>
      <button class="mc-btn green wide" onclick="window._crearAsignarItem()">Agregar Material</button>
      <div id="r-asignar" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Quitar Material de Proyecto</div>
      <div class="mc-fld"><label>Seleccionar Proyecto</label><select id="f-remover-proy-sel" class="mc-input"><option value="">Elegir...</option></select></div>
      <div class="mc-fld"><label>ID del Item a Quitar</label><input id="f-remover-item-id" class="mc-input" placeholder="ej: espada_de_hierro"></div>
      <button class="mc-btn red wide" onclick="window._removerItemProyecto()">Quitar Material</button>
      <div id="r-remover" class="mc-result"></div>
    </div>
  `;
  setTimeout(async () => {
    try {
      const { ok, data } = await api('GET', '/proyectos');
      if (ok && Array.isArray(data)) {
        const opts = data.map(p => '<option value="' + p.id + '">' + (p.nombre_proyecto || p.id) + '</option>').join('');
        ['f-gest-proy-sel', 'f-proy-items-sel', 'f-asignar-proy-sel', 'f-remover-proy-sel'].forEach(id => {
          const el = document.getElementById(id); if (el) el.innerHTML = '<option value="">Elegir...</option>' + opts;
        });
      }
    } catch (e) {}
    window._addObjetivo();
  }, 100);
}

// Accordion toggle
window.toggleAccordion = (id) => {
  const target = document.getElementById(id);
  if (!target) return;
  const parent = target.closest('.accordion-item');
  const isOpen = parent.classList.contains('open');
  document.querySelectorAll('.accordion-item.open').forEach(el => {
    el.classList.remove('open');
    el.querySelector('.accordion-body').classList.remove('active');
  });
  if (!isOpen) {
    parent.classList.add('open');
    target.classList.add('active');
  }
};

window._verMaterialesProyecto = async (proyectoId) => {
  try {
    const { ok, data } = await api('GET', '/proyectos/' + proyectoId + '/items');
    const container = document.getElementById('r-items-' + proyectoId);
    if (!container) return;
    if (ok && Array.isArray(data)) {
      if (data.length === 0) {
        container.innerHTML = '<div style="padding:6px;font-size:0.55rem;color:var(--mc-text-muted)">Sin materiales asignados</div>';
        return;
      }
      container.innerHTML = data.map(item =>
        '<div class="item-row" style="margin:2px 0;padding:4px 8px">' +
        '<div class="item-icon">📦</div>' +
        '<div class="item-detail"><div class="item-name">' + (item.nombre || item.item_id || '?') + '</div>' +
        '<div class="item-meta">Cant: ' + (item.cantidad || '-') + (item.error ? ' <span class="tag warn">NO ENCONTRADO</span>' : '') +
        '</div></div></div>'
      ).join('');
    } else {
      container.innerHTML = '<div style="padding:6px;font-size:0.55rem;color:var(--mc-red)">Error al cargar</div>';
    }
  } catch (e) { console.error(e); }
};

let objetivoCount = 0;
window._addObjetivo = () => {
  const c = document.getElementById('objetivos-container');
  const idx = objetivoCount++;
  const div = document.createElement('div');
  div.className = 'mc-fld-row'; div.style.marginBottom = '4px'; div.id = 'obj-row-' + idx;
  div.innerHTML = '<div class="mc-fld" style="flex:1"><select id="obj-item-' + idx + '" class="mc-input"><option value="">Item...</option>' + cachedItems.map(item => '<option value="' + item.id + '">' + (item.nombre || item.id) + '</option>').join('') + '</select></div><div class="mc-fld" style="max-width:80px"><input id="obj-cant-' + idx + '" class="mc-input" type="number" value="1" min="1"></div><button class="mc-btn red sm" onclick="document.getElementById(\'obj-row-' + idx + '\').remove()" style="padding:6px 8px;font-size:0.5rem">X</button>';
  c.appendChild(div);
};

// === PERFIL ===
async function renderPerfil() {
  // Obtener datos actualizados del servidor
  if (currentUser) {
    try {
      const { ok, data } = await api('GET', '/usuarios/' + currentUser.id);
      if (ok && data) {
        currentUser.nombre = data.nombre;
        currentUser.email = data.email;
        currentUser.rol = data.rol;
        currentUser.fecha_registro = data.fecha_registro;
        saveSession(currentUser);
        updateUserChip();
      }
    } catch (e) {
      console.error('Error al obtener datos del perfil:', e);
    }
  }
  const u = currentUser;
  const isAdmin = u && u.rol === 'admin';
  panelContent.innerHTML = `
    <div class="mc-card">
      <div class="mc-label">Mi Perfil</div>
      <div style="display:flex;align-items:center;gap:14px;padding:8px 0">
        <div style="font-size:2.4rem">👤</div>
        <div>
          <div style="font-size:0.85rem;color:#FFF">${u ? u.nombre : 'Invitado'}</div>
          <div style="font-size:0.55rem;color:var(--mc-text-muted);margin-top:4px">ID: ${u ? u.id : '-'}</div>
          <div style="font-size:0.55rem;color:var(--mc-text-muted)">Email: ${u ? u.email : '-'}</div>
          ${isAdmin ? '<div style="font-size:0.55rem;color:var(--mc-gold)">Rol: ADMIN</div>' : ''}
        </div>
      </div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Cambiar Nombre</div>
      <div class="mc-fld"><label>Nuevo Nombre</label><input id="f-perfil-nombre" class="mc-input" placeholder="${u ? u.nombre : ''}"></div>
      <button class="mc-btn gold wide" onclick="window._patchUsuarioNombre()">Actualizar Nombre</button>
      <div id="r-perfil-patch" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Cambiar Email</div>
      <div class="mc-fld"><label>Nuevo Email</label><input id="f-perfil-email" class="mc-input" placeholder="${u ? u.email : ''}"></div>
      <button class="mc-btn gold wide" onclick="window._patchUsuarioEmail()">Actualizar Email</button>
      <div id="r-perfil-email" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Cambiar Contrasena</div>
      <div class="mc-fld"><label>Contrasena Actual</label><input id="f-perfil-pass-actual" class="mc-input" type="password" placeholder="******"></div>
      <div class="mc-fld"><label>Nueva Contrasena</label><input id="f-perfil-pass-nueva" class="mc-input" type="password" placeholder="Min. 6 caracteres"></div>
      <button class="mc-btn gold wide" onclick="window._patchUsuarioPassword()">Actualizar Contrasena</button>
      <div id="r-perfil-password" class="mc-result"></div>
    </div>

    <div class="mc-card">
      <div class="mc-label">Reemplazar Perfil Completo</div>
      <div class="mc-fld"><label>Nombre</label><input id="f-perfil-put-nombre" class="mc-input" placeholder="Nuevo nombre"></div>
      <div class="mc-fld"><label>Email</label><input id="f-perfil-put-email" class="mc-input" placeholder="nuevo@email.com"></div>
      <div class="mc-fld"><label>Fecha de Registro</label><input id="f-perfil-put-fecha" class="mc-input" type="datetime-local"></div>
      <button class="mc-btn blue wide" onclick="window._replaceUsuario()">Reemplazar Todo</button>
      <div id="r-perfil-put" class="mc-result"></div>
    </div>

    <div class="mc-card" style="border-color:rgba(179,49,44,0.5)">
      <div class="mc-label" style="color:var(--mc-red)">Zona Peligrosa</div>
      <button class="mc-btn red wide" onclick="window._deleteUsuario()">Eliminar Mi Cuenta</button>
      <div id="r-perfil-delete" class="mc-result"></div>
    </div>

    ${isAdmin ? `
    <div class="mc-card" style="border-color:var(--mc-gold)">
      <div class="mc-label" style="color:var(--mc-gold)">Panel de Admin</div>
      <div id="r-admin-user-list"></div>
      <button class="mc-btn gold wide" onclick="window._loadAdminUsers()">Cargar Usuarios</button>
    </div>
    ` : ''}

    <button class="mc-btn red wide" style="margin-top:12px" onclick="window._logout()">Cerrar Sesion</button>
  `;
}

// ====================== API: ITEMS ======================
window._listItems = async () => {
  try {
    await loadItems();
    const data = cachedItems;
    panelBadge.textContent = data.length;
    if (data.length === 0) {
      document.getElementById('r-items-list').innerHTML = '<div class="mc-result visible"><div class="empty-state">No hay items. Crea uno!</div></div>';
      return;
    }
    const html = data.map(item =>
      '<div class="item-row"><div class="item-icon">' + (item.es_materia_prima ? '🪨' : '🔧') + '</div>' +
      '<div class="item-detail"><div class="item-name">' + (item.nombre || '?') + '</div>' +
      '<div class="item-meta">' + item.id +
      (item.es_materia_prima ? ' <span class="tag prima">PRIMA</span>' : ' <span class="tag elaborado">ELABORADO</span>') +
      (item.stock !== undefined ? ' | Stock: ' + item.stock : '') +
      '</div></div></div>'
    ).join('');
    document.getElementById('r-items-list').innerHTML = '<div class="mc-result visible success">' + html + '</div>';
  } catch (e) { document.getElementById('r-items-list').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._createItem = async () => {
  try {
    const nombre = $v('f-item-nombre');
    if (!nombre) return showToast('El nombre es obligatorio', 'error');
    const slots = [];
    for (let i = 0; i < 9; i++) { const v = $sel('slot-'+i); slots.push(v || null); }
    const hasRecipe = slots.some(s => s !== null);
    // Build ingredientes from dynamic list
    const ingredientes = [];
    for (let i = 0; i < ingredienteCount; i++) {
      const itemId = $sel('ing-item-' + i);
      const cant = parseInt(document.getElementById('ing-cant-' + i)?.value) || 0;
      if (itemId && cant > 0) ingredientes.push({ item_id: itemId, cantidad: cant });
    }
    const body = {
      nombre,
      es_materia_prima: $sel('f-item-prima') === 'true',
      stock: parseInt(document.getElementById('f-item-stock').value) || 0,
      ingredientes_para_calculo: ingredientes,
    };
    if (hasRecipe) body.receta_matriz = slots;
    const { status, ok, data } = await api('POST', '/items', body);
    if (ok) {
      document.getElementById('r-item-create').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Crafteo creado!', 'success');
      await loadItems();
    } else {
      document.getElementById('r-item-create').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-item-create').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._getMateriales = async () => {
  const id = $sel('f-mat-item');
  if (!id) return showToast('Selecciona un item', 'error');
  try {
    const { ok, data } = await api('GET', '/items/' + id + '/materiales');
    if (ok) {
      let html = '<div class="mc-result visible success">';
      html += '<div style="font-size:0.7rem;color:#FFF;margin-bottom:6px">Materiales para: ' + (data.item || id) + '</div>';
      if (data.es_materia_prima) { html += '<div class="tag prima">ES MATERIA PRIMA - No requiere materiales</div>'; }
      else if (data.materiales) {
        if (Array.isArray(data.materiales)) {
          data.materiales.forEach(m => { html += '<div class="item-row"><div class="item-icon">📦</div><div class="item-detail"><div class="item-name">' + (m.item_id || '?') + '</div><div class="item-meta">Cantidad: ' + (m.cantidad || '?') + '</div></div></div>'; });
        } else {
          for (const [k, v] of Object.entries(data.materiales)) { html += '<div class="item-row"><div class="item-icon">📦</div><div class="item-detail"><div class="item-name">' + k + '</div><div class="item-meta">Cantidad: ' + v + '</div></div></div>'; }
        }
      }
      if (data.receta_matriz) {
        html += '<div style="margin-top:8px;font-size:0.55rem;color:var(--mc-text-muted)">Receta:</div>';
        html += '<div class="craft-grid" style="margin-top:4px">';
        data.receta_matriz.forEach(s => { html += '<div class="craft-slot" style="width:36px;height:36px;font-size:0.4rem">' + (s || '') + '</div>'; });
        html += '</div>';
      }
      html += '</div>';
      document.getElementById('r-materiales').innerHTML = html;
    } else {
      document.getElementById('r-materiales').innerHTML = '<div class="mc-result visible error">Item no encontrado</div>';
    }
  } catch (e) { document.getElementById('r-materiales').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._updateItem = async () => {
  const id = $sel('f-upd-item-sel');
  if (!id) return showToast('Selecciona un item', 'error');
  try {
    const body = {};
    const tipo = $sel('f-upd-prima');
    if (tipo) body.es_materia_prima = tipo === 'true';
    const nombre = $v('f-upd-nombre');
    if (nombre) body.nombre = nombre;
    const stockVal = document.getElementById('f-upd-stock')?.value;
    if (stockVal !== '') {
      const parsed = parseInt(stockVal);
      if (!isNaN(parsed) && parsed >= 0) body.stock = parsed;
    }
    // Build ingredientes from update dynamic list
    const ingredientes = [];
    for (let i = 0; i < updIngredienteCount; i++) {
      const itemId = document.getElementById('upd-ing-item-' + i)?.value;
      const cant = parseInt(document.getElementById('upd-ing-cant-' + i)?.value) || 0;
      if (itemId && cant > 0) ingredientes.push({ item_id: itemId, cantidad: cant });
    }
    if (ingredientes.length > 0) body.ingredientes_para_calculo = ingredientes;
    // Build recipe grid
    const slots = [];
    for (let i = 0; i < 9; i++) {
      const v = document.getElementById('upd-slot-' + i)?.value;
      slots.push(v || null);
    }
    const hasRecipe = slots.some(s => s !== null);
    if (hasRecipe) body.receta_matriz = slots;
    if (Object.keys(body).length === 0) return showToast('Selecciona al menos un cambio', 'error');
    const { ok, data } = await api('PUT', '/items/' + id, body);
    if (ok) {
      document.getElementById('r-update-item').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Crafteo actualizado!', 'success');
      await loadItems();
    } else {
      document.getElementById('r-update-item').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-update-item').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._patchStock = async () => {
  const id = $sel('f-stock-sel');
  const stock = parseInt(document.getElementById('f-stock-val').value);
  if (!id) return showToast('Selecciona un item', 'error');
  try {
    const { ok, data } = await api('PATCH', '/items/' + id + '/stock', { stock });
    if (ok) {
      document.getElementById('r-stock').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Stock ajustado!', 'success');
    } else {
      document.getElementById('r-stock').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-stock').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._deleteItem = async () => {
  const id = $sel('f-del-item-sel');
  if (!id) return showToast('Selecciona un item', 'error');
  if (!confirm('Eliminar este crafteo permanentemente?')) return;
  try {
    const { ok, data } = await api('DELETE', '/items/' + id);
    if (ok) {
      document.getElementById('r-delete-item').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Crafteo eliminado!', 'success');
      await loadItems();
    } else {
      document.getElementById('r-delete-item').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-delete-item').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

// ====================== API: PROYECTOS ======================
window._listProyectos = async () => {
  try {
    const { ok, data } = await api('GET', '/proyectos');
    if (ok && Array.isArray(data)) {
      panelBadge.textContent = data.length;
      const ec = { 'pendiente': 'pendiente', 'en progreso': 'en-progreso', 'en_progreso': 'en-progreso', 'completado': 'completado' };
      if (data.length === 0) {
        document.getElementById('r-proyectos-list').innerHTML = '<div class="empty-state">No hay proyectos. Crea uno!</div>';
        return;
      }
      const html = data.map(p =>
        '<div class="item-row" style="flex-wrap:wrap">' +
        '<div class="item-icon">🏗️</div>' +
        '<div class="item-detail" style="flex:1;min-width:120px">' +
        '<div class="item-name">' + (p.nombre_proyecto || '?') + '</div>' +
        '<div class="item-meta">' + p.id + ' | ' + (p.usuario_id || '-') +
        ' <span class="estado-tag ' + (ec[p.estado] || '') + '">' + (p.estado || '-') + '</span>' +
        '</div></div>' +
        '<div style="display:flex;gap:4px;width:100%;margin-top:4px">' +
        '<button class="mc-btn blue sm" style="flex:1" onclick="window._verMaterialesProyecto(\'' + p.id + '\')">Materiales</button>' +
        '<button class="mc-btn red sm" style="flex:1" onclick="window._deleteProyecto(\'' + p.id + '\')">Eliminar</button>' +
        '</div>' +
        '<div id="r-items-' + p.id + '" style="width:100%;margin-top:4px"></div>' +
        '</div>'
      ).join('');
      document.getElementById('r-proyectos-list').innerHTML = '<div style="margin-bottom:6px;font-size:0.55rem;color:var(--mc-text-muted)">' + data.length + ' proyecto(s)</div>' + html;
    } else { document.getElementById('r-proyectos-list').innerHTML = '<div class="mc-result visible error">Error al cargar</div>'; }
  } catch (e) { document.getElementById('r-proyectos-list').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._toggleProyectos = async () => {
  const btn = document.getElementById('btn-toggle-proyectos');
  const container = document.getElementById('r-proyectos-list');
  if (!btn || !container) return;
  if (btn.textContent.trim() === 'Ocultar Proyectos') {
    container.innerHTML = '';
    btn.textContent = 'Ver Proyectos';
    return;
  }
  await window._listProyectos();
  btn.textContent = 'Ocultar Proyectos';
};

window._createProyecto = async () => {
  try {
    const nombre = $v('f-proy-nombre');
    if (!nombre) return showToast('El nombre es obligatorio', 'error');
    if (!currentUser) return showToast('Debes iniciar sesion', 'error');
    const objetivos = [];
    for (let i = 0; i < objetivoCount; i++) {
      const itemId = $sel('obj-item-' + i);
      const cant = parseInt(document.getElementById('obj-cant-' + i)?.value) || 0;
      if (itemId && cant > 0) objetivos.push({ item_id: itemId, cantidad: cant });
    }
    const body = {
      nombre_proyecto: nombre,
      usuario_id: currentUser.id,
      estado: $sel('f-proy-estado'),
      objetivos,
    };
    const { ok, data } = await api('POST', '/proyectos', body);
    if (ok) {
      document.getElementById('r-proyecto-create').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Construccion iniciada!', 'success');
      window._listProyectos();
    } else {
      document.getElementById('r-proyecto-create').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-proyecto-create').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._patchNombre = async () => {
  const id = $sel('f-gest-proy-sel');
  const nombre = $v('f-patch-nombre');
  if (!id) return showToast('Selecciona un proyecto', 'error');
  try {
    const { ok, data } = await api('PATCH', '/editar/nombre/' + id, { nombre_proyecto: nombre });
    if (ok) { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>'; showToast('Nombre cambiado!', 'success'); window._listProyectos(); }
    else { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>'; }
  } catch (e) { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._patchEstado = async () => {
  const id = $sel('f-gest-proy-sel');
  const estado = $sel('f-patch-estado');
  if (!id || !estado) return showToast('Selecciona proyecto y estado', 'error');
  try {
    const { ok, data } = await api('PATCH', '/editar/estado/' + id, { estado });
    if (ok) { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>'; showToast('Estado cambiado!', 'success'); window._listProyectos(); }
    else { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>'; }
  } catch (e) { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._deleteProyecto = async (proyectoId) => {
  if (!proyectoId) return showToast('ID de proyecto invalido', 'error');
  if (!confirm('Eliminar este proyecto permanentemente?')) return;
  try {
    const { ok, data } = await api('DELETE', '/proyectos/' + proyectoId);
    if (ok) { showToast('Proyecto eliminado!', 'success'); window._listProyectos(); }
    else { showToast(data.error || 'Error', 'error'); }
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
};

window._deleteProyectoFromGest = async () => {
  const id = $sel('f-gest-proy-sel');
  if (!id) return showToast('Selecciona un proyecto', 'error');
  if (!confirm('Eliminar este proyecto permanentemente?')) return;
  try {
    const { ok, data } = await api('DELETE', '/proyectos/' + id);
    if (ok) { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>'; showToast('Proyecto eliminado!', 'success'); window._listProyectos(); }
    else { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>'; }
  } catch (e) { document.getElementById('r-update-proyecto').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._getProyectoItems = async () => {
  const id = $sel('f-proy-items-sel');
  if (!id) return showToast('Selecciona un proyecto', 'error');
  try {
    const { ok, data } = await api('GET', '/proyectos/' + id + '/items');
    if (ok && Array.isArray(data)) {
      if (data.length === 0) { document.getElementById('r-proyecto-items').innerHTML = '<div class="mc-result visible"><div class="empty-state">Sin materiales asignados</div></div>'; return; }
      const html = data.map(item =>
        '<div class="item-row"><div class="item-icon">📦</div>' +
        '<div class="item-detail"><div class="item-name">' + (item.nombre || item.item_id || '?') + '</div>' +
        '<div class="item-meta">Cant: ' + (item.cantidad || '-') + ' | ' + (item.item_id || '-') +
        (item.error ? ' <span class="tag warn">NO ENCONTRADO</span>' : '') +
        '</div></div></div>'
      ).join('');
      document.getElementById('r-proyecto-items').innerHTML = '<div class="mc-result visible success">' + html + '</div>';
    } else {
      document.getElementById('r-proyecto-items').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-proyecto-items').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._crearAsignarItem = async () => {
  const id = $sel('f-asignar-proy-sel');
  const nombre = $v('f-asignar-nombre');
  if (!id || !nombre) return showToast('Selecciona proyecto y escribe un nombre', 'error');
  try {
    const body = {
      nombre,
      es_materia_prima: $sel('f-asignar-prima') === 'true',
      cantidad: parseInt(document.getElementById('f-asignar-cant').value) || 1,
    };
    const { ok, data } = await api('POST', '/proyectos/' + id + '/items', body);
    if (ok) {
      document.getElementById('r-asignar').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Material agregado!', 'success');
    } else {
      document.getElementById('r-asignar').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-asignar').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._removerItemProyecto = async () => {
  const id = $sel('f-remover-proy-sel');
  const itemId = $v('f-remover-item-id');
  if (!id || !itemId) return showToast('Selecciona proyecto y escribe el ID del item', 'error');
  try {
    const { ok, data } = await api('DELETE', '/proyectos/' + id + '/items/' + itemId);
    if (ok) {
      document.getElementById('r-remover').innerHTML = '<div class="mc-result visible success">' + formatOutput(data) + '</div>';
      showToast('Material removido!', 'success');
    } else {
      document.getElementById('r-remover').innerHTML = '<div class="mc-result visible error">' + (data.error || 'Error') + '</div>';
    }
  } catch (e) { document.getElementById('r-remover').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

// ====================== API: PERFIL ======================
window._patchUsuarioNombre = async () => {
  if (!currentUser) return showToast('Sin sesion', 'error');
  const nombre = $v('f-perfil-nombre');
  if (!nombre) return showToast('Ingresa un nombre', 'error');
  try {
    const { ok, data } = await api('PATCH', '/usuarios/' + currentUser.id, { nombre });
    if (ok) { currentUser.nombre = nombre; saveSession(currentUser); updateUserChip(); renderPerfil(); }
    document.getElementById('r-perfil-patch').innerHTML = '<div class="mc-result visible ' + (ok ? 'success' : 'error') + '">' + (ok ? 'Nombre actualizado exitosamente!' : (data.error || 'Error')) + '</div>';
    if (ok) showToast('Nombre actualizado!', 'success');
  } catch (e) { document.getElementById('r-perfil-patch').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._patchUsuarioEmail = async () => {
  if (!currentUser) return showToast('Sin sesion', 'error');
  const email = $v('f-perfil-email');
  if (!email) return showToast('Ingresa un email', 'error');
  try {
    const { ok, data } = await api('PATCH', '/usuarios/' + currentUser.id, { email });
    if (ok) { currentUser.email = email; saveSession(currentUser); renderPerfil(); }
    document.getElementById('r-perfil-email').innerHTML = '<div class="mc-result visible ' + (ok ? 'success' : 'error') + '">' + (ok ? 'Email actualizado exitosamente!' : (data.error || 'Error')) + '</div>';
    if (ok) showToast('Email actualizado!', 'success');
  } catch (e) { document.getElementById('r-perfil-email').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._patchUsuarioPassword = async () => {
  if (!currentUser) return showToast('Sin sesion', 'error');
  const password_actual = document.getElementById('f-perfil-pass-actual')?.value.trim();
  const password_nueva = document.getElementById('f-perfil-pass-nueva')?.value.trim();
  if (!password_actual || !password_nueva) return showToast('Ambos campos son obligatorios', 'error');
  if (password_nueva.length < 6) return showToast('La nueva contrasena debe tener al menos 6 caracteres', 'error');
  try {
    const { ok, data } = await api('PATCH', '/usuarios/' + currentUser.id + '/password', { password_actual, password_nueva });
    document.getElementById('r-perfil-password').innerHTML = '<div class="mc-result visible ' + (ok ? 'success' : 'error') + '">' + (ok ? 'Contrasena actualizada exitosamente!' : (data.error || 'Error')) + '</div>';
    if (ok) { showToast('Contrasena actualizada!', 'success'); document.getElementById('f-perfil-pass-actual').value = ''; document.getElementById('f-perfil-pass-nueva').value = ''; }
  } catch (e) { document.getElementById('r-perfil-password').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._loadAdminUsers = async () => {
  if (!currentUser || currentUser.rol !== 'admin') return showToast('Solo administradores', 'error');
  try {
    const { ok, data } = await api('GET', '/usuarios');
    if (ok && Array.isArray(data)) {
      if (data.length === 0) { document.getElementById('r-admin-user-list').innerHTML = '<div class="empty-state">No hay usuarios</div>'; return; }
      const html = data.map(u =>
        '<div class="item-row" style="margin-bottom:4px">' +
        '<div class="item-icon">👤</div>' +
        '<div class="item-detail" style="flex:1">' +
        '<div class="item-name">' + (u.nombre || '?') + '</div>' +
        '<div class="item-meta">' + u.id + ' | ' + (u.email || '') + (u.rol === 'admin' ? ' | ADMIN' : '') + '</div></div>' +
        (u.id !== currentUser.id ? '<button class="mc-btn red sm" onclick="window._adminDeleteUser(\'' + u.id + '\')">Eliminar</button>' : '') +
        '</div>'
      ).join('');
      document.getElementById('r-admin-user-list').innerHTML = '<div style="margin-bottom:6px;font-size:0.5rem;color:var(--mc-text-muted)">Usuarios registrados:</div>' + html;
    } else { document.getElementById('r-admin-user-list').innerHTML = '<div class="mc-result visible error">Error al cargar</div>'; }
  } catch (e) { document.getElementById('r-admin-user-list').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._adminDeleteUser = async (userId) => {
  if (!currentUser || currentUser.rol !== 'admin') return showToast('Solo administradores', 'error');
  if (!confirm('Eliminar este usuario y todos sus proyectos?')) return;
  try {
    const { ok, data } = await api('DELETE', '/usuarios/' + userId, { admin_id: currentUser.id });
    if (ok) { showToast('Usuario eliminado!', 'success'); window._loadAdminUsers(); }
    else { showToast(data.error || 'Error al eliminar', 'error'); }
  } catch (e) { showToast('Error: ' + e.message, 'error'); }
};

window._replaceUsuario = async () => {
  if (!currentUser) return showToast('Sin sesion', 'error');
  try {
    const nombre = $v('f-perfil-put-nombre');
    const email = $v('f-perfil-put-email');
    const fecha = $v('f-perfil-put-fecha');
    if (!nombre || !email || !fecha) return showToast('Todos los campos son obligatorios', 'error');
    const { ok, data } = await api('PUT', '/usuarios/' + currentUser.id, { nombre, email, fecha_registro: new Date(fecha).toISOString() });
    if (ok) { currentUser.nombre = nombre; currentUser.email = email; saveSession(currentUser); updateUserChip(); showToast('Perfil reemplazado!', 'success'); renderPerfil(); }
    document.getElementById('r-perfil-put').innerHTML = '<div class="mc-result visible ' + (ok ? 'success' : 'error') + '">' + (ok ? formatOutput(data) : (data.error || 'Error')) + '</div>';
  } catch (e) { document.getElementById('r-perfil-put').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._deleteUsuario = async () => {
  if (!currentUser) return showToast('Sin sesion', 'error');
  if (!confirm('Eliminar tu cuenta y todos tus proyectos?')) return;
  try {
    const { ok, data } = await api('DELETE', '/usuarios/' + currentUser.id);
    if (ok) { showToast('Cuenta eliminada', 'info'); window._logout(); }
    document.getElementById('r-perfil-delete').innerHTML = '<div class="mc-result visible ' + (ok ? 'success' : 'error') + '">' + (ok ? formatOutput(data) : (data.error || 'Error')) + '</div>';
  } catch (e) { document.getElementById('r-perfil-delete').innerHTML = '<div class="mc-result visible error">Error: ' + e.message + '</div>'; }
};

window._logout = () => {
  clearSession(); userChip.style.display = 'none'; closePanel(); showLoginOverlay(); showToast('Sesion cerrada', 'info');
};

// ====================== USER CHIP ======================
function updateUserChip() {
  if (currentUser) {
    userChip.style.display = 'flex';
    userChip.querySelector('.chip-name').textContent = currentUser.nombre || currentUser.id;
  } else { userChip.style.display = 'none'; }
}
userChip.addEventListener('click', () => { if (currentUser && blockDataMap.has(blockPerfil)) openPanel(blockDataMap.get(blockPerfil)); });

// ====================== LOGIN ======================
function showLoginOverlay() { loginOverlay.classList.remove('hidden'); hintText.style.opacity = '0'; switchLoginTab('existing'); }
function hideLoginOverlay() { loginOverlay.classList.add('hidden'); hintText.style.opacity = currentUser ? '1' : '0'; }

function switchLoginTab(tab) {
  document.getElementById('login-error').innerHTML = '';
  if (tab === 'existing') {
    loginOptExisting.classList.add('active'); loginOptNew.classList.remove('active');
    loginSectionExisting.classList.add('active'); loginSectionNew.classList.remove('active');
  } else {
    loginOptNew.classList.add('active'); loginOptExisting.classList.remove('active');
    loginSectionNew.classList.add('active'); loginSectionExisting.classList.remove('active');
  }
}
loginOptExisting.addEventListener('click', () => switchLoginTab('existing'));
loginOptNew.addEventListener('click', () => switchLoginTab('new'));

document.getElementById('login-do-login').addEventListener('click', async () => {
  const email = document.getElementById('login-email').value.trim();
  const password = document.getElementById('login-password').value.trim();
  const errorEl = document.getElementById('login-error');
  if (!email || !password) { errorEl.innerHTML = '<div class="mc-result visible error">Email y contrasena son obligatorios</div>'; return; }
  try {
    const { ok, data } = await api('POST', '/login', { email, password });
    if (ok && data.data) {
      saveSession({ id: data.data.id, nombre: data.data.nombre, email: data.data.email, rol: data.data.rol });
      updateUserChip(); hideLoginOverlay(); showToast('Bienvenido, ' + data.data.nombre + '!', 'success');
    } else {
      errorEl.innerHTML = '<div class="mc-result visible error">' + (data.error || 'Credenciales invalidas') + '</div>';
    }
  } catch (e) { errorEl.innerHTML = '<div class="mc-result visible error">Error de conexion</div>'; }
});

document.getElementById('login-do-register').addEventListener('click', async () => {
  const nombre = document.getElementById('reg-nombre').value.trim();
  const email = document.getElementById('reg-email').value.trim();
  const password = document.getElementById('reg-password').value.trim();
  if (!nombre || !email || !password) return showToast('Nombre, email y contrasena son obligatorios', 'error');
  if (password.length < 6) return showToast('La contrasena debe tener al menos 6 caracteres', 'error');
  try {
    const { ok, data } = await api('POST', '/usuarios', { nombre, email, password });
    if (ok && data.data) {
      saveSession({ id: data.id, nombre: data.data.nombre, email: data.data.email, rol: data.data.rol });
      updateUserChip(); hideLoginOverlay(); showToast('Registrado! Bienvenido, ' + data.data.nombre + '!', 'success');
    } else {
      showToast(data.error || 'Error al registrar', 'error');
    }
  } catch (e) { showToast('Error al conectar', 'error'); }
});

// ====================== SERVER CHECK ======================
async function checkServer() {
  try { const { data } = await api('GET', '/datos'); hudStatus.className = data.estado === 'OK' ? 'hud-dot ok' : 'hud-dot err'; }
  catch (e) { hudStatus.className = 'hud-dot err'; }
}

// ====================== RESIZE ======================
window.addEventListener('resize', () => { camera.aspect = innerWidth / innerHeight; camera.updateProjectionMatrix(); renderer.setSize(innerWidth, innerHeight); });

// ====================== INIT ======================
loadSession();
updateUserChip();
loadItems();

if (currentUser) { hideLoginOverlay(); showToast('Bienvenido de vuelta, ' + currentUser.nombre + '!', 'info'); }
else { showLoginOverlay(); }

animate();
checkServer();
setInterval(checkServer, 60000);
