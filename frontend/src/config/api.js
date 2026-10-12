// src/config/api.js
// Detecta automáticamente la IP desde donde se abre la app.
// Si abres en localhost, usa localhost. Si abres desde 192.168.1.66, usa esa IP.
const host = window.location.hostname || 'localhost'
export const API_URL = `http://${host}:3000/api`
