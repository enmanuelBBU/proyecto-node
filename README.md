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
| 2  | `GET`    | `/api/items/:id/materiales`       | Obtener materiales de un crafteo               |
| 3  | `POST`   | `/api/items`                      | Crear nuevo ítem                               |
| 4  | `POST`   | `/api/proyectos`                  | Crear proyecto de construcción                 |
| 5  | `PUT`    | `/api/proyectos/:id`              | Editar proyecto completo                       |
| 6  | `PUT`    | `/api/items/:id`                  | Editar ítem completo                           |
| 7  | `PATCH`  | `/api/proyectos/:id/estado`       | Cambiar estado (activo/completado/cancelado)   |
| 8  | `PATCH`  | `/api/proyectos/:id/nombre`       | Cambiar nombre del proyecto                    |
| 9  | `DELETE` | `/api/proyectos/:id`              | Eliminar proyecto                              |
| 10 | `DELETE` | `/api/items/:id`                  | Eliminar ítem                                  |

## 👥 Equipo (Flujo de Trabajo)

```
main ← develop ← nombre-feature
```

1. `main`: Versión estable
2. `develop`: Rama de integración
3. `nombre`: Cada integrante trabaja en su feature


