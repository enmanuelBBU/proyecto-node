const admin = require('firebase-admin');
const bcrypt = require('bcrypt');
const path = require('path');

// Buscar el archivo de credenciales (en el proyecto hay dos posibles nombres)
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

async function migrate() {
  try {
    const snapshot = await db.collection('usuario').get();
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('123456', salt);
    let count = 0;

    const promises = [];
    snapshot.forEach(doc => {
      const data = doc.data();
      if (!data.password) {
        promises.push(
          doc.ref.update({
            password: defaultPassword,
            rol: data.rol || 'usuario'
          })
        );
        count++;
      }
    });

    await Promise.all(promises);
    console.log(`Migrados ${count} usuarios con password por defecto: 123456`);
    console.log('RECOMENDACION: Cada usuario debe cambiar su password desde el Perfil.');
    process.exit(0);
  } catch (error) {
    console.error('Error en migracion:', error);
    process.exit(1);
  }
}

migrate();
