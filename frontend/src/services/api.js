import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_BACKEND_URL;
const API_URL = `${API_BASE_URL}/api`;

// Configuración de axios
const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor para agregar token de autenticación
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expirado o no válido
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Servicios de API
export const torresAPI = {
  // Obtener todas las torres
  getAll: () => api.get('/torres'),
  
  // Obtener una torre por ID
  getById: (id) => api.get(`/torres/${id}`),
  
  // Crear nueva torre
  create: (data) => api.post('/torres', data),
  
  // Actualizar torre
  update: (id, data) => api.put(`/torres/${id}`, data),
  
  // Eliminar torre
  delete: (id) => api.delete(`/torres/${id}`),
};

export const mantenimientosAPI = {
  // Obtener mantenimientos
  getAll: (torreId = null) => api.get('/mantenimientos', { params: { torre_id: torreId } }),
  
  // Crear nuevo mantenimiento
  create: (data) => api.post('/mantenimientos', data),
};

export const tecnicosAPI = {
  // Obtener técnicos
  getAll: (torreId = null) => api.get('/tecnicos', { params: { torre_id: torreId } }),
  
  // Crear nuevo técnico
  create: (data) => api.post('/tecnicos', data),
};

export const estadisticasAPI = {
  // Obtener estadísticas
  get: () => api.get('/estadisticas'),
};

export const authAPI = {
  // Login
  login: (credentials) => api.post('/auth/login', credentials),
  
  // Registro
  register: (userData) => api.post('/auth/register', userData),
};

export const generalAPI = {
  // Health check
  health: () => api.get('/health'),
  
  // Test conexión
  test: () => api.get('/'),
};

export default api;