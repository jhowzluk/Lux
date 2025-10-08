const isLocal = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const API_BASE_URL = isLocal ? 'http://localhost:3000' : '';

export default API_BASE_URL;