import { state } from './state.js';
import { showPage, showAuthPage } from './ui.js';
import { renderAllTables } from './pages/renderer.js';

const authWrapper = document.getElementById('auth-wrapper');
const appWrapper = document.getElementById('app-wrapper');
const userSession = document.getElementById('user-session');

const applyPermissions = () => {
    if (!state.loggedInUser) return;
    const isAdmin = state.loggedInUser.tipoAcesso === 'Administrador';

    // Controla a visibilidade dos links de navegação e formulários
    document.getElementById('nav-usuarios').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('nav-relatorios').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('room-form-wrapper').style.display = isAdmin ? 'block' : 'none';
    document.getElementById('room-actions-header').style.display = isAdmin ? 'table-cell' : 'none';
    
    // Renderiza tabelas para aplicar permissões nas linhas (ex: botões de ação)
    renderAllTables();
};

const login = (username, password) => {
    const user = state.users.find(u => u.usuario === username && u.senha === password && u.status === 'Ativo');
    if (user) {
        state.loggedInUser = user;
        authWrapper.classList.add('hidden');
        appWrapper.classList.remove('hidden');
        userSession.style.display = 'flex';
        document.getElementById('username-display').textContent = `Olá, ${state.loggedInUser.nome.split(' ')[0]}`;
        applyPermissions();
        showPage('page-nav-home');
    } else {
        document.getElementById('login-error').textContent = 'Usuário ou senha inválidos.';
        document.getElementById('login-error').classList.remove('hidden');
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
    const loginError = document.getElementById('login-error');

    loginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        loginError.classList.add('hidden');
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        login(username, password);
    });

    logoutButton.addEventListener('click', logout);

    forgotPasswordLink.addEventListener('click', (e) => { e.preventDefault(); showAuthPage('page-recovery'); });
    backToLoginLink.addEventListener('click', (e) => { e.preventDefault(); showAuthPage('page-login'); });

    recoveryForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const email = document.getElementById('recovery-email').value;
        const cpf = document.getElementById('recovery-cpf').value;
        const userExists = state.users.find(u => u.email === email && u.cpf === cpf);

        if(userExists) {
            alert(`Um link de recuperação foi enviado para o e-mail: ${email} (simulação).`);
            showAuthPage('page-login');
        } else {
            alert('E-mail ou CPF não encontrados no sistema.');
        }
    });
};