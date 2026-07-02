import { useState } from 'react';

const MC_ICON_BASE = 'https://blocksitems.com/api/v1/items';

export const MC_ICONS = {
  materiaPrima: 'minecraft:cobblestone',
  elaborado: 'minecraft:iron_pickaxe',
  material: 'minecraft:chest',
  perfil: 'minecraft:player_head',
  construccion: 'minecraft:scaffolding',
};

export function McIcon({ id, size = 64, fallback, className = '' }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <span className={className}>{fallback}</span>;
  return (
    <img
      className={`mc-icon-img ${className}`}
      src={`${MC_ICON_BASE}/${id}/icon?size=${size}`}
      alt=""
      onError={() => setFailed(true)}
    />
  );
}

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

export function ResultBox({ result }) {
  if (!result) return null;
  return (
    <div className={`mc-result visible ${result.type}`}>
      {typeof result.content === 'string' ? result.content : <FormatOutput data={result.content} />}
    </div>
  );
}

export function FormatOutput({ data }) {
  if (!data) return <span style={{ color: 'var(--mc-text-muted)' }}>Sin datos</span>;
  if (typeof data === 'string') return data;
  return (
    <div style={{ textAlign: 'left' }}>
      {data.mensaje && <div style={{ color: 'var(--mc-green)', marginBottom: 4 }}>{data.mensaje}</div>}
      {data.id !== undefined && <div style={{ color: 'var(--mc-text-muted)', fontSize: '0.55rem' }}>ID: {data.id}</div>}
      {(data.nombre || data.item) && <div style={{ color: '#FFF', fontSize: '0.7rem' }}>{data.nombre || data.item}</div>}
      {data.es_materia_prima !== undefined && (
        <div>Tipo: {data.es_materia_prima ? <span className="tag prima">PRIMA</span> : <span className="tag elaborado">ELABORADO</span>}</div>
      )}
      {data.stock !== undefined && <div>Stock: {data.stock}</div>}
      {data.email && <div style={{ color: 'var(--mc-text-muted)', fontSize: '0.55rem' }}>Email: {data.email}</div>}
      {data.estado && <div>Estado: {data.estado}</div>}
      {data.proyectos_eliminados !== undefined && <div>Proyectos eliminados: {data.proyectos_eliminados}</div>}
      {data.item_id && <div style={{ color: 'var(--mc-text-muted)', fontSize: '0.55rem' }}>Item ID: {data.item_id}</div>}
      {data.cantidad_total_proyecto !== undefined && <div>Cantidad en proyecto: {data.cantidad_total_proyecto}</div>}
    </div>
  );
}

export function ItemSelect({ value, onChange, items, placeholder }) {
  return (
    <select className="mc-input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">{placeholder || 'Seleccionar...'}</option>
      {items.map((item) => (
        <option key={item.id} value={item.id}>{item.nombre || item.id}</option>
      ))}
    </select>
  );
}

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
