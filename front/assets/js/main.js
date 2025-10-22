import { setupAuth, loadInitialDataAndInitPages } from './auth.js';
import { setupNavigation, showPage } from './ui.js';
import { state } from './state.js';

const checkSessionAndInit = async () => {
    const storedUser = sessionStorage.getItem('loggedInUser');

    if (storedUser) {
        state.loggedInUser = JSON.parse(storedUser);

        // Prepara a UI para o usuário logado
        document.getElementById('auth-wrapper').classList.add('hidden'); // Garante que login está escondido
        document.getElementById('app-wrapper').classList.remove('hidden'); // Mostra a aplicação
        document.getElementById('user-session').style.display = 'flex';
        document.getElementById('username-display').textContent = `Olá, ${state.loggedInUser.nome.split(' ')[0]}`;
        
        // Carrega os dados da aplicação
        await loadInitialDataAndInitPages();

        const lastPageId = sessionStorage.getItem('lastPageId') || 'page-nav-home';
        showPage(lastPageId);
    } else {
        // Se NÃO houver usuário, mostra a tela de login
        document.getElementById('auth-wrapper').classList.remove('hidden');
    }
};


document.addEventListener('DOMContentLoaded', async () => {
    lucide.createIcons();
    await checkSessionAndInit();
    setupAuth();
    setupNavigation();
});