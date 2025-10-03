import { setupAuth } from './auth.js';
import { setupNavigation } from './ui.js';

document.addEventListener('DOMContentLoaded', () => {
    // Inicializa os ícones assim que o DOM estiver pronto
    lucide.createIcons();

    // Apenas a autenticação e a navegação principal são configuradas aqui.
    // O restante (initQuartosPage, etc.) será chamado DEPOIS do login
    // pela função 'loadInitialDataAndInitPages' dentro do auth.js
    setupAuth();
    setupNavigation();
});