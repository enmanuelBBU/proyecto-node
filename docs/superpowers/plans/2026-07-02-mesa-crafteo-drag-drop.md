# Mesa de Crafteo Drag & Drop Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the 9 per-slot `<select>` dropdowns in the crafting-table grid (`CraftGrid`) with drag & drop, sourced from draggable icons on `IngredientRows`, in both "Nuevo Crafteo" and "Editar Crafteo" sections of `CrafteosPanel.jsx`.

**Architecture:** `IngredientRows` (in `frontend/src/components/panel/shared.jsx`) renders a small draggable `McIcon` next to any row that has an item selected. `CraftGrid` (same file) becomes 9 HTML5 drop zones; each slot accepts a drop (sets `receta_matriz[i]` to the dropped `item_id`, replacing whatever was there), and shows a "✕" button to clear an occupied slot. No backend changes. `CrafteosPanel.jsx` is untouched — same props flow into both components.

**Tech Stack:** React 19 (function components, hooks), plain CSS (no CSS framework), native HTML5 Drag and Drop API (`draggable`, `onDragStart`, `onDragOver`, `onDrop`, `dataTransfer.setData/getData('text/plain', ...)`) — same pattern already used in `PerfilPanel.jsx`'s inventory drag & drop.

## Global Constraints

- No test framework exists in `frontend/` (`package.json` has no jest/vitest) — verification is manual, via `npm run dev` and browser interaction, not automated tests.
- Drag data format: `text/plain` carrying the raw `item_id` string — matches the existing convention in `PerfilPanel.jsx:195` (`e.dataTransfer.setData('text/plain', it.id)`).
- Reuse existing CSS custom properties (`--mc-green`, `--mc-red`, `--mc-border-dark`, `--mc-border-light`, `--mc-panel-light`) — do not introduce new colors.
- `receta_matriz` stays an array of 9 `item_id | null` — no data-shape changes. `ingredientes_para_calculo` stays fully independent (quantity is never used to fill grid slots).
- Props signatures of `IngredientRows` and `CraftGrid` must stay identical to what `CrafteosPanel.jsx` already passes (`{ rows, setRows, items, addLabel }` and `{ slots, setSlots, items, idPrefix }` respectively) — zero changes to `CrafteosPanel.jsx`.

---

### Task 1: CSS for drag-over highlight, clear button, ingredient drag icon

**Files:**
- Modify: `frontend/src/index.css:306-323` (`.craft-grid` / `.craft-slot` block)

**Interfaces:**
- Produces: CSS classes `.craft-slot.drag-over`, `.craft-slot .slot-clear-btn`, `.ingredient-drag-icon` — consumed by Task 2 and Task 3.

- [ ] **Step 1: Replace the `.craft-slot` block**

Find this existing block (lines 306-323):

```css
.craft-grid {
  display: grid; grid-template-columns: repeat(3, 56px);
  gap: 4px; justify-content: center; margin: 8px 0;
}
.craft-slot {
  width: 56px; height: 56px;
  background: var(--mc-bg);
  border: 3px solid var(--mc-border-dark);
  box-shadow: inset 2px 2px 0 rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: pointer; transition: border-color 0.15s;
}
.craft-slot:hover { border-color: var(--mc-border-light); }
.craft-slot select {
  width: 100%; height: 100%; background: transparent; border: none;
  color: var(--mc-green); font-family: var(--font-mc);
  font-size: 0.45rem; text-align: center; outline: none;
}
```

Replace it with:

```css
.craft-grid {
  display: grid; grid-template-columns: repeat(3, 56px);
  gap: 4px; justify-content: center; margin: 8px 0;
}
.craft-slot {
  position: relative;
  width: 56px; height: 56px;
  background: var(--mc-bg);
  border: 3px solid var(--mc-border-dark);
  box-shadow: inset 2px 2px 0 rgba(0,0,0,0.4);
  display: flex; align-items: center; justify-content: center;
  cursor: default; transition: border-color 0.15s;
}
.craft-slot:hover { border-color: var(--mc-border-light); }
.craft-slot.drag-over { outline: 3px solid var(--mc-green); outline-offset: 2px; }
.craft-slot .slot-clear-btn {
  position: absolute; top: -6px; right: -6px;
  width: 16px; height: 16px; line-height: 14px;
  padding: 0; font-size: 0.4rem;
  background: var(--mc-red); color: #FFF;
  border: 1px solid #000; cursor: pointer;
}
.ingredient-drag-icon {
  width: 30px; height: 30px; flex-shrink: 0;
  display: flex; align-items: center; justify-content: center;
  background: var(--mc-panel-light);
  border: 2px solid var(--mc-border-dark);
  box-shadow: inset -1px -1px 0 rgba(0,0,0,0.3), inset 1px 1px 0 rgba(255,255,255,0.04);
  cursor: grab;
}
.ingredient-drag-icon:active { cursor: grabbing; }
```

(`.craft-slot select` rule is removed — the grid no longer contains `<select>` elements.)

- [ ] **Step 2: Visual sanity check**

Run: `cd frontend && npm run dev`
Open the printed local URL in a browser. No visual change expected yet (components still use old markup) — this step only confirms Vite picks up the CSS change without errors (no red overlay/error screen).

- [ ] **Step 3: Commit**

```bash
cd D:\proyecto-node
git add frontend/src/index.css
git commit -m "style: add craft-slot drag-over, clear button, ingredient drag icon CSS"
```

---

### Task 2: Draggable icon on `IngredientRows`

**Files:**
- Modify: `frontend/src/components/panel/shared.jsx:126-155` (`IngredientRows` function)

**Interfaces:**
- Consumes: `iconFor(item)` and `McIcon` (both already defined earlier in `shared.jsx`), CSS class `.ingredient-drag-icon` from Task 1.
- Produces: no new exports — same `IngredientRows({ rows, setRows, items, addLabel })` signature. Each row's drag source sets `dataTransfer` `text/plain` to `row.itemId`, consumed by Task 3's `CraftGrid`.

- [ ] **Step 1: Replace `IngredientRows`**

Find the existing function (lines 126-155):

```jsx
export function IngredientRows({ rows, setRows, items, addLabel = '+ Agregar Ingrediente' }) {
  function updateRow(idx, field, value) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function removeRow(idx) {
    setRows(rows.filter((_, i) => i !== idx));
  }
  function addRow() {
    setRows([...rows, { itemId: '', cantidad: 1 }]);
  }
  return (
    <>
      {rows.map((row, idx) => (
        <div className="mc-fld-row" style={{ marginBottom: 4 }} key={idx}>
          <div className="mc-fld" style={{ flex: 1 }}>
            <select className="mc-input" value={row.itemId} onChange={(e) => updateRow(idx, 'itemId', e.target.value)}>
              <option value="">Item...</option>
              {items.map((item) => <option key={item.id} value={item.id}>{item.nombre || item.id}</option>)}
            </select>
          </div>
          <div className="mc-fld" style={{ maxWidth: 80 }}>
            <input className="mc-input" type="number" min="1" value={row.cantidad} onChange={(e) => updateRow(idx, 'cantidad', e.target.value)} />
          </div>
          <button className="mc-btn red sm" style={{ padding: '6px 8px', fontSize: '0.5rem' }} onClick={() => removeRow(idx)}>X</button>
        </div>
      ))}
      <button className="mc-btn sm" style={{ marginBottom: 10 }} onClick={addRow}>{addLabel}</button>
    </>
  );
}
```

Replace it with:

```jsx
export function IngredientRows({ rows, setRows, items, addLabel = '+ Agregar Ingrediente' }) {
  function updateRow(idx, field, value) {
    setRows(rows.map((r, i) => (i === idx ? { ...r, [field]: value } : r)));
  }
  function removeRow(idx) {
    setRows(rows.filter((_, i) => i !== idx));
  }
  function addRow() {
    setRows([...rows, { itemId: '', cantidad: 1 }]);
  }
  const byId = {};
  for (const it of items) byId[it.id] = it;
  return (
    <>
      {rows.map((row, idx) => {
        const item = row.itemId ? byId[row.itemId] : null;
        return (
          <div className="mc-fld-row" style={{ marginBottom: 4, alignItems: 'center' }} key={idx}>
            {item && (
              <div
                className="ingredient-drag-icon"
                draggable
                title={`Arrastrar ${item.nombre || item.id} a la receta`}
                onDragStart={(e) => e.dataTransfer.setData('text/plain', row.itemId)}
              >
                <McIcon id={iconFor(item)} fallback={item.es_materia_prima ? '🪨' : '🔧'} />
              </div>
            )}
            <div className="mc-fld" style={{ flex: 1 }}>
              <select className="mc-input" value={row.itemId} onChange={(e) => updateRow(idx, 'itemId', e.target.value)}>
                <option value="">Item...</option>
                {items.map((it) => <option key={it.id} value={it.id}>{it.nombre || it.id}</option>)}
              </select>
            </div>
            <div className="mc-fld" style={{ maxWidth: 80 }}>
              <input className="mc-input" type="number" min="1" value={row.cantidad} onChange={(e) => updateRow(idx, 'cantidad', e.target.value)} />
            </div>
            <button className="mc-btn red sm" style={{ padding: '6px 8px', fontSize: '0.5rem' }} onClick={() => removeRow(idx)}>X</button>
          </div>
        );
      })}
      <button className="mc-btn sm" style={{ marginBottom: 10 }} onClick={addRow}>{addLabel}</button>
    </>
  );
}
```

- [ ] **Step 2: Manual verification**

Run: `cd frontend && npm run dev` (skip if already running from Task 1).
In the browser: open the app, log in, go to the Crafteos panel, open "Nuevo Crafteo", click "+ Agregar Ingrediente", pick any item from the row's dropdown.
Expected: a small icon box (grab cursor on hover) appears to the left of that row. Rows with no item selected yet show no icon.

- [ ] **Step 3: Commit**

```bash
cd D:\proyecto-node
git add frontend/src/components/panel/shared.jsx
git commit -m "feat: add draggable icon to selected ingredient rows"
```

---

### Task 3: `CraftGrid` as drop zones with replace + clear

**Files:**
- Modify: `frontend/src/components/panel/shared.jsx:157-176` (`CraftGrid` function)

**Interfaces:**
- Consumes: `useState` (already imported at top of `shared.jsx`), `McIcon`, `iconFor`, CSS classes `.craft-slot.drag-over` / `.craft-slot .slot-clear-btn` from Task 1, drag data (`text/plain` = `item_id`) produced by Task 2.
- Produces: no new exports — same `CraftGrid({ slots, setSlots, items, idPrefix })` signature used by `CrafteosPanel.jsx` (`nSlots/setNSlots`, `uSlots/setUSlots`).

- [ ] **Step 1: Replace `CraftGrid`**

Find the existing function (lines 157-176):

```jsx
export function CraftGrid({ slots, setSlots, items, idPrefix }) {
  return (
    <div className="craft-grid">
      {slots.map((val, i) => (
        <div className="craft-slot" key={i}>
          <select
            id={`${idPrefix}-slot-${i}`}
            className="mc-input"
            style={{ width: '100%', height: '100%', border: 'none', background: 'transparent', fontSize: '0.4rem' }}
            value={val || ''}
            onChange={(e) => setSlots(slots.map((s, si) => (si === i ? (e.target.value || null) : s)))}
          >
            <option value="">-</option>
            {items.map((item) => <option key={item.id} value={item.id}>{item.nombre || item.id}</option>)}
          </select>
        </div>
      ))}
    </div>
  );
}
```

Replace it with:

```jsx
export function CraftGrid({ slots, setSlots, items, idPrefix }) {
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const byId = {};
  for (const it of items) byId[it.id] = it;

  function clearSlot(i) {
    setSlots(slots.map((s, si) => (si === i ? null : s)));
  }

  function dropOnSlot(i, e) {
    e.preventDefault();
    setDragOverIdx(null);
    const itemId = e.dataTransfer.getData('text/plain');
    if (!itemId) return;
    setSlots(slots.map((s, si) => (si === i ? itemId : s)));
  }

  return (
    <div className="craft-grid">
      {slots.map((val, i) => {
        const item = val ? byId[val] : null;
        return (
          <div
            className={`craft-slot${dragOverIdx === i ? ' drag-over' : ''}`}
            key={i}
            id={`${idPrefix}-slot-${i}`}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(i); }}
            onDragLeave={() => setDragOverIdx((cur) => (cur === i ? null : cur))}
            onDrop={(e) => dropOnSlot(i, e)}
          >
            {item && (
              <>
                <McIcon id={iconFor(item)} fallback={item.es_materia_prima ? '🪨' : '🔧'} />
                <button
                  type="button"
                  className="slot-clear-btn"
                  title="Quitar de la receta"
                  onClick={() => clearSlot(i)}
                >✕</button>
              </>
            )}
          </div>
        );
      })}
    </div>
  );
}
```

- [ ] **Step 2: Manual verification — full flow**

Run: `cd frontend && npm run dev` (skip if already running).
In the browser, Crafteos panel → "Nuevo Crafteo":

1. Add two ingredient rows, pick two different items (e.g. cobblestone-type and stick-type), each shows its drag icon.
2. Drag the first icon onto grid slot 0 (top-left). Expected: slot 0 shows that item's icon; hovering during drag shows green outline on slot 0.
3. Drag the same icon onto slot 1. Expected: slot 1 now also shows that item (reuse confirmed — icon still draggable after first drop).
4. Drag the second ingredient's icon onto slot 0 (already occupied). Expected: slot 0 now shows the second item — replaced, no confirmation prompt.
5. Click the "✕" button on slot 1. Expected: slot 1 becomes empty (no icon, no button).
6. Click "Craftear" with the grid partially filled and at least one ingredient row filled. Expected: request succeeds (same as before — `receta_matriz` array shape unchanged, verify via network tab or the success toast).

Repeat steps 1-5 in "Editar Crafteo" section (select an existing item first) to confirm identical behavior with `idPrefix="upd"`.

- [ ] **Step 3: Commit**

```bash
cd D:\proyecto-node
git add frontend/src/components/panel/shared.jsx
git commit -m "feat: drag & drop crafting grid slots (replace on drop, clear button, reusable ingredients)"
```

---

### Task 4: Lint check

**Files:**
- None (verification only)

**Interfaces:**
- Consumes: final state of `frontend/src/components/panel/shared.jsx` and `frontend/src/index.css` from Tasks 1-3.

- [ ] **Step 1: Run the project linter**

Run: `cd frontend && npm run lint`
Expected: no errors related to `shared.jsx` (pre-existing unrelated warnings elsewhere, if any, are out of scope).

- [ ] **Step 2: Fix any lint errors introduced by this change**

If `oxlint` flags something in `shared.jsx` (e.g. unused variable), fix it directly in that file, matching the surrounding code style.

- [ ] **Step 3: Commit (only if Step 2 made changes)**

```bash
cd D:\proyecto-node
git add frontend/src/components/panel/shared.jsx
git commit -m "fix: address lint findings in shared.jsx drag & drop changes"
```
