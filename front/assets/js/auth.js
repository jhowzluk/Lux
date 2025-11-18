import { state } from './state.js';
import API_BASE_URL from './api.js';
import { initQuartosPage } from './pages/quartos.js';
import { initReservasPage } from './pages/reservas.js';
import { initUsuariosPage } from './pages/usuarios.js';
import { initRelatoriosPage } from './pages/relatorios.js';
import { initContaPage } from './pages/conta.js';
import { showPage } from './ui.js';
import { showToast } from './toast.js';
import { validarCPF } from './utils.js'; // <-- NOVA IMPORTAÇÃO

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

    if (!isAdmin) {
        const currentPage = sessionStorage.getItem('lastPageId');
        if (currentPage === 'page-nav-usuarios' || currentPage === 'page-nav-relatorios') {
            showPage('page-nav-home');
            showToast('Acesso negado a esta página.', 'info');
        }
    }
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
            
            sessionStorage.removeItem('lastPageId');
            showPage('page-nav-home');

        } else {
            document.getElementById('login-error').textContent = data.message;
            document.getElementById('login-error').classList.remove('hidden');
            showToast(data.message, 'error');
        }
    } catch (error) {
        document.getElementById('login-error').textContent = 'Erro de conexão com o servidor.';
        document.getElementById('login-error').classList.remove('hidden');
        console.error('Erro ao tentar fazer login:', error);
        showToast('Erro de conexão com o servidor.', 'error');
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
    
    document.querySelectorAll('.page-auth').forEach(p => p.classList.add('hidden'));
    document.getElementById('page-login').classList.remove('hidden');
};

const recoverPassword = async (email, cpf) => {
    showToast('Processando solicitação...', 'info');

    try {
        const response = await fetch(`${API_BASE_URL}/api/auth/recover`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, cpf }),
        });
        
        const data = await response.json();
        
        if (data.success) {
            showToast(data.message, 'success');
            
            setTimeout(() => {
                document.querySelectorAll('.page-auth').forEach(p => p.classList.add('hidden'));
                document.getElementById('page-login').classList.remove('hidden');
                document.getElementById('recovery-form').reset();
            }, 2000);
            
        } else {
            showToast(data.message, 'error');
        }
    } catch (error) {
        console.error('Erro ao tentar recuperar senha:', error);
        showToast('Erro de conexão ao tentar recuperar senha.', 'error');
    }
};

export const setupAuth = () => {
    const loginForm = document.getElementById('login-form');
    if (loginForm.getAttribute('data-auth-listeners') === 'true') return;
    loginForm.setAttribute('data-auth-listeners', 'true');

    // --- APLICAÇÃO DA MÁSCARA NA RECUPERAÇÃO ---
    const recoveryCpfInput = document.getElementById('recovery-cpf');
    if (recoveryCpfInput) {
        IMask(recoveryCpfInput, { mask: '000.000.000-00' });
    }
    // -------------------------------------------

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

        // --- VALIDAÇÃO DE CPF ---
        if (!validarCPF(cpf)) {
            showToast('O CPF informado é inválido. Por favor, verifique.', 'error');
            return;
        }
        // ------------------------

        recoverPassword(email, cpf);
    });
};