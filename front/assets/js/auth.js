import { state } from './state.js';
import API_BASE_URL from './api.js';
import { initQuartosPage } from './pages/quartos.js';
import { initReservasPage } from './pages/reservas.js';
import { initUsuariosPage } from './pages/usuarios.js';
import { initRelatoriosPage } from './pages/relatorios.js';
import { initContaPage } from './pages/conta.js';
import { showPage } from './ui.js';
import { showToast } from './toast.js';

const appWrapper = document.getElementById('app-wrapper');
const authWrapper = document.getElementById('auth-wrapper');
const userSession = document.getElementById('user-session');

export async function loadInitialDataAndInitPages() {
    try {
        const [quartosRes, reservasRes, usuariosRes] = await Promise.all([
            fetch(`${API_BASE_URL}/api/quartos`),
            fetch(`${API_BASE_URL}/api/reservas`),
            fetch(`${API_BASE_URL}/api/usuarios`)
        ]);

        state.rooms = await quartosRes.json();
        state.reservations = await reservasRes.json();
        state.users = await usuariosRes.json();

        initQuartosPage();
        initReservasPage();
        initUsuariosPage();
        initRelatoriosPage();
        initContaPage();
        applyPermissions();

    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        showToast("Não foi possível carregar os dados do sistema. Verifique o console.", 'error');
    }
}

const applyPermissions = () => {
    if (!state.loggedInUser) return;
    const isAdmin = state.loggedInUser.tipoAcesso === 'Administrador';
    
    document.getElementById('nav-usuarios').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('nav-relatorios').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('room-form-wrapper').style.display = isAdmin ? 'block' : 'none';
    
    const roomActions = document.getElementById('room-actions-header');
    if (roomActions) roomActions.style.display = isAdmin ? 'table-cell' : 'none';

    // Se um Recepcionista recarregar a página em uma aba proibida, manda para Home
    if (!isAdmin) {
        const currentPage = sessionStorage.getItem('lastPageId');
        if (currentPage === 'page-nav-usuarios' || currentPage === 'page-nav-relatorios') {
            showPage('page-nav-home');
            showToast('Acesso negado a esta página.', 'info');
        }
    }
    
    // O renderer é chamado dentro de cada initPage, não precisamos chamar aqui
}

const login = async (username, password) => {
    document.getElementById('login-error').classList.add('hidden');
    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password }),
        });
        const data = await response.json();
        if (data.success) {
            state.loggedInUser = data.user;
            sessionStorage.setItem('loggedInUser', JSON.stringify(data.user));

            authWrapper.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            userSession.style.display = 'flex';
            document.getElementById('username-display').textContent = `Olá, ${state.loggedInUser.nome.split(' ')[0]}`;
            await loadInitialDataAndInitPages();
            
            // --- CORREÇÃO AQUI ---
            // Sempre envia para a home page após o login
            // e limpa a 'lastPageId' para evitar bugs
            sessionStorage.removeItem('lastPageId');
            showPage('page-nav-home');
            // ---------------------

        } else {
            document.getElementById('login-error').textContent = data.message;
            document.getElementById('login-error').classList.remove('hidden');
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'Erro de conexão com o servidor.';
        document.getElementById('login-error').classList.remove('hidden');
        console.error('Erro ao tentar fazer login:', error);
    }
};

const logout = () => {
    state.loggedInUser = null;
    state.rooms = [];
    state.reservations = [];
    state.users = [];
    sessionStorage.removeItem('loggedInUser');
    sessionStorage.removeItem('lastPageId'); 

    appWrapper.classList.add('hidden');
    authWrapper.classList.remove('hidden');
    userSession.style.display = 'none';
    
    // Altera para page-login (que é a div) e não showPage (que é do app)
    document.querySelectorAll('.page-auth').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-login').classList.remove('hidden');
};

const recoverPassword = async (email, cpf) => {
    // Esta rota não existe no back-end, vamos simular
    console.log("Simulando recuperação para:", email, cpf);
    showToast("Função de recuperação ainda não implementada.", 'info');
    
    // Se a rota /api/auth/recover existisse:
    // try {
    //     const response = await fetch(`${API_BASE_URL}/api/auth/recover`, { ... });
    //     const data = await response.json();
    //     if (data.success) {
    //         showToast(data.message, 'success');
    //         showPage('page-login');
    //     } else {
    //         showToast(data.message, 'error');
    //     }
    // } catch (error) {
    //     showToast('Erro de conexão ao tentar recuperar senha.', 'error');
    // }
};

export const setupAuth = () => {
    // Garante que os listeners não sejam duplicados
    const loginForm = document.getElementById('login-form');
    if (loginForm.getAttribute('data-auth-listeners') === 'true') return;
    loginForm.setAttribute('data-auth-listeners', 'true');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });
    
    document.getElementById('logout-button').addEventListener('click', logout);
    document.getElementById('forgot-password-link').addEventListener('click', (e) => { 
        e.preventDefault(); 
        document.querySelectorAll('.page-auth').forEach(p => p.classList.add('hidden'));
        document.getElementById('page-recovery').classList.remove('hidden');
    });
    document.getElementById('back-to-login-link').addEventListener('click', (e) => { 
        e.preventDefault(); 
        document.querySelectorAll('.page-auth').forEach(p => p.classList.add('hidden'));
        document.getElementById('page-login').classList.remove('hidden');
    });

    document.getElementById('recovery-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('recovery-email').value;
        const cpf = document.getElementById('recovery-cpf').value;
        recoverPassword(email, cpf);
    });
};