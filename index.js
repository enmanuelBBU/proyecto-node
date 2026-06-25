require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');
const path = require('path');

const serviceAccount = require('./craftbuild-63e96-firebase-adminsdk-fbsvc-fa3cd2b205.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// --- Helpers ---

function formatFirestoreDate(dateOrTimestamp) {
  if (!dateOrTimestamp) return null;
  let date;
  if (typeof dateOrTimestamp.toDate === 'function') {
    date = dateOrTimestamp.toDate();
  } else if (dateOrTimestamp instanceof Date) {
    date = dateOrTimestamp;
  } else if (typeof dateOrTimestamp === 'string') {
    date = new Date(dateOrTimestamp);
  } else if (dateOrTimestamp._seconds !== undefined) {
    date = new Date(dateOrTimestamp._seconds * 1000);
  } else {
    return dateOrTimestamp;
  }
  if (isNaN(date.getTime())) return dateOrTimestamp;
  const months = ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre'];
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  let hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2,'0');
  const seconds = String(date.getSeconds()).padStart(2,'0');
  const ampm = hours >= 12 ? 'p.m.' : 'a.m.';
  hours = hours % 12 || 12;
  return `${day} de ${month} de ${year} a las ${hours}:${minutes}:${seconds} ${ampm}`;
}

function formatDocumentData(data) {
  if (!data) return data;
  if (typeof data.toDate === 'function') return formatFirestoreDate(data);
  if (Array.isArray(data)) return data.map(item => formatDocumentData(item));
  if (typeof data === 'object') {
    const formatted = {};
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const val = data[key];
        if (val && typeof val === 'object' && val._seconds !== undefined) {
          formatted[key] = formatFirestoreDate(val);
        } else {
          formatted[key] = formatDocumentData(val);
        }
      }
    }
    return formatted;
  }
  return data;
}

function validateRecetaMatriz(receta) {
  if (receta === undefined || receta === null) return true;
  if (!Array.isArray(receta)) return false;
  if (receta.length !== 9) return false;
  return receta.every(elem => elem === null || typeof elem === 'string');
}

function validateIngredientes(ingredientes) {
  if (ingredientes === undefined || ingredientes === null) return true;
  if (!Array.isArray(ingredientes)) return false;
  return ingredientes.every(ing =>
    ing && typeof ing === 'object' &&
    typeof ing.item_id === 'string' &&
    typeof ing.cantidad === 'number' &&
    ing.cantidad > 0
  );
}

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Endpoint GET simple para verificar la conexión
app.get('/api/datos', async (req, res) => {
  try {


    res.status(200).json({
      mensaje: '¡Hola! La conexión a la base de datos (Firebase) ha sido inicializada correctamente.',
      estado: 'OK',
      firebaseAppName: admin.app().name
    });

  } catch (error) {
    console.error('Error al acceder a la base de datos:', error);
    res.status(500).json({ error: 'Error del servidor al intentar leer los datos.' });
  }
});

// Endpoint POST para agregar o sobreescribir items
app.post('/api/items', async (req, res) => {
  try {
    const item = req.body;

    if (!item.nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es requerido' });
    }

    const docId = item.nombre
      .toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/ /g, '_');

    await db.collection('items').doc(docId).set(item);

    res.status(201).json({
      mensaje: 'Item guardado exitosamente',
      id: docId,
      data: item
    });
  } catch (error) {
    console.error('Error al guardar el item:', error);
    res.status(500).json({ error: 'Error del servidor al intentar guardar el item' });
  }
});

// Endpoint para borrar un item
app.delete('/api/items/:item_id', async (req, res) => {
  try {
    const { item_id } = req.params;
    const docRef = db.collection('items').doc(item_id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    await docRef.delete();

    res.status(200).json({
      mensaje: 'Item eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error al eliminar el item:', error);
    res.status(500).json({ error: 'Error al intentar eliminar el item' + error.message });
  }
});

// Endpoint POST para ingresar un proyecto (ID automático de Firebase)
app.post('/api/proyectos', async (req, res) => {
  try {
    const { nombre_proyecto, usuario_id, estado, objetivos, fecha_creacion } = req.body;

    if (!nombre_proyecto || !usuario_id || !estado || !objetivos) {
      return res.status(400).json({
        error: 'Los campos "nombre_proyecto", "usuario_id", "estado" y "objetivos" son requeridos'
      });
    }

    const estadosPermitidos = ['pendiente', 'en progreso', 'completado'];
    if (!estadosPermitidos.includes(estado.toLowerCase())) {
      return res.status(400).json({
        error: `El campo "estado" debe ser uno de: ${estadosPermitidos.join(', ')}`
      });
    }

    if (!Array.isArray(objetivos) || objetivos.length === 0) {
      return res.status(400).json({
        error: 'El campo "objetivos" debe ser un arreglo con al menos un elemento'
      });
    }

    const proyecto = {
      nombre_proyecto,
      usuario_id,
      estado: estado.toLowerCase(),
      fecha_creacion: fecha_creacion || new Date().toISOString(),
      objetivos
    };

    const docRef = await db.collection('proyectos').add(proyecto);

    res.status(201).json({
      mensaje: 'Proyecto creado exitosamente',
      id: docRef.id,
      data: proyecto
    });
  } catch (error) {
    console.error('Error al crear el proyecto:', error);
    res.status(500).json({ error: 'Error del servidor al intentar crear el proyecto' });
  }
});

// Endpoint para borrar un proyecto
app.delete('/api/proyectos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const docRef = db.collection('proyectos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    await docRef.delete();

    res.status(200).json({
      mensaje: 'Proyecto eliminado exitosamente',
    });

  } catch (error) {
    console.error('Error al eliminar el proyecto:', error);
    res.status(500).json({ error: 'Error al intentar eliminar el proyecto' + error.message });
  }
});


//Endpoint PATCH para editar el nombre del proyecto
app.patch('/api/editar/nombre/:id', async (req, res) => {
  try{

    const id = req.params.id;
    const nombre_proyecto = req.body.nombre_proyecto;
    const docRef = db.collection('proyectos').doc(id);

    if(nombre_proyecto === undefined){
      return res.status(400).json({ mensaje: 'El campo nombre_proyecto es requerido' });
    }

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
    }

    await docRef.update({ nombre_proyecto: nombre_proyecto });

    res.json({ 
      mensaje: 'Nombre del proyecto actualizado exitosamente',
      nombre_proyecto: nombre_proyecto
    });

  }catch (error){
    res.status(500).json({ error: 'Error del servidor al intentar actualizar el nombre del proyecto'+ error.message });
  }

});

//Endpoint PATCH para editar el estado del proyecto
app.patch('/api/editar/estado/:id', async (req, res) => {
  try{

    const id = req.params.id;
    const estado = req.body.estado;
    const docRef = db.collection('proyectos').doc(id);

    if(estado === undefined){
      return res.status(400).json({ mensaje: 'El campo "estado" es requerido' });
    }

    const estadosValidos = ['pendiente', 'en_progreso', 'completado'];

    if (!estadosValidos.includes(estado)) {
      return res.status(400).json({ mensaje: 'El campo "estado" debe ser pendiente, en_progreso o completado' });
    }

    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ mensaje: 'Proyecto no encontrado' });
    }

    if (doc.data().estado === estado) {
      return res.status(400).json({
        mensaje: "El proyecto ya tiene ese estado"
      });
    }

    await docRef.update({ estado: estado });

    res.json({ 
      mensaje: 'Estado del proyecto actualizado exitosamente',
      estado: estado
    });

  }catch (error){
    res.status(500).json({ error: 'Error del servidor al intentar actualizar el estado del proyecto'+ error.message });
  }
});

//Endpoint para Obtener todos los ítems   
app.get('/api/items', async (req, res) => {
  try {
    const snapshot = await db.collection('items').get();
    const items = [];
    snapshot.forEach(doc => {
      items.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(items);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener los items',
      detalle: error.message
    });
  }
});

//Calcular materiales de un crafteo    
app.get('/api/items/:id/materiales', async (req, res) => {
  try {
    const { id } = req.params;
    const snapshot = await db.collection('items').doc(id).get();

    if (!snapshot.exists) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    const item = snapshot.data();

    const materialesRequeridos = item.ingredientes_para_calculo || [];

    const respuesta = {
      item: item.nombre,
      id: id,
      es_materia_prima: item.es_materia_prima || false,
      materiales: materialesRequeridos
    };

    // Si no es materia prima y tiene una matriz de crafteo, la añadimos a la respuesta
    if (!item.es_materia_prima && item.receta_matriz) {
      respuesta.receta_matriz = item.receta_matriz;
    }

    res.status(200).json(respuesta);
  } catch (error) {
    res.status(500).json({
      error: 'Error al calcular materiales',
      detalle: error.message
    });
  }
});

// Endpoint PUT para actualizar un item
app.put('/api/items/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const itemData = req.body;

    const docRef = db.collection('items').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }

    await docRef.update(itemData);

    res.status(200).json({
      mensaje: 'Item actualizado exitosamente',
      id: id,
      data: itemData
    });
  } catch (error) {
    console.error('Error al actualizar el item:', error);
    res.status(500).json({ error: 'Error del servidor al intentar actualizar el item' });
  }
});

// Endpoint PUT para actualizar un proyecto
app.put('/api/proyectos/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const proyectoData = req.body;

    const docRef = db.collection('proyectos').doc(id);
    const doc = await docRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }

    // Validar estado si está presente en la petición
    if (proyectoData.estado) {
      const estadosPermitidos = ['pendiente', 'en progreso', 'completado'];
      if (!estadosPermitidos.includes(proyectoData.estado.toLowerCase())) {
        return res.status(400).json({
          error: `El campo "estado" debe ser uno de: ${estadosPermitidos.join(', ')}`
        });
      }
      proyectoData.estado = proyectoData.estado.toLowerCase();
    }

    await docRef.update(proyectoData);

    res.status(200).json({
      mensaje: 'Proyecto actualizado exitosamente',
      id: id,
      data: proyectoData
    });
  } catch (error) {
    console.error('Error al actualizar el proyecto:', error);
    res.status(500).json({ error: 'Error del servidor al intentar actualizar el proyecto' });
  }
});


// Endpoint para obtener todos los proyectos
app.get('/api/proyectos', async (req, res) => {
  try {
    const snapshot = await db.collection('proyectos').get();
    const proyectos = [];
    snapshot.forEach(doc => {
      proyectos.push({ id: doc.id, ...doc.data() });
    });
    res.status(200).json(proyectos);
  } catch (error) {
    res.status(500).json({
      error: 'Error al obtener los proyectos',
      detalle: error.message
    });
  }
});

// ===================== NUEVOS ENDPOINTS =====================

// 0. GET /api/usuarios — Obtener todos los usuarios
app.get('/api/usuarios', async (req, res) => {
  try {
    const snapshot = await db.collection('usuario').get();
    const usuarios = [];
    snapshot.forEach(doc => {
      usuarios.push({ id: doc.id, ...formatDocumentData(doc.data()) });
    });
    res.status(200).json(usuarios);
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    res.status(500).json({ error: 'Error del servidor al obtener los usuarios' });
  }
});

// 1. GET /api/usuarios/:id — Obtener usuario por ID
app.get('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const doc = await db.collection('usuario').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    res.status(200).json({ id: doc.id, ...formatDocumentData(doc.data()) });
  } catch (error) {
    console.error('Error al obtener usuario:', error);
    res.status(500).json({ error: 'Error del servidor al intentar obtener el usuario' });
  }
});

// 2. GET /api/proyectos/:id/items — Obtener items de un proyecto
app.get('/api/proyectos/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const proyectoDoc = await db.collection('proyectos').doc(id).get();
    if (!proyectoDoc.exists) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const proyecto = proyectoDoc.data();
    const objetivos = proyecto.objetivos || [];
    const itemsPromises = objetivos.map(async (obj) => {
      const itemDoc = await db.collection('items').doc(obj.item_id).get();
      if (itemDoc.exists) {
        return { ...formatDocumentData(itemDoc.data()), item_id: obj.item_id, cantidad: obj.cantidad };
      }
      return { item_id: obj.item_id, cantidad: obj.cantidad, error: 'Detalles del item no encontrados en el catalogo maestro' };
    });
    const items = await Promise.all(itemsPromises);
    res.status(200).json(items);
  } catch (error) {
    console.error('Error al obtener items del proyecto:', error);
    res.status(500).json({ error: 'Error del servidor al obtener los items del proyecto' });
  }
});

// 3. POST /api/usuarios — Registrar nuevo usuario
app.post('/api/usuarios', async (req, res) => {
  try {
    const { id, nombre, email, fecha_registro } = req.body;
    if (!nombre || !email) {
      return res.status(400).json({ error: 'Los campos "nombre" e "email" son requeridos' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es valido' });
    }
    const emailCheck = await db.collection('usuario').where('email', '==', email).get();
    if (!emailCheck.empty) {
      return res.status(400).json({ error: 'El email ya se encuentra registrado' });
    }
    let docId = id;
    if (docId) {
      const docCheck = await db.collection('usuario').doc(docId).get();
      if (docCheck.exists) {
        return res.status(400).json({ error: 'El ID de usuario ya existe' });
      }
    } else {
      docId = db.collection('usuario').doc().id;
    }
    let registroTimestamp;
    if (fecha_registro) {
      registroTimestamp = admin.firestore.Timestamp.fromDate(new Date(fecha_registro));
    } else {
      registroTimestamp = admin.firestore.Timestamp.now();
    }
    const nuevoUsuario = { nombre, email, fecha_registro: registroTimestamp };
    await db.collection('usuario').doc(docId).set(nuevoUsuario);
    res.status(201).json({
      mensaje: 'Usuario registrado exitosamente',
      id: docId,
      data: formatDocumentData(nuevoUsuario)
    });
  } catch (error) {
    console.error('Error al registrar usuario:', error);
    res.status(500).json({ error: 'Error del servidor al intentar registrar el usuario' });
  }
});

// 4. POST /api/proyectos/:id/items — Crear item y asignar a proyecto (transaccion)
app.post('/api/proyectos/:id/items', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, categoria, es_materia_prima, ingredientes_para_calculo, receta_matriz, stock, cantidad } = req.body;
    if (!nombre) {
      return res.status(400).json({ error: 'El campo "nombre" del item es requerido' });
    }
    if (cantidad === undefined || typeof cantidad !== 'number' || cantidad <= 0) {
      return res.status(400).json({ error: 'La "cantidad" asignada al proyecto es requerida y debe ser un numero mayor a 0' });
    }
    if (receta_matriz !== undefined && !validateRecetaMatriz(receta_matriz)) {
      return res.status(400).json({ error: 'La receta_matriz debe ser un arreglo de exactamente 9 elementos (strings o null)' });
    }
    if (ingredientes_para_calculo !== undefined && !validateIngredientes(ingredientes_para_calculo)) {
      return res.status(400).json({ error: 'Los ingredientes_para_calculo deben ser un arreglo de objetos { item_id, cantidad }' });
    }
    const proyectoRef = db.collection('proyectos').doc(id);
    const proyectoDoc = await proyectoRef.get();
    if (!proyectoDoc.exists) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const item_id = nombre.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/ /g, '_');
    const itemRef = db.collection('items').doc(item_id);
    const nuevoItem = {
      nombre,
      categoria: categoria || '',
      es_materia_prima: !!es_materia_prima,
      receta_matriz: receta_matriz || null,
      ingredientes_para_calculo: ingredientes_para_calculo || [],
      stock: Number.isInteger(stock) && stock >= 0 ? stock : 0
    };
    await db.runTransaction(async (transaction) => {
      const projSnap = await transaction.get(proyectoRef);
      const projData = projSnap.data();
      const objetivos = projData.objetivos || [];
      const index = objetivos.findIndex(obj => obj.item_id === item_id);
      if (index > -1) {
        objetivos[index].cantidad += cantidad;
      } else {
        objetivos.push({ item_id, cantidad });
      }
      transaction.set(itemRef, nuevoItem);
      transaction.update(proyectoRef, { objetivos });
    });
    res.status(201).json({
      mensaje: 'Item creado y asignado al proyecto exitosamente',
      item_id,
      proyecto_id: id,
      cantidad_total_proyecto: cantidad,
      item: nuevoItem
    });
  } catch (error) {
    console.error('Error al crear y asignar item:', error);
    res.status(500).json({ error: 'Error del servidor al intentar crear y asignar el item' });
  }
});

// 5. PUT /api/usuarios/:id — Reemplazar perfil completo de usuario
app.put('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, email, fecha_registro } = req.body;
    if (!nombre || !email || !fecha_registro) {
      return res.status(400).json({ error: 'Todos los campos son requeridos para reemplazo completo ("nombre", "email", "fecha_registro")' });
    }
    const docRef = db.collection('usuario').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'El formato del email no es valido' });
    }
    const userTimestamp = admin.firestore.Timestamp.fromDate(new Date(fecha_registro));
    const nuevoPerfil = { nombre, email, fecha_registro: userTimestamp };
    await docRef.set(nuevoPerfil);
    res.status(200).json({
      mensaje: 'Perfil de usuario reemplazado completamente',
      id: id,
      data: formatDocumentData(nuevoPerfil)
    });
  } catch (error) {
    console.error('Error al reemplazar usuario:', error);
    res.status(500).json({ error: 'Error del servidor al intentar reemplazar el usuario' });
  }
});

// 6. PATCH /api/usuarios/:id — Actualizar usuario parcialmente
app.patch('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    const docRef = db.collection('usuario').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    if (updates.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(updates.email)) {
        return res.status(400).json({ error: 'El formato del email no es valido' });
      }
      const emailCheck = await db.collection('usuario').where('email', '==', updates.email).get();
      if (!emailCheck.empty && emailCheck.docs[0].id !== id) {
        return res.status(400).json({ error: 'El email ya se encuentra registrado por otro usuario' });
      }
    }
    if (updates.fecha_registro && typeof updates.fecha_registro === 'string') {
      updates.fecha_registro = admin.firestore.Timestamp.fromDate(new Date(updates.fecha_registro));
    }
    await docRef.update(updates);
    const docActualizado = await docRef.get();
    res.status(200).json({
      mensaje: 'Usuario actualizado parcialmente',
      id: id,
      data: formatDocumentData(docActualizado.data())
    });
  } catch (error) {
    console.error('Error al actualizar parcialmente usuario:', error);
    res.status(500).json({ error: 'Error del servidor al intentar actualizar parcialmente el usuario' });
  }
});

// 7. PATCH /api/items/:id/stock — Actualizar stock de un item
app.patch('/api/items/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock } = req.body;
    if (stock === undefined || !Number.isInteger(stock) || stock < 0) {
      return res.status(400).json({ error: 'El campo "stock" es requerido y debe ser un numero entero mayor o igual a 0' });
    }
    const docRef = db.collection('items').doc(id);
    const doc = await docRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Item no encontrado' });
    }
    await docRef.update({ stock });
    res.status(200).json({
      mensaje: 'Stock de item actualizado exitosamente',
      id: id,
      stock: stock
    });
  } catch (error) {
    console.error('Error al actualizar stock de item:', error);
    res.status(500).json({ error: 'Error del servidor al intentar actualizar el stock' });
  }
});

// 8. DELETE /api/usuarios/:id — Eliminar usuario y sus proyectos asociados
app.delete('/api/usuarios/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const userRef = db.collection('usuario').doc(id);
    const doc = await userRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }
    const batch = db.batch();
    batch.delete(userRef);
    const proyectosSnap = await db.collection('proyectos').where('usuario_id', '==', id).get();
    proyectosSnap.forEach((projectDoc) => {
      batch.delete(projectDoc.ref);
    });
    await batch.commit();
    res.status(200).json({
      mensaje: 'Usuario y sus proyectos asociados eliminados exitosamente',
      proyectos_eliminados: proyectosSnap.size
    });
  } catch (error) {
    console.error('Error al eliminar usuario:', error);
    res.status(500).json({ error: 'Error del servidor al intentar eliminar el usuario' });
  }
});

// 9. DELETE /api/proyectos/:id/items/:item_id — Remover item de un proyecto
app.delete('/api/proyectos/:id/items/:item_id', async (req, res) => {
  try {
    const { id, item_id } = req.params;
    const proyectoRef = db.collection('proyectos').doc(id);
    const doc = await proyectoRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Proyecto no encontrado' });
    }
    const proyecto = doc.data();
    const objetivos = proyecto.objetivos || [];
    const itemExiste = objetivos.some(obj => obj.item_id === item_id);
    if (!itemExiste) {
      return res.status(404).json({ error: 'El item no se encuentra asociado a este proyecto' });
    }
    const nuevosObjetivos = objetivos.filter(obj => obj.item_id !== item_id);
    await proyectoRef.update({ objetivos: nuevosObjetivos });
    res.status(200).json({
      mensaje: 'Item removido del proyecto exitosamente',
      proyecto_id: id,
      item_id: item_id
    });
  } catch (error) {
    console.error('Error al remover item del proyecto:', error);
    res.status(500).json({ error: 'Error del servidor al intentar remover el item del proyecto' });
  }
});

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
