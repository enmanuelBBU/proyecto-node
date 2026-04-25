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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
