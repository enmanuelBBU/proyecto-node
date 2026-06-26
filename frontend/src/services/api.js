const API_BASE = '/api';

async function request(url, options = {}) {
  const config = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  if (config.body && typeof config.body === 'object') {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(`${API_BASE}${url}`, config);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(data.error || `Error ${response.status}`);
  }

  return data;
}

// ===== USUARIOS =====
export const usuariosApi = {
  getById: (id) => request(`/usuarios/${id}`),
  create: (userData) => request('/usuarios', { method: 'POST', body: userData }),
  replace: (id, userData) => request(`/usuarios/${id}`, { method: 'PUT', body: userData }),
  update: (id, userData) => request(`/usuarios/${id}`, { method: 'PATCH', body: userData }),
  remove: (id) => request(`/usuarios/${id}`, { method: 'DELETE' }),
};

// ===== PROYECTOS =====
export const proyectosApi = {
  getAll: () => request('/proyectos'),
  create: (data) => request('/proyectos', { method: 'POST', body: data }),
  update: (id, data) => request(`/proyectos/${id}`, { method: 'PUT', body: data }),
  remove: (id) => request(`/proyectos/${id}`, { method: 'DELETE' }),
  getItems: (id) => request(`/proyectos/${id}/items`),
  addItem: (id, itemData) => request(`/proyectos/${id}/items`, { method: 'POST', body: itemData }),
  removeItem: (id, itemId) => request(`/proyectos/${id}/items/${itemId}`, { method: 'DELETE' }),
};

// ===== ITEMS =====
export const itemsApi = {
  getAll: () => request('/items'),
  create: (itemData) => request('/items', { method: 'POST', body: itemData }),
  updateCrafteo: (id, data) => request(`/items/${id}`, { method: 'PUT', body: data }),
  updateStock: (id, stock) => request(`/items/${id}/stock`, { method: 'PATCH', body: { stock } }),
  remove: (id) => request(`/items/${id}`, { method: 'DELETE' }),
  getMateriales: (id) => request(`/items/${id}/materiales`),
};

// ===== DATOS =====
export const datosApi = {
  checkConnection: () => request('/datos'),
};
