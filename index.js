require('dotenv').config();
const express = require('express');
const admin = require('firebase-admin');

const serviceAccount = require('./craftbuild-63e96-firebase-adminsdk-fbsvc-fa3cd2b205.json');


admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

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



// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
