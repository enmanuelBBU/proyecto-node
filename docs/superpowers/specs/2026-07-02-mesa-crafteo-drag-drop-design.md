# Mesa de crafteo drag & drop — diseño

## Contexto

`CrafteosPanel.jsx` tiene dos secciones ("Nuevo Crafteo" y "Editar Crafteo") que usan `CraftGrid` (`shared.jsx`): un grid 3x3 donde cada casilla es un `<select>` para elegir el item de esa posición (`receta_matriz`). Aparte, `IngredientRows` gestiona una lista independiente de `{item_id, cantidad}` (`ingredientes_para_calculo`), usada por la calculadora de materiales.

Objetivo: reemplazar los selects del grid por interacción drag & drop, reusando los patrones visuales ya existentes en `PerfilPanel.jsx` (paleta arrastrable tipo `jei-slot`, drop zone tipo `inv-drop-zone`).

## Alcance

- Afecta solo `receta_matriz` (grid 3x3) en "Nuevo Crafteo" y "Editar Crafteo".
- `ingredientes_para_calculo` (lista de `IngredientRows`) no cambia de comportamiento ni de datos — sigue siendo independiente del grid.
- No toca backend ni otros paneles (`ConstruccionesPanel`, `PerfilPanel`).

## Componentes

### `IngredientRows` (modificado, en `shared.jsx`)

Se mantiene la fila actual (select item + input cantidad + botón quitar). Se agrega: cuando `row.itemId` tiene valor, se renderiza junto a la fila un icono chico draggable (`McIcon`, mismo patrón que `.jei-slot`: `draggable`, `cursor: grab`, `onDragStart` setea `item_id` en `dataTransfer`).

Este icono es la única fuente de items arrastrables hacia el grid — no hay paleta separada.

### `CraftGrid` (reescrito, en `shared.jsx`)

Cambia de 9 `<select>` a 9 drop zones (mismo tamaño/estilo que `.craft-slot` actual):

- Slot vacío (`slots[i] === null`): zona de drop. `onDragOver` resalta borde (clase `drag-over`, mismo criterio visual que `.inv-drop-zone.drag-over`). `onDrop` lee `item_id` del `dataTransfer` y hace `setSlots` asignando esa posición.
- Slot ocupado: muestra `McIcon` del item asignado + botón pequeño "✕" superpuesto (esquina). Clic en "✕" limpia la posición (`null`). El slot ocupado también acepta nuevos drops (reemplaza el item existente sin necesidad de vaciar antes).
- Un ingrediente es reutilizable: arrastrarlo a una casilla no lo remueve de `IngredientRows` ni deshabilita su icono — se puede arrastrar a más de una casilla (igual que Minecraft real, ej. 8 cobblestone en 8 casillas).

Firma de props se mantiene igual: `{ slots, setSlots, items, idPrefix }` — `items` se usa para resolver `full_id`/`es_materia_prima` del item en cada slot ocupado (para `McIcon`/`iconFor`).

### `CrafteosPanel.jsx`

Sin cambios de lógica — sigue pasando `nSlots/setNSlots` y `uSlots/setUSlots` a `CraftGrid`, y `nIngredientes/setNIngredientes`, `uIngredientes/setUIngredientes` a `IngredientRows`. Solo cambia el comportamiento visual/interactivo de esos dos componentes hijos.

## CSS

Reusa clases existentes donde aplique (`.craft-slot`, `.jei-slot .jei-icon`, `.inv-drop-zone.drag-over` como referencia de highlight). Se agregan clases nuevas puntuales:

- `.craft-slot.drag-over` — mismo tratamiento que `.inv-drop-zone.drag-over` (outline verde), aplicado a `.craft-slot` individual en vez de un contenedor.
- `.craft-slot .slot-clear-btn` — botón "✕" pequeño, posición absoluta esquina superior derecha del slot, visible solo si el slot tiene item.
- `.ingredient-drag-icon` — icono chico junto a cada fila de `IngredientRows`, `cursor: grab`, tamaño similar a `.jei-slot .jei-icon`.

## Fuera de alcance

- No se valida que la cantidad de casillas ocupadas por un item coincida con su `cantidad` en `ingredientes_para_calculo` (son datos independientes, confirmado en brainstorming).
- No se agrega drag-out (arrastrar desde el grid hacia afuera) — remover una casilla es solo vía botón "✕".
- No cambia el modelo de datos de `receta_matriz` (sigue siendo array de 9 `item_id|null`) ni de `ingredientes_para_calculo`.
