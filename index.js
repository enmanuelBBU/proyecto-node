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

    // Verificamos que venga el nombre, ya que lo usaremos como ID
    if (!item.nombre) {
      return res.status(400).json({ error: 'El campo "nombre" es requerido' });
    }

    // Reemplazar espacios por "_" para generar el ID del documento
    // Por ejemplo: "Pico de Piedra" -> "Pico_de_Piedra"
    const docId = item.nombre.replace(/ /g, '_');

    // Usamos .set() en lugar de .add() para que el ID sea el docId generado
    // y para que si ya existe, sobreescriba todos los datos.
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


// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
