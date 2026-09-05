// URL base del servidor API
// En Docker se usa ruta relativa '' para que Nginx redirija /api al contenedor notaria-server
const API_BASE_URL = import.meta.env.VITE_API_URL !== undefined ? import.meta.env.VITE_API_URL : ''

export default API_BASE_URL
