const admin = require('firebase-admin');
const path = require('path');

// Buscar el archivo de credenciales (mismo patron que migrate-passwords.js)
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

// Mismo algoritmo de id que POST /api/items
function slug(nombre) {
  return nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/ /g, '_');
}

// mp = materia prima
const mp = (nombre, full_id, categoria = 'materias_primas') =>
  ({ nombre, full_id, categoria, es_materia_prima: true, receta_matriz: [], ingredientes_para_calculo: [] });
// el = elaborado (receta_matriz de 9 slots con slugs|null, lista de ingredientes)
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
  mp('Papel', 'minecraft:paper'),
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
    [{ item_id: 'tablones_de_roble', cantidad: 6 }, { item_id: 'papel', cantidad: 3 }]),
  el('TNT', 'minecraft:tnt', 'utilidad',
    ['polvora', 'arena', 'polvora', 'arena', 'polvora', 'arena', 'polvora', 'arena', 'polvora'],
    [{ item_id: 'polvora', cantidad: 5 }, { item_id: 'arena', cantidad: 4 }]),
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
  // ---- Armadura ----
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
  mp('Leche', 'minecraft:milk_bucket', 'comida'),
  mp('Azucar', 'minecraft:sugar', 'comida'),
  mp('Huevo', 'minecraft:egg', 'comida'),
  el('Pan', 'minecraft:bread', 'comida',
    ['trigo', 'trigo', 'trigo', null, null, null, null, null, null],
    [{ item_id: 'trigo', cantidad: 3 }]),
  el('Pastel', 'minecraft:cake', 'comida',
    ['leche', 'leche', 'leche', 'azucar', 'huevo', 'azucar', 'trigo', 'trigo', 'trigo'],
    [{ item_id: 'leche', cantidad: 3 }, { item_id: 'azucar', cantidad: 2 }, { item_id: 'huevo', cantidad: 1 }, { item_id: 'trigo', cantidad: 3 }]),
];

async function seed() {
  const batch = db.batch();
  for (const item of ITEMS) {
    batch.set(db.collection('items').doc(slug(item.nombre)), item, { merge: true });
  }
  await batch.commit();
  console.log(`Sembrados/actualizados: ${ITEMS.length} items`);

  // Eliminar el campo stock de todos los docs del catalogo
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
