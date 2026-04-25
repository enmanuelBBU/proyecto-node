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

// Iniciar el servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
