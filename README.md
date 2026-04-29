# 🧱 CraftBuild API

API de Gestión de Inventarios y Dependencias de Minecraft.  
Calcula automáticamente las materias primas necesarias para construcciones complejas.

## 🚀 Inicio Rápido y Desarrollo Local

```bash
# 1. Instalar dependencias
npm install

# 2. Ejecutar servidor
node index.js
```

## 📋 Endpoints

| #  | Método   | Ruta                              | Descripción                                    |
|----|----------|-----------------------------------|------------------------------------------------|
| 1  | `GET`    | `/api/items`                      | Obtener todos los ítems                        |
| 2  | `GET`    | `/api/items/:id/materiales`       | Calcular materias primas (recursivo)           |
| 3  | `POST`   | `/api/items`                      | Crear nuevo ítem                               |
| 4  | `POST`   | `/api/proyectos`                  | Crear proyecto de construcción                 |
| 5  | `PUT`    | `/api/proyectos/:id`              | Editar proyecto completo                       |
| 6  | `PUT`    | `/api/items/:id`                  | Editar ítem completo                           |
| 7  | `PATCH`  | `/api/proyectos/:id/estado`       | Cambiar estado (activo/completado/cancelado)   |
| 8  | `PATCH`  | `/api/proyectos/:id/nombre`       | Cambiar nombre del proyecto                    |
| 9  | `DELETE` | `/api/proyectos/:id`              | Eliminar proyecto                              |
| 10 | `DELETE` | `/api/items/:id`                  | Eliminar ítem                                  |
| +  | `GET`    | `/api/proyectos/:id/calcular`     | Calcular TODOS los materiales del proyecto     |



## 📝 Ejemplos de Uso

### Obtener todos los ítems
```bash
curl http://localhost:3000/api/items
```

### Calcular materiales para 10 cofres
```bash
curl "http://localhost:3000/api/items/11/materiales?cantidad=10"
```
Respuesta:
```json
{
  "item": "Cofre",
  "cantidad_solicitada": 10,
  "materiales_necesarios": {
    "Bloque de Madera": 20
  }
}
```

### Crear un proyecto
```bash
curl -X POST http://localhost:3000/api/proyectos \
  -H "Content-Type: application/json" \
  -d '{
    "nombre_proyecto": "Casa Base",
    "creador": "Steve",
    "items": [
      { "id_item": 12, "cantidad": 4 },
      { "id_item": 11, "cantidad": 10 }
    ]
  }'
```

### Crear un nuevo ítem con receta
```bash
curl -X POST http://localhost:3000/api/items \
  -H "Content-Type: application/json" \
  -d '{
    "nombre": "Estanteria",
    "es_materia_prima": false,
    "receta": [
      { "id_item_ingrediente": 8, "cantidad": 6, "cantidad_resultado": 1 }
    ]
  }'
```

### Cambiar estado de proyecto
```bash
curl -X PATCH http://localhost:3000/api/proyectos/1/estado \
  -H "Content-Type: application/json" \
  -d '{ "estado": "completado" }'
```

### Calcular materiales totales de un proyecto
```bash
curl http://localhost:3000/api/proyectos/1/calcular
```

## 👥 Equipo (Flujo de Trabajo)

```
main ← develop ← feature/nombre-feature
```

1. `main`: Versión estable
2. `develop`: Rama de integración
3. `nombre`: Cada integrante trabaja en su feature


