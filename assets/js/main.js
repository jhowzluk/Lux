import { setupAuth } from './auth.js';
import { setupNavigation } from './ui.js';
import { initQuartosPage } from './pages/quartos.js';
import { initReservasPage } from './pages/reservas.js';
import { initUsuariosPage } from './pages/usuarios.js';

document.addEventListener('DOMContentLoaded', () => {
    setupAuth();
    setupNavigation();
    initQuartosPage();
    initReservasPage();
    initUsuariosPage();
});