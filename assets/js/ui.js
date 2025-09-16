import { state } from './state.js';
import { initContaPage } from './pages/conta.js';
import { initRelatoriosPage } from './pages/relatorios.js';

// --- FUNÇÕES DE RENDERIZAÇÃO COMPARTILHADAS ---
export const getStatusBadgeQuarto = (status) => { const colors = {'Disponível': 'bg-green-100 text-green-800','Indisponível': 'bg-red-100 text-red-800'}; return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}">${status}</span>`; };
export const getStatusBadgeUsuario = (status) => { const colors = {'Ativo': 'bg-green-100 text-green-800','Inativo': 'bg-gray-100 text-gray-800'}; return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}">${status}</span>`; };
export const getStatusBadgeReserva = (status) => {
    const colors = {
        'Confirmada': 'bg-blue-100 text-blue-800', 'Pendente': 'bg-yellow-100 text-yellow-800',
        'Check-in': 'bg-green-100 text-green-800', 'Check-out': 'bg-gray-200 text-gray-800',
        'Cancelada': 'bg-red-100 text-red-800'
    };
    return `<span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${colors[status] || 'bg-gray-100 text-gray-800'}">${status}</span>`;
};


// --- LÓGICA DO MODAL ---
const modal = document.getElementById('app-modal');
const modalTitle = document.getElementById('modal-title');
const modalBody = document.getElementById('modal-body');
const modalFooter = document.getElementById('modal-footer');
const modalCloseButton = document.getElementById('modal-close-button');

export const openModal = (title, bodyContent, footerButtons = []) => {
    modalTitle.textContent = title;
    if (typeof bodyContent === 'string') {
        modalBody.innerHTML = bodyContent;
    } else {
        modalBody.innerHTML = '';
        modalBody.appendChild(bodyContent);
    }
    modalFooter.innerHTML = '';
    footerButtons.forEach(btnInfo => {
        const button = document.createElement('button');
        button.textContent = btnInfo.text;
        button.className = btnInfo.classes;
        button.onclick = btnInfo.onClick;
        modalFooter.appendChild(button);
    });
    modal.classList.remove('hidden');
};
export const closeModal = () => modal.classList.add('hidden');

// --- LÓGICA DE NAVEGAÇÃO ---
const navLinks = document.querySelectorAll('.nav-link');
const pages = document.querySelectorAll('.page-content');
const userProfileButton = document.getElementById('user-profile-button');

export const showPage = (pageId) => {
    pages.forEach(page => page.classList.add('hidden'));
    const pageToShow = document.getElementById(pageId);
    if(pageToShow) pageToShow.classList.remove('hidden');

    navLinks.forEach(link => link.classList.remove('nav-link-active'));
    userProfileButton.classList.remove('profile-btn-active');
    
    // Adiciona a classe ativa ao link correto ou ao botão de perfil
    const navId = `nav-${pageId.split('nav-')[1]}`;
    const linkToActivate = document.getElementById(navId);
    if (linkToActivate && pageId.includes('page-nav')) {
        linkToActivate.classList.add('nav-link-active');
    } else if (pageId === 'page-conta') {
        userProfileButton.classList.add('profile-btn-active');
    }
    
    if (pageId === 'page-nav-relatorios') initRelatoriosPage();
    if (pageId === 'page-conta') initContaPage();
};

export const showAuthPage = (pageId) => {
    document.querySelectorAll('.page-auth').forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
};

export function setupNavigation() {
    modalCloseButton.addEventListener('click', closeModal);
    modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(); });
    
    navLinks.forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const pageId = `page-nav-${link.id.split('-')[1]}`;
            if (document.getElementById(pageId)) showPage(pageId);
        });
    });

    userProfileButton.addEventListener('click', (e) => {
        e.preventDefault();
        showPage('page-conta');
    });
}