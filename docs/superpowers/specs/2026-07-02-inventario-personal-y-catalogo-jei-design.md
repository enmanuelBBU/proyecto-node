# Inventario personal + catalogo estilo JEI ("Anadir Items")

## Contexto

Hoy la app tiene una unica coleccion `items` en Firestore que sirve dos
propositos a la vez: (1) diccionario de tipos/recetas de crafteo
(`ingredientes_para_calculo`, `receta_matriz`) y (2) un campo `stock`
que se muestra en "Abrir Inventario" (Crafteos). Ese `stock` es
global (compartido por todos los usuarios) y ya no tiene sentido como
limite real.

Por otro lado ya existe (sin UI) `usuario.inventario`: un mapa
`item_id -> cantidad` por usuario, con endpoints backend funcionando:
`GET /api/usuarios/:id` (devuelve `inventario`) y
`PATCH /api/usuarios/:id/inventario` (fija `cantidad` absoluta de un
`item_id`). Confirmado con la BD real: los 7 usuarios existentes ya
tienen datos en ese campo.

Decision (confirmada con el usuario): el catalogo `items` pasa a ser
solo un diccionario de tipos/recetas, sin limite de stock. El
inventario real y limitado de cada usuario es `usuario.inventario`.
"Abrir Inventario" (Crafteos) y la nueva seccion "Anadir Items"
(Perfil) muestran y editan el mismo dato: el inventario del usuario
logueado.

## Alcance

1. Sembrar el catalogo `items` con ~70 items principales de Minecraft
   (materias primas, herramientas, bloques de utilidad, comida), cada
   uno con un campo nuevo `full_id` (id de Minecraft, ej.
   `minecraft:iron_pickaxe`) para traer su icono real de
   `blocksitems.com`.
2. Quitar el concepto de stock global: los formularios "Nuevo
   Crafteo" y "Editar Crafteo" dejan de pedir/enviar `stock`, y ganan
   un campo opcional `full_id` para que cualquier item creado a mano
   tambien tenga icono real.
3. "Abrir Inventario" (Crafteos) cambia de fuente de datos: en vez del
   catalogo global, muestra `usuario.inventario` del usuario logueado
   (nombre/icono resueltos cruzando con el catalogo). Click en un slot
   permite editar la cantidad de ese item.
4. Nueva seccion "Anadir Items" en Perfil:
   - Izquierda: el mismo grid de inventario del punto 3 (componente
     compartido).
   - Derecha: grid de 4 columnas con TODOS los items del catalogo
     (estilo JEI), con scroll.
   - Abajo: input "Ingresar cantidad" (numero, default 1).
   - Arrastrar un item del catalogo (derecha) al inventario (izquierda)
     suma `cantidad` al valor actual de ese item en
     `usuario.inventario` (crea la entrada si no existia).
   - Click en un slot del inventario (aqui o en Abrir Inventario) abre
     un editor inline para fijar la cantidad manualmente.

## Fuera de alcance

- No se cambia el modelo de recetas/crafteo (`ingredientes_para_calculo`,
  `receta_matriz`) ni la Calculadora de Materiales.
- No se agregan endpoints nuevos al backend; se reutilizan los
  existentes (`GET/PUT /items`, `GET /usuarios/:id`,
  `PATCH /usuarios/:id/inventario`).
- No se implementa busqueda/filtro en el grid JEI (v1 simple, todo el
  catalogo visible con scroll).
- No se resuelven items "huerfanos" en recetas existentes (ej.
  `palo`, `piedra`, `hierro`, `diamante` referenciados pero sin doc
  propio) — se sembraran como parte de los ~70 items nuevos, lo que de
  hecho arregla varios de esos huecos.

## Backend

Sin endpoints nuevos. Se usa:
- `GET /api/items` — catalogo completo (para el grid JEI y para
  resolver nombre/icono de cada `item_id` del inventario).
- `PUT /api/items/:id` — actualizar un item del catalogo (acepta
  `full_id` como cualquier otro campo, merge parcial).
- `GET /api/usuarios/:id` — ya devuelve `inventario`.
- `PATCH /api/usuarios/:id/inventario` — body `{item_id, cantidad}`,
  fija cantidad absoluta. El frontend calcula
  `cantidad_actual + N` antes de llamarlo (no es un incremento
  atomico en el servidor; para este volumen de uso — un usuario
  interactivo arrastrando items uno a la vez — no hace falta
  atomicidad server-side).

## Script de siembra

Nuevo archivo `scripts/seed-items.js`, ejecutado manualmente con
`node scripts/seed-items.js` (no se ejecuta en el arranque de la
app). Usa el SDK admin de Firebase directamente (mismas credenciales
que `index.js`). Escribe con `.set(item, { merge: true })` usando el
mismo esquema de id-desde-nombre que `POST /api/items`, para que sea
idempotente (correrlo dos veces no duplica items).

Contenido: ~70 items curados manualmente cubriendo:
- Materias primas (~28): troncos y tablones (roble), palos, piedra,
  cobblestone, carbon, hierro, oro, diamante, cobre, esmeralda, lapiz,
  redstone, lana, cuero, arena, grava, arcilla, vidrio, obsidiana,
  cuarzo, trigo, semillas.
- Herramientas (~25): pico/hacha/pala/espada/azada en madera, piedra,
  hierro, oro y diamante — con `ingredientes_para_calculo` y
  `receta_matriz` reales (patrones vanilla conocidos), referenciando
  los materiales sembrados arriba.
- Bloques de utilidad (~10): mesa de crafteo, horno, cofre, antorcha,
  puerta, cama, yunque, libreria, tnt, escalera.
- Comida (~7): pan, manzana, carne cocida, zanahoria, papa, melon,
  pastel.

Cada doc lleva `full_id` (id real de Minecraft) para el icono. Se
valida una muestra (5-10 ids) contra el endpoint de iconos de
blocksitems.com antes de sembrar todo; si un id no responde 200 se
ajusta antes de incluirlo.

## Frontend

### Nuevo contexto: `InventarioContext`

Archivo `frontend/src/context/InventarioContext.jsx`, patron identico
a `ItemsContext`:
- Al montar (y cuando cambia `user.id` de `useSession`), hace
  `GET /usuarios/:id` y guarda `inventario` (`{item_id: cantidad}`).
- Expone `reload()` y `setCantidad(item_id, cantidad)` (llama al PATCH
  y actualiza el estado local de forma optimista).
- Si no hay usuario logueado, `inventario` queda `{}` y las pantallas
  que lo usan muestran un mensaje "Inicia sesion para ver tu
  inventario".

Se registra en `App.jsx` junto a `ItemsProvider`.

### Componente compartido: `InventoryGrid`

Nuevo en `shared.jsx` (o archivo propio `InventoryGrid.jsx` dentro de
`panel/`), reemplaza el grid que hoy esta hardcodeado dentro del modal
de "Abrir Inventario":
- Props: `entries` (array `{item_id, cantidad}` ya resueltos con
  `nombre`/`full_id`/`es_materia_prima`), `onSlotClick(item_id)`.
- Renderiza el grid fijo de 9 columnas con relleno de slots vacios
  (igual que ahora), usando `McIcon` con
  `item.full_id || MC_ICONS[categoria]` y fallback a emoji.
- Click en un slot con item dispara `onSlotClick` (para editar
  cantidad).

### Editor de cantidad inline

Pequeno componente `SlotQuantityEditor` (modal chico o fila inline)
que aparece al hacer click en un slot: input numerico + boton
Guardar/Cancelar, llama a `setCantidad` del `InventarioContext`.
Reutilizado desde "Abrir Inventario" y "Anadir Items".

### `CrafteosPanel.jsx` — "Abrir Inventario"

- Deja de usar `items` (catalogo) como fuente del modal; usa
  `InventarioContext` (`inventario`) cruzado con `items` del
  `ItemsContext` para resolver nombre/icono de cada `item_id`.
- El boton "Abrir Inventario" ahora solo dispara `reload()` del
  inventario (ya no hace falta refrescar catalogo completo para esto).
- Nuevo/Editar Crafteo: se quita el campo "Stock Inicial" / "Stock";
  se agrega campo opcional "ID Minecraft (icono)" que setea
  `full_id`.

### `PerfilPanel.jsx` — "Anadir Items"

Nueva tarjeta colapsable (mismo patron acordeon que Crafteos) con:
- Grid izquierdo: `InventoryGrid` (mismo componente/datos que Abrir
  Inventario).
- Grid derecho `.jei-grid` (4 columnas, `overflow-y: auto`, similar a
  `.inv-grid-fixed` pero con `repeat(4, 1fr)`), un slot por item del
  catalogo completo (`useItems().items`), icono `full_id || categoria`
  + nombre truncado debajo, `draggable`.
- Input "Ingresar cantidad" (numero, min 1, default 1) debajo de
  ambos grids.
- Drag and drop nativo HTML5: `onDragStart` en cada slot JEI guarda
  `item_id` en `dataTransfer`; el contenedor del grid izquierdo tiene
  `onDragOver` (preventDefault, resalta borde) y `onDrop` (lee
  `item_id`, calcula `cantidad_actual + N`, llama `setCantidad`,
  muestra toast "Item agregado").

### CSS

- `.jei-grid`, `.jei-slot` (variante de `.inv-slot` con nombre debajo,
  `cursor: grab`).
- `.inv-drop-zone.drag-over` (borde resaltado durante drag).
- Reutiliza `.inv-modal-*`, `.inv-slot`, `.inv-grid-fixed` ya
  existentes.

## Errores y casos borde

- Usuario no logueado: ambas pantallas muestran mensaje y ocultan el
  grid de inventario (el grid JEI de catalogo si se puede ver sin
  sesion, solo no se puede arrastrar).
- Cantidad invalida en el input ("Ingresar cantidad" vacio, 0 o
  negativo): drop no hace nada, toast de error.
- Item del inventario cuyo `item_id` ya no existe en el catalogo
  (borrado): el slot se muestra igual con el `item_id` crudo como
  nombre y icono de fallback por categoria `elaborado`.
- Fallo de red al guardar cantidad: revertir el cambio optimista y
  mostrar toast de error.

## Testing

- Manual: build + lint limpios (`npm run build`, `npx oxlint`).
- Verificacion visual con Playwright headless igual que en cambios
  anteriores (mock del contexto de items/inventario, screenshot del
  drag-and-drop y del grid JEI con iconos reales).
- Prueba puntual del script de siembra contra la BD real (ya
  verificado acceso de lectura; la escritura se corre una vez y se
  confirma releyendo el conteo de items).
