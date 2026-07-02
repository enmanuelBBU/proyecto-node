# Inventario personal + catalogo JEI — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Seed ~70 core Minecraft items (with real icon ids, no stock), make the personal per-user inventory the real limited inventory shown in "Abrir Inventario", and add a drag-and-drop "Anadir Items" screen in Perfil with a JEI-style catalog grid.

**Architecture:** Global `items` collection becomes a stock-less recipe/type dictionary with a new `full_id` field for real icons. The limited inventory lives in `usuario.inventario` (`{item_id: cantidad}`), exposed via a new `InventarioContext` and edited through shared components (`InventoryGrid`, quantity editor, drag-drop). No new backend endpoints.

**Tech Stack:** React 19 + Vite, Express + Firebase Admin (Firestore), blocksitems.com icon API, HTML5 native drag-and-drop.

## Global Constraints

- No unit-test framework in repo; verification per task = `npm run build` (in `frontend/`) + `npx oxlint <files>` clean + Playwright visual check where UI changes.
- Firestore collections: catalog = `items`, users = `usuario` (singular).
- Credential file resolved via the two-name fallback pattern in `scripts/migrate-passwords.js`.
- Icon source: `https://blocksitems.com/api/v1/items/{full_id}/icon?size=N` (public, no key). Always keep emoji fallback via existing `McIcon`.
- Inventory PATCH sets ABSOLUTE cantidad: `PATCH /api/usuarios/:id/inventario` body `{item_id, cantidad}`. Drag-add computes `actual + N` client-side.
- Do NOT print user PII (names/emails/inventories) to console in scripts.

---

### Task 1: Seed script — catalog items + strip stock

**Files:**
- Create: `scripts/seed-items.js`
- Run: `node scripts/seed-items.js`

**Interfaces:**
- Produces: `items` docs each shaped `{ nombre, full_id, categoria, es_materia_prima, ingredientes_para_calculo, receta_matriz }` — NO `stock` field. Doc id = nombre slug (lowercase, NFD-stripped, spaces→`_`), same as `POST /api/items`.

- [ ] **Step 1: Write the seed script**

Structure: reuse credential fallback from `scripts/migrate-passwords.js`. Define a `slug(nombre)` helper identical to `POST /api/items` id logic. Define an `ITEMS` array (~70 curated entries). Then:
1. `.set(item, { merge: true })` each item under its slug id.
2. Second pass over ALL existing `items` docs: if a doc has a `stock` field, remove it with `admin.firestore.FieldValue.delete()`.

```js
const admin = require('firebase-admin');
const path = require('path');

let credPath;
try {
  credPath = path.join(__dirname, '..', 'craftbuild-63e96-firebase-adminsdk-fbsvc-fa3cd2b205.json');
  require(credPath);
} catch {
  credPath = path.join(__dirname, '..', 'craftbuild-63e96-firebase-adminsdk-fbsvc-8927be5148.json');
}
const serviceAccount = require(credPath);
admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
const db = admin.firestore();

function slug(nombre) {
  return nombre.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/ /g, '_');
}

// mp = materia prima helper
const mp = (nombre, full_id, categoria = 'materias_primas') =>
  ({ nombre, full_id, categoria, es_materia_prima: true, receta_matriz: [], ingredientes_para_calculo: [] });
// el = elaborado helper (receta_matriz 9 slots of item slugs|null, ingredientes list)
const el = (nombre, full_id, categoria, receta_matriz, ingredientes_para_calculo = []) =>
  ({ nombre, full_id, categoria, es_materia_prima: false, receta_matriz, ingredientes_para_calculo });

const ITEMS = [
  // ---- Materias primas ----
  mp('Madera de Roble', 'minecraft:oak_log'),
  mp('Palo', 'minecraft:stick'),
  mp('Piedra', 'minecraft:stone'),
  mp('Roca', 'minecraft:cobblestone'),
  mp('Carbon', 'minecraft:coal'),
  mp('Lingote de Hierro', 'minecraft:iron_ingot'),
  mp('Lingote de Oro', 'minecraft:gold_ingot'),
  mp('Diamante', 'minecraft:diamond'),
  mp('Esmeralda', 'minecraft:emerald'),
  mp('Lapislazuli', 'minecraft:lapis_lazuli'),
  mp('Redstone', 'minecraft:redstone'),
  mp('Cobre', 'minecraft:copper_ingot'),
  mp('Cuarzo', 'minecraft:quartz'),
  mp('Lana', 'minecraft:white_wool'),
  mp('Cuero', 'minecraft:leather'),
  mp('Arena', 'minecraft:sand'),
  mp('Grava', 'minecraft:gravel'),
  mp('Arcilla', 'minecraft:clay_ball'),
  mp('Vidrio', 'minecraft:glass'),
  mp('Obsidiana', 'minecraft:obsidian'),
  mp('Trigo', 'minecraft:wheat'),
  mp('Semillas', 'minecraft:wheat_seeds'),
  mp('Ladrillo', 'minecraft:brick'),
  mp('Hueso', 'minecraft:bone'),
  mp('Cuerda', 'minecraft:string'),
  mp('Pluma', 'minecraft:feather'),
  mp('Polvora', 'minecraft:gunpowder'),
  mp('Perla de Ender', 'minecraft:ender_pearl'),
  // ---- Bloques de construccion ----
  el('Tablones de Roble', 'minecraft:oak_planks', 'bloques_construccion',
     ['madera_de_roble', null, null, null, null, null, null, null, null],
     [{ item_id: 'madera_de_roble', cantidad: 1 }]),
  // ---- Utilidad ----
  el('Mesa de Crafteo', 'minecraft:crafting_table', 'utilidad',
     ['tablones_de_roble', 'tablones_de_roble', null, 'tablones_de_roble', 'tablones_de_roble', null, null, null, null],
     [{ item_id: 'tablones_de_roble', cantidad: 4 }]),
  el('Horno', 'minecraft:furnace', 'utilidad',
     ['roca', 'roca', 'roca', 'roca', null, 'roca', 'roca', 'roca', 'roca'],
     [{ item_id: 'roca', cantidad: 8 }]),
  el('Cofre', 'minecraft:chest', 'utilidad',
     ['tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble', null, 'tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble'],
     [{ item_id: 'tablones_de_roble', cantidad: 8 }]),
  el('Antorcha', 'minecraft:torch', 'utilidad',
     ['carbon', null, null, 'palo', null, null, null, null, null],
     [{ item_id: 'carbon', cantidad: 1 }, { item_id: 'palo', cantidad: 1 }]),
  el('Puerta de Madera', 'minecraft:oak_door', 'utilidad',
     ['tablones_de_roble', 'tablones_de_roble', null, 'tablones_de_roble', 'tablones_de_roble', null, 'tablones_de_roble', 'tablones_de_roble', null],
     [{ item_id: 'tablones_de_roble', cantidad: 6 }]),
  el('Escalera de Madera', 'minecraft:oak_stairs', 'utilidad',
     ['tablones_de_roble', null, null, 'tablones_de_roble', 'tablones_de_roble', null, 'tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble'],
     [{ item_id: 'tablones_de_roble', cantidad: 6 }]),
  el('Cama', 'minecraft:red_bed', 'utilidad',
     ['lana', 'lana', 'lana', 'tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble', null, null, null],
     [{ item_id: 'lana', cantidad: 3 }, { item_id: 'tablones_de_roble', cantidad: 3 }]),
  el('Yunque', 'minecraft:anvil', 'utilidad',
     ['lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', null, 'lingote_de_hierro', null, 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro'],
     [{ item_id: 'lingote_de_hierro', cantidad: 4 }]),
  el('Libreria', 'minecraft:bookshelf', 'utilidad',
     ['tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble', 'papel', 'papel', 'papel', 'tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble'],
     [{ item_id: 'tablones_de_roble', cantidad: 6 }]),
  el('TNT', 'minecraft:tnt', 'utilidad',
     ['polvora', 'arena', 'polvora', 'arena', 'polvora', 'arena', 'polvora', 'arena', 'polvora'],
     [{ item_id: 'polvora', cantidad: 5 }, { item_id: 'arena', cantidad: 4 }]),
  mp('Papel', 'minecraft:paper', 'materias_primas'),
  // ---- Herramientas: madera ----
  el('Pico de Madera', 'minecraft:wooden_pickaxe', 'herramientas',
     ['tablones_de_roble', 'tablones_de_roble', 'tablones_de_roble', null, 'palo', null, null, 'palo', null],
     [{ item_id: 'tablones_de_roble', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Hacha de Madera', 'minecraft:wooden_axe', 'herramientas',
     ['tablones_de_roble', 'tablones_de_roble', null, 'tablones_de_roble', 'palo', null, null, 'palo', null],
     [{ item_id: 'tablones_de_roble', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Pala de Madera', 'minecraft:wooden_shovel', 'herramientas',
     [null, 'tablones_de_roble', null, null, 'palo', null, null, 'palo', null],
     [{ item_id: 'tablones_de_roble', cantidad: 1 }, { item_id: 'palo', cantidad: 2 }]),
  el('Espada de Madera', 'minecraft:wooden_sword', 'herramientas',
     [null, 'tablones_de_roble', null, null, 'tablones_de_roble', null, null, 'palo', null],
     [{ item_id: 'tablones_de_roble', cantidad: 2 }, { item_id: 'palo', cantidad: 1 }]),
  el('Azada de Madera', 'minecraft:wooden_hoe', 'herramientas',
     ['tablones_de_roble', 'tablones_de_roble', null, null, 'palo', null, null, 'palo', null],
     [{ item_id: 'tablones_de_roble', cantidad: 2 }, { item_id: 'palo', cantidad: 2 }]),
  // ---- Herramientas: piedra ----
  el('Pico de Piedra', 'minecraft:stone_pickaxe', 'herramientas',
     ['roca', 'roca', 'roca', null, 'palo', null, null, 'palo', null],
     [{ item_id: 'roca', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Hacha de Piedra', 'minecraft:stone_axe', 'herramientas',
     ['roca', 'roca', null, 'roca', 'palo', null, null, 'palo', null],
     [{ item_id: 'roca', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Pala de Piedra', 'minecraft:stone_shovel', 'herramientas',
     [null, 'roca', null, null, 'palo', null, null, 'palo', null],
     [{ item_id: 'roca', cantidad: 1 }, { item_id: 'palo', cantidad: 2 }]),
  el('Espada de Piedra', 'minecraft:stone_sword', 'herramientas',
     [null, 'roca', null, null, 'roca', null, null, 'palo', null],
     [{ item_id: 'roca', cantidad: 2 }, { item_id: 'palo', cantidad: 1 }]),
  // ---- Herramientas: hierro ----
  el('Pico de Hierro', 'minecraft:iron_pickaxe', 'herramientas',
     ['lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', null, 'palo', null, null, 'palo', null],
     [{ item_id: 'lingote_de_hierro', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Hacha de Hierro', 'minecraft:iron_axe', 'herramientas',
     ['lingote_de_hierro', 'lingote_de_hierro', null, 'lingote_de_hierro', 'palo', null, null, 'palo', null],
     [{ item_id: 'lingote_de_hierro', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Pala de Hierro', 'minecraft:iron_shovel', 'herramientas',
     [null, 'lingote_de_hierro', null, null, 'palo', null, null, 'palo', null],
     [{ item_id: 'lingote_de_hierro', cantidad: 1 }, { item_id: 'palo', cantidad: 2 }]),
  el('Espada de Hierro', 'minecraft:iron_sword', 'herramientas',
     [null, 'lingote_de_hierro', null, null, 'lingote_de_hierro', null, null, 'palo', null],
     [{ item_id: 'lingote_de_hierro', cantidad: 2 }, { item_id: 'palo', cantidad: 1 }]),
  // ---- Herramientas: oro ----
  el('Pico de Oro', 'minecraft:golden_pickaxe', 'herramientas',
     ['lingote_de_oro', 'lingote_de_oro', 'lingote_de_oro', null, 'palo', null, null, 'palo', null],
     [{ item_id: 'lingote_de_oro', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Espada de Oro', 'minecraft:golden_sword', 'herramientas',
     [null, 'lingote_de_oro', null, null, 'lingote_de_oro', null, null, 'palo', null],
     [{ item_id: 'lingote_de_oro', cantidad: 2 }, { item_id: 'palo', cantidad: 1 }]),
  // ---- Herramientas: diamante ----
  el('Pico de Diamante', 'minecraft:diamond_pickaxe', 'herramientas',
     ['diamante', 'diamante', 'diamante', null, 'palo', null, null, 'palo', null],
     [{ item_id: 'diamante', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Hacha de Diamante', 'minecraft:diamond_axe', 'herramientas',
     ['diamante', 'diamante', null, 'diamante', 'palo', null, null, 'palo', null],
     [{ item_id: 'diamante', cantidad: 3 }, { item_id: 'palo', cantidad: 2 }]),
  el('Pala de Diamante', 'minecraft:diamond_shovel', 'herramientas',
     [null, 'diamante', null, null, 'palo', null, null, 'palo', null],
     [{ item_id: 'diamante', cantidad: 1 }, { item_id: 'palo', cantidad: 2 }]),
  el('Espada de Diamante', 'minecraft:diamond_sword', 'herramientas',
     [null, 'diamante', null, null, 'diamante', null, null, 'palo', null],
     [{ item_id: 'diamante', cantidad: 2 }, { item_id: 'palo', cantidad: 1 }]),
  // ---- Armadura hierro ----
  el('Casco de Hierro', 'minecraft:iron_helmet', 'armadura',
     ['lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', null, 'lingote_de_hierro', null, null, null],
     [{ item_id: 'lingote_de_hierro', cantidad: 5 }]),
  el('Pechera de Hierro', 'minecraft:iron_chestplate', 'armadura',
     ['lingote_de_hierro', null, 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro', 'lingote_de_hierro'],
     [{ item_id: 'lingote_de_hierro', cantidad: 8 }]),
  // ---- Comida ----
  mp('Manzana', 'minecraft:apple', 'comida'),
  mp('Zanahoria', 'minecraft:carrot', 'comida'),
  mp('Papa', 'minecraft:potato', 'comida'),
  mp('Melon', 'minecraft:melon_slice', 'comida'),
  mp('Carne Cocida', 'minecraft:cooked_beef', 'comida'),
  el('Pan', 'minecraft:bread', 'comida',
     ['trigo', 'trigo', 'trigo', null, null, null, null, null, null],
     [{ item_id: 'trigo', cantidad: 3 }]),
  el('Pastel', 'minecraft:cake', 'comida',
     ['leche', 'leche', 'leche', 'azucar', 'huevo', 'azucar', 'trigo', 'trigo', 'trigo'],
     [{ item_id: 'trigo', cantidad: 3 }]),
  mp('Leche', 'minecraft:milk_bucket', 'comida'),
  mp('Azucar', 'minecraft:sugar', 'comida'),
  mp('Huevo', 'minecraft:egg', 'comida'),
];

async function seed() {
  const batch = db.batch();
  for (const item of ITEMS) {
    batch.set(db.collection('items').doc(slug(item.nombre)), item, { merge: true });
  }
  await batch.commit();
  console.log(`Sembrados/actualizados: ${ITEMS.length} items`);

  // Strip stock from all catalog docs
  const snap = await db.collection('items').get();
  let stripped = 0;
  const delBatch = db.batch();
  snap.forEach((doc) => {
    if (Object.prototype.hasOwnProperty.call(doc.data(), 'stock')) {
      delBatch.update(doc.ref, { stock: admin.firestore.FieldValue.delete() });
      stripped++;
    }
  });
  if (stripped) await delBatch.commit();
  console.log(`Campo stock eliminado de ${stripped} items. Total items: ${snap.size}`);
  process.exit(0);
}

seed().catch((e) => { console.error('ERROR seed:', e.message); process.exit(1); });
```

- [ ] **Step 2: Validate a sample of full_ids against the icon API before seeding**

Run (bash):
```bash
for id in minecraft:oak_log minecraft:milk_bucket minecraft:cooked_beef minecraft:red_bed minecraft:anvil minecraft:bookshelf minecraft:cake minecraft:carrot minecraft:iron_chestplate minecraft:melon_slice; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "https://blocksitems.com/api/v1/items/$id/icon?size=32")
  echo "$id -> $code"
done
```
Expected: every id prints `200`. If any prints `404`/`405`, fix that `full_id` in the array before running the seed.

- [ ] **Step 3: Run the seed script**

Run: `cd D:/proyecto-node && node scripts/seed-items.js`
Expected: prints `Sembrados/actualizados: <N> items` then `Campo stock eliminado de <M> items. Total items: <T>` and exits 0.

- [ ] **Step 4: Verify no catalog item has a stock field**

Run: `cd D:/proyecto-node && node -e "require('dotenv').config();const a=require('firebase-admin');const s=require('./craftbuild-63e96-firebase-adminsdk-fbsvc-8927be5148.json');a.initializeApp({credential:a.credential.cert(s)});a.firestore().collection('items').get().then(q=>{let bad=0;q.forEach(d=>{if('stock'in d.data())bad++});console.log('items:',q.size,'con stock:',bad);process.exit(0)})"`
Expected: `con stock: 0`.

- [ ] **Step 5: Commit**

```bash
cd D:/proyecto-node && git add scripts/seed-items.js && git commit -m "feat: seed ~70 core Minecraft items with icon ids, strip stock from catalog"
```

---

### Task 2: InventarioContext (per-user inventory state)

**Files:**
- Create: `frontend/src/context/InventarioContext.jsx`
- Modify: `frontend/src/App.jsx`

**Interfaces:**
- Produces: `useInventario()` → `{ inventario, reload, setCantidad, addCantidad, loading }`.
  - `inventario`: object `{ [item_id]: cantidad }`.
  - `reload(): Promise<object>` — GETs `/usuarios/:id`, stores/returns `inventario`.
  - `setCantidad(item_id, cantidad): Promise<boolean>` — absolute set via PATCH, optimistic, reverts on failure, returns ok.
  - `addCantidad(item_id, n): Promise<boolean>` — reads current, calls `setCantidad(item_id, current + n)`.

- [ ] **Step 1: Create the context**

```jsx
import { createContext, useContext, useCallback, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { useSession } from './SessionContext';

const InventarioContext = createContext(null);

export function InventarioProvider({ children }) {
  const { user } = useSession();
  const [inventario, setInventario] = useState({});
  const [loading, setLoading] = useState(false);

  const reload = useCallback(async () => {
    if (!user) { setInventario({}); return {}; }
    setLoading(true);
    try {
      const { ok, data } = await api('GET', '/usuarios/' + user.id);
      const inv = ok && data && data.inventario ? data.inventario : {};
      setInventario(inv);
      return inv;
    } catch {
      setInventario({});
      return {};
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { reload(); }, [reload]);

  const setCantidad = useCallback(async (item_id, cantidad) => {
    if (!user) return false;
    const prev = inventario[item_id];
    setInventario((cur) => ({ ...cur, [item_id]: cantidad }));
    try {
      const { ok } = await api('PATCH', `/usuarios/${user.id}/inventario`, { item_id, cantidad });
      if (!ok) {
        setInventario((cur) => {
          const next = { ...cur };
          if (prev === undefined) delete next[item_id]; else next[item_id] = prev;
          return next;
        });
      }
      return ok;
    } catch {
      setInventario((cur) => {
        const next = { ...cur };
        if (prev === undefined) delete next[item_id]; else next[item_id] = prev;
        return next;
      });
      return false;
    }
  }, [user, inventario]);

  const addCantidad = useCallback(async (item_id, n) => {
    const current = inventario[item_id] || 0;
    return setCantidad(item_id, current + n);
  }, [inventario, setCantidad]);

  return (
    <InventarioContext.Provider value={{ inventario, reload, setCantidad, addCantidad, loading }}>
      {children}
    </InventarioContext.Provider>
  );
}

export function useInventario() {
  return useContext(InventarioContext);
}
```

- [ ] **Step 2: Register provider in App.jsx**

Wrap inside `ItemsProvider` (needs session; inventory rows resolve names against catalog items):

```jsx
import { SessionProvider } from './context/SessionContext';
import { ItemsProvider } from './context/ItemsContext';
import { InventarioProvider } from './context/InventarioContext';
import { ToastProvider } from './components/Toast';
import Hub from './Hub';

export default function App() {
  return (
    <SessionProvider>
      <ToastProvider>
        <ItemsProvider>
          <InventarioProvider>
            <Hub />
          </InventarioProvider>
        </ItemsProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
```

- [ ] **Step 3: Build + lint**

Run: `cd D:/proyecto-node/frontend && npm run build && npx oxlint src/context/InventarioContext.jsx src/App.jsx`
Expected: build succeeds; oxlint prints no errors (the `react-hooks/exhaustive-deps` and `only-export-components` warnings are acceptable, matching existing files).

- [ ] **Step 4: Commit**

```bash
cd D:/proyecto-node && git add frontend/src/context/InventarioContext.jsx frontend/src/App.jsx && git commit -m "feat: add InventarioContext for per-user inventory"
```

---

### Task 3: Shared InventoryGrid + SlotQuantityEditor + resolver

**Files:**
- Modify: `frontend/src/components/panel/shared.jsx`
- Modify: `frontend/src/index.css`

**Interfaces:**
- Consumes: `MC_ICONS`, `McIcon` (already in shared.jsx).
- Produces:
  - `resolveEntries(inventario, items)` → array `{ item_id, cantidad, nombre, full_id, es_materia_prima }`, sorted by nombre. Unknown item_ids fall back to `{ nombre: item_id, es_materia_prima: false }`.
  - `iconFor(item)` → returns `item.full_id || (item.es_materia_prima ? MC_ICONS.materiaPrima : MC_ICONS.elaborado)`.
  - `<InventoryGrid entries onSlotClick />` — 9-col fixed grid, empty-slot padding, `McIcon` + count badge; slot click → `onSlotClick(item_id)`.
  - `<SlotQuantityEditor itemName cantidad onSave onCancel />` — inline numeric editor row.

- [ ] **Step 1: Add resolver + iconFor + components to shared.jsx**

Append (after existing `McIcon`; reuse the imported `useState`):

```jsx
export function iconFor(item) {
  return item.full_id || (item.es_materia_prima ? MC_ICONS.materiaPrima : MC_ICONS.elaborado);
}

export function resolveEntries(inventario, items) {
  const byId = {};
  for (const it of items) byId[it.id] = it;
  return Object.entries(inventario)
    .map(([item_id, cantidad]) => {
      const cat = byId[item_id];
      return {
        item_id,
        cantidad,
        nombre: cat ? (cat.nombre || item_id) : item_id,
        full_id: cat ? cat.full_id : undefined,
        es_materia_prima: cat ? !!cat.es_materia_prima : false,
      };
    })
    .sort((a, b) => a.nombre.localeCompare(b.nombre));
}

export function InventoryGrid({ entries, onSlotClick }) {
  const total = Math.max(Math.ceil(entries.length / 9) * 9, 27);
  return (
    <div className="inv-grid-fixed">
      {Array.from({ length: total }).map((_, i) => {
        const e = entries[i];
        if (!e) return <div className="inv-slot empty" key={'e' + i} />;
        return (
          <div
            className="inv-slot"
            key={e.item_id}
            title={`${e.nombre} — ${e.cantidad}`}
            onClick={() => onSlotClick && onSlotClick(e.item_id)}
            style={{ cursor: onSlotClick ? 'pointer' : 'default' }}
          >
            <span className="inv-icon"><McIcon id={iconFor(e)} fallback={e.es_materia_prima ? '🪨' : '🔧'} /></span>
            <span className="inv-count">{e.cantidad}</span>
          </div>
        );
      })}
    </div>
  );
}

export function SlotQuantityEditor({ itemName, cantidad, onSave, onCancel }) {
  const [val, setVal] = useState(String(cantidad ?? 0));
  return (
    <div className="slot-qty-editor">
      <div className="slot-qty-name">{itemName}</div>
      <div className="mc-fld-row" style={{ alignItems: 'center' }}>
        <input className="mc-input" type="number" min="0" value={val} onChange={(e) => setVal(e.target.value)} autoFocus />
        <button className="mc-btn green sm" onClick={() => onSave(Math.max(0, parseInt(val) || 0))}>OK</button>
        <button className="mc-btn sm" onClick={onCancel}>X</button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Add CSS for editor + JEI grid**

Append near the inventory CSS block in `index.css`:

```css
/* ============ SLOT QUANTITY EDITOR ============ */
.slot-qty-editor {
  margin-top: 10px; padding: 10px 12px;
  background: var(--mc-bg); border: 3px solid var(--mc-border-dark);
  box-shadow: inset 2px 2px 0 rgba(0,0,0,0.4);
}
.slot-qty-name { font-size: 0.6rem; color: #FFF; margin-bottom: 6px; }

/* ============ JEI CATALOG GRID (4 cols) ============ */
.jei-grid {
  display: grid; grid-template-columns: repeat(4, 1fr);
  gap: 4px; max-height: 320px; overflow-y: auto;
  padding: 8px; background: var(--mc-bg);
  border: 3px solid var(--mc-border-dark);
  box-shadow: inset 2px 2px 0 rgba(0,0,0,0.4);
}
.jei-grid::-webkit-scrollbar { width: 8px; }
.jei-grid::-webkit-scrollbar-track { background: var(--mc-bg); }
.jei-grid::-webkit-scrollbar-thumb { background: var(--mc-border-light); border: 1px solid #000; }
.jei-slot {
  display: flex; flex-direction: column; align-items: center; gap: 2px;
  padding: 4px 2px; background: var(--mc-panel-light);
  border: 2px solid var(--mc-border-dark);
  box-shadow: inset -1px -1px 0 rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.04);
  cursor: grab; user-select: none;
}
.jei-slot:hover { border-color: var(--mc-border-light); background: #555; }
.jei-slot:active { cursor: grabbing; }
.jei-slot .jei-icon { font-size: 1.2rem; }
.jei-slot .jei-name {
  font-size: 0.4rem; color: var(--mc-text-muted); text-align: center;
  line-height: 1.2; max-width: 100%;
  overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.inv-drop-zone.drag-over { outline: 3px solid var(--mc-green); outline-offset: 2px; }

/* two-column layout for Anadir Items */
.anadir-cols { display: flex; gap: 10px; }
.anadir-cols > div { flex: 1; min-width: 0; }
.anadir-cols h5 { font-size: 0.55rem; color: var(--mc-text-muted); margin-bottom: 6px; }
```

- [ ] **Step 3: Build + lint**

Run: `cd D:/proyecto-node/frontend && npm run build && npx oxlint src/components/panel/shared.jsx`
Expected: build succeeds; no new oxlint errors.

- [ ] **Step 4: Commit**

```bash
cd D:/proyecto-node && git add frontend/src/components/panel/shared.jsx frontend/src/index.css && git commit -m "feat: shared InventoryGrid, SlotQuantityEditor, JEI grid styles"
```

---

### Task 4: CrafteosPanel — inventory from user, remove stock fields, add full_id

**Files:**
- Modify: `frontend/src/components/panel/CrafteosPanel.jsx`

**Interfaces:**
- Consumes: `useInventario`, `resolveEntries`, `InventoryGrid`, `SlotQuantityEditor`.

- [ ] **Step 1: Update imports + hooks**

Change the shared import line to include new exports and add inventario hook:

```jsx
import { useState, useEffect } from 'react';
import { api } from '../../lib/api';
import { useItems } from '../../context/ItemsContext';
import { useInventario } from '../../context/InventarioContext';
import { useToast } from '../Toast';
import { ItemSelect, IngredientRows, CraftGrid, ResultBox, McIcon, MC_ICONS, InventoryGrid, SlotQuantityEditor, resolveEntries } from './shared';
```

Inside the component, after `const showToast = useToast();`:

```jsx
  const { inventario, reload: reloadInv, setCantidad } = useInventario();
  const [editSlot, setEditSlot] = useState(null); // item_id being edited
```

- [ ] **Step 2: Rework openInventario + modal body to use inventario**

Replace the `openInventario` function body:

```jsx
  async function openInventario() {
    await reloadInv();
    setInvOpen(true);
  }
```

Replace the inventory modal body (the `items.length === 0 ? ... : <div className="inv-grid-fixed">...`) with the shared grid + editor. `entries` is computed just before the return:

```jsx
  const entries = resolveEntries(inventario, items);
```

Modal body JSX:

```jsx
            <div className="inv-modal-body">
              {entries.length === 0 ? (
                <div className="empty-state">Inventario vacio. Agrega items desde Perfil &gt; Anadir Items.</div>
              ) : (
                <InventoryGrid entries={entries} onSlotClick={(id) => setEditSlot(id)} />
              )}
              {editSlot && (
                <SlotQuantityEditor
                  itemName={(entries.find((e) => e.item_id === editSlot) || {}).nombre || editSlot}
                  cantidad={inventario[editSlot] || 0}
                  onSave={async (n) => { await setCantidad(editSlot, n); setEditSlot(null); }}
                  onCancel={() => setEditSlot(null)}
                />
              )}
            </div>
```

Also update `onBadgeChange`: badge should reflect distinct inventory items. In `openInventario` after reload add `onBadgeChange(Object.keys(inv).length)` — capture `const inv = await reloadInv();`.

- [ ] **Step 3: Remove stock from Nuevo Crafteo**

Delete `nStock` state (`const [nStock, setNStock] = useState(0);`) and the "Stock Inicial" field block. In `createItem`, remove `stock: parseInt(nStock) || 0,` from the body and add `full_id` support. Add a `full_id` field + state instead:

State: replace `const [nStock, setNStock] = useState(0);` with `const [nFullId, setNFullId] = useState('');`.

In `createItem` body object, remove the `stock` line; after building `body`, add:
```jsx
    if (nFullId.trim()) body.full_id = nFullId.trim();
```
And reset: change `setNStock(0)` in the success reset to `setNFullId('')`.

Field JSX — replace the "Stock Inicial" `mc-fld` with:
```jsx
          <div className="mc-fld"><label>ID Minecraft (icono, opcional)</label>
            <input className="mc-input" placeholder="minecraft:diamond_sword" value={nFullId} onChange={(e) => setNFullId(e.target.value)} />
          </div>
```

- [ ] **Step 4: Remove stock from Editar Crafteo, add full_id**

Delete `uStock` state and its field. In `updateItem`, remove the `if (uStock !== '') {...}` block. Add `uFullId` state (`const [uFullId, setUFullId] = useState('');`), and in `updateItem` after the ingredientes block:
```jsx
    if (uFullId.trim()) body.full_id = uFullId.trim();
```
Replace the "Stock" field JSX with:
```jsx
        <div className="mc-fld"><label>ID Minecraft (icono, opcional)</label>
          <input className="mc-input" placeholder="Dejar vacio para no cambiar" value={uFullId} onChange={(e) => setUFullId(e.target.value)} />
        </div>
```

- [ ] **Step 5: Build + lint**

Run: `cd D:/proyecto-node/frontend && npm run build && npx oxlint src/components/panel/CrafteosPanel.jsx`
Expected: build succeeds; no new errors.

- [ ] **Step 6: Commit**

```bash
cd D:/proyecto-node && git add frontend/src/components/panel/CrafteosPanel.jsx && git commit -m "feat: Abrir Inventario shows per-user inventory; drop stock, add full_id in crafteo forms"
```

---

### Task 5: PerfilPanel — "Anadir Items" drag-and-drop screen

**Files:**
- Modify: `frontend/src/components/panel/PerfilPanel.jsx`

**Interfaces:**
- Consumes: `useItems`, `useInventario`, `InventoryGrid`, `SlotQuantityEditor`, `resolveEntries`, `iconFor`, `McIcon`.

- [ ] **Step 1: Update imports + hooks**

```jsx
import { useItems } from '../../context/ItemsContext';
import { useInventario } from '../../context/InventarioContext';
import { ResultBox, McIcon, MC_ICONS, InventoryGrid, SlotQuantityEditor, resolveEntries, iconFor } from './shared';
```

Inside component:
```jsx
  const { items } = useItems();
  const { inventario, setCantidad, addCantidad } = useInventario();
  const [qty, setQty] = useState(1);
  const [dragOver, setDragOver] = useState(false);
  const [editSlot, setEditSlot] = useState(null);
```

- [ ] **Step 2: Add the "Anadir Items" card**

Insert as a new `<div className="mc-card">` right after the "Mi Perfil" card. `entries` computed before return: `const entries = resolveEntries(inventario, items);`

```jsx
      <div className="mc-card">
        <div className="mc-label">Anadir Items</div>
        {!user ? (
          <div className="empty-state">Inicia sesion para gestionar tu inventario.</div>
        ) : (
          <>
            <div className="anadir-cols">
              <div>
                <h5>Tu Inventario</h5>
                <div
                  className={`inv-drop-zone ${dragOver ? 'drag-over' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                  onDragLeave={() => setDragOver(false)}
                  onDrop={async (e) => {
                    e.preventDefault();
                    setDragOver(false);
                    const itemId = e.dataTransfer.getData('text/plain');
                    const n = parseInt(qty);
                    if (!itemId) return;
                    if (!Number.isInteger(n) || n <= 0) { showToast('Ingresa una cantidad valida', 'error'); return; }
                    const ok = await addCantidad(itemId, n);
                    showToast(ok ? `+${n} agregado` : 'Error al agregar', ok ? 'success' : 'error');
                  }}
                >
                  <InventoryGrid entries={entries} onSlotClick={(id) => setEditSlot(id)} />
                </div>
              </div>
              <div>
                <h5>Catalogo ({items.length})</h5>
                <div className="jei-grid">
                  {items.map((it) => (
                    <div
                      className="jei-slot"
                      key={it.id}
                      draggable
                      title={it.nombre || it.id}
                      onDragStart={(e) => e.dataTransfer.setData('text/plain', it.id)}
                    >
                      <span className="jei-icon"><McIcon id={iconFor({ full_id: it.full_id, es_materia_prima: it.es_materia_prima })} fallback={it.es_materia_prima ? '🪨' : '🔧'} /></span>
                      <span className="jei-name">{it.nombre || it.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="mc-fld" style={{ marginTop: 10 }}>
              <label>Ingresar cantidad</label>
              <input className="mc-input" type="number" min="1" value={qty} onChange={(e) => setQty(e.target.value)} />
            </div>
            {editSlot && (
              <SlotQuantityEditor
                itemName={(entries.find((e) => e.item_id === editSlot) || {}).nombre || editSlot}
                cantidad={inventario[editSlot] || 0}
                onSave={async (n) => { await setCantidad(editSlot, n); setEditSlot(null); }}
                onCancel={() => setEditSlot(null)}
              />
            )}
          </>
        )}
      </div>
```

- [ ] **Step 3: Build + lint**

Run: `cd D:/proyecto-node/frontend && npm run build && npx oxlint src/components/panel/PerfilPanel.jsx`
Expected: build succeeds; no new errors.

- [ ] **Step 4: Commit**

```bash
cd D:/proyecto-node && git add frontend/src/components/panel/PerfilPanel.jsx && git commit -m "feat: Anadir Items drag-and-drop screen in Perfil"
```

---

### Task 6: End-to-end visual verification

**Files:** (temporary harness, deleted after)
- Create/Delete: `frontend/dev-preview.html`, `frontend/src/dev-preview-main.jsx`
- Scratchpad Playwright script.

- [ ] **Step 1: Run the real backend + a fixture-mock preview**

Because "Anadir Items" needs both catalog (`GET /items`) and user inventory, use the same `window.fetch` mock harness pattern from prior turns: fixture catalog (~12 items with `full_id`) + a mutable inventario object; mock `GET /usuarios/:id` and `PATCH /usuarios/:id/inventario`. Mount `PerfilPanel` (with SessionProvider seeded to a fake user, ItemsProvider, InventarioProvider, ToastProvider).

- [ ] **Step 2: Playwright — drag a catalog slot onto the inventory drop zone**

Set `qty` input to 5, use Playwright `dragAndDrop('.jei-slot >> nth=0', '.inv-drop-zone')`, wait, screenshot. Assert a toast appeared and the inventory grid gained/updated a slot.

- [ ] **Step 3: Look at the screenshot**

Read the PNG. Confirm: left inventory grid shows real icons + counts, right JEI 4-col grid scrolls, quantity input present, drag added the item.

- [ ] **Step 4: Verify "Abrir Inventario" in CrafteosPanel with same mock**

Screenshot the Crafteos modal — confirm it now shows inventory entries (not catalog stock) with icons + counts, and clicking a slot opens the quantity editor.

- [ ] **Step 5: Clean up harness + stop dev server**

Delete `frontend/dev-preview.html` and `frontend/src/dev-preview-main.jsx`; kill the vite process. Confirm `git status` shows no leftover harness files.

- [ ] **Step 6: Commit (only if any non-harness fix was needed)**

If steps surfaced a bug, fix it in the relevant task file and commit. Otherwise no commit.

---

## Notes on existing broken references

Several pre-existing catalog items reference ingredient ids that don't exist as docs (`piedra`, `hierro`, `diamante`, `palo`, `tablones_roble`). The seed uses canonical slugs (`palo`, `piedra`, `diamante`, `lingote_de_hierro`, `tablones_de_roble`) so new recipes are self-consistent. Old docs (`pico_de_piedra` referencing `piedra`, etc.) are left as-is except for stock removal; fixing their recipe references is out of scope (spec: "No se resuelven items huerfanos").
