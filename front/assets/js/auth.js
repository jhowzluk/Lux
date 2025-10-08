import { state } from './state.js';
import { showPage, showAuthPage } from './ui.js';
import { renderAllTables } from './pages/renderer.js';
import { initQuartosPage } from './pages/quartos.js';
import { initReservasPage } from './pages/reservas.js';
import { initUsuariosPage } from './pages/usuarios.js';
import API_BASE_URL from './api.js';

const authWrapper = document.getElementById('auth-wrapper');
const appWrapper = document.getElementById('app-wrapper');
const userSession = document.getElementById('user-session');

async function loadInitialDataAndInitPages() {
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
        applyPermissions();
        showPage('page-nav-home');

    } catch (error) {
        console.error("Erro ao carregar dados iniciais:", error);
        alert("Não foi possível carregar os dados do sistema. Verifique o console.");
    }
}


const applyPermissions = () => {
    if (!state.loggedInUser) return;
    const isAdmin = state.loggedInUser.tipoAcesso === 'Administrador';
    document.getElementById('nav-usuarios').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('nav-relatorios').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('room-form-wrapper').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('room-actions-header').style.display = isAdmin ? 'table-cell' : 'none';
    renderAllTables();
};

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
            authWrapper.classList.add('hidden');
            appWrapper.classList.remove('hidden');
            userSession.style.display = 'flex';
            document.getElementById('username-display').textContent = `Olá, ${state.loggedInUser.nome.split(' ')[0]}`;
            await loadInitialDataAndInitPages();
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
    appWrapper.classList.add('hidden');
    authWrapper.classList.remove('hidden');
    userSession.style.display = 'none';
    showAuthPage('page-login');
};

export const setupAuth = () => {
    const loginForm = document.getElementById('login-form');
    const recoveryForm = document.getElementById('recovery-form');
    const forgotPasswordLink = document.getElementById('forgot-password-link');
    const backToLoginLink = document.getElementById('back-to-login-link');
    const logoutButton = document.getElementById('logout-button');
    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });
    logoutButton.addEventListener('click', logout);
    forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showAuthPage('page-recovery'); });
    backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthPage('page-login'); });
    recoveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        alert('Função de recuperação de senha (simulação).');
        showAuthPage('page-login');
    });
};