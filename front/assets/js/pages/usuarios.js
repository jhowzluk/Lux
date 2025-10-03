import { state } from '../state.js';
import { openModal, closeModal } from '../ui.js';
import { renderTableUsuarios } from './renderer.js';

const editUser = (id) => {
    const user = state.users.find(u => u.id === id);
    if(!user) return;
    const formNode = document.getElementById('edit-user-template').cloneNode(true);
    formNode.querySelector('#edit-user-id').value = user.id;
    formNode.querySelector('#edit-user-name').value = user.nome;
    formNode.querySelector('#edit-user-cpf').value = user.cpf;
    formNode.querySelector('#edit-user-login').value = user.usuario;
    formNode.querySelector('#edit-user-email').value = user.email;
    formNode.querySelector('#edit-user-access-type').value = user.tipoAcesso;
    formNode.querySelector('#edit-user-status').value = user.status;
    const footerButtons = [
        {text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal},
        {text: 'Salvar Alterações', classes: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600', onClick: () => {
            const updatedUser = {
                id: parseInt(formNode.querySelector('#edit-user-id').value),
                nome: formNode.querySelector('#edit-user-name').value,
                cpf: formNode.querySelector('#edit-user-cpf').value,
                usuario: formNode.querySelector('#edit-user-login').value,
                email: formNode.querySelector('#edit-user-email').value,
                tipoAcesso: formNode.querySelector('#edit-user-access-type').value,
                status: formNode.querySelector('#edit-user-status').value,
                senha: user.senha // Mantém a senha original
            };
            state.users = state.users.map(u => u.id === updatedUser.id ? updatedUser : u);
            renderTableUsuarios();
            closeModal();
        }}
    ];
    openModal('Editar Usuário', formNode, footerButtons);
};

const inactivateUser = (id) => {
    if (state.loggedInUser && id === state.loggedInUser.id) {
        alert("Você não pode inativar seu próprio usuário.");
        return;
    }

    const user = state.users.find(u => u.id === id);
    if (!user || user.status === 'Inativo') return;

    const modalTitle = 'Confirmar Inativação';
    const modalText = `<p>Tem certeza que deseja inativar o usuário <strong>${user.nome}</strong>?</p>`;
    const footerButtons = [
        {text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal},
        {text: 'Sim, Inativar', classes: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600', onClick: () => {
            state.users = state.users.map(u => u.id === id ? {...u, status: 'Inativo'} : u);
            renderTableUsuarios();
            closeModal();
        }}
    ];
    openModal(modalTitle, modalText, footerButtons);
};

export const initUsuariosPage = () => {
    window.editUser = editUser;
    window.inactivateUser = inactivateUser;

    const userForm = document.getElementById('user-form');
    const clearButton = document.getElementById('clear-button-usuario');
    const searchInput = document.getElementById('search-input-usuario');
    const passwordInput = document.getElementById('senha-usuario');
    const confirmPasswordInput = document.getElementById('repita-senha-usuario');
    
    userForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(passwordInput.value !== confirmPasswordInput.value) {
            alert('As senhas não conferem.');
            return;
        }
        const newUser = { id: currentNextUserId++, nome: document.getElementById('nome-usuario').value, cpf: document.getElementById('cpf-usuario').value, email: document.getElementById('email-usuario').value, usuario: document.getElementById('login-usuario').value, senha: passwordInput.value, tipoAcesso: document.getElementById('tipo-acesso-usuario').value, status: 'Ativo' };
        state.users.unshift(newUser);
        renderTableUsuarios();
        userForm.reset();
    });

    clearButton.addEventListener('click', () => userForm.reset());
    searchInput.addEventListener('input', (e) => { 
        const searchTerm = e.target.value.toLowerCase(); 
        const filteredData = state.users.filter(user => Object.values(user).some(val => String(val).toLowerCase().includes(searchTerm)));
        renderTableUsuarios(filteredData); 
    });
    renderTableUsuarios();
};