import { state } from '../state.js';
import { openModal, closeModal } from '../ui.js';
import { renderTableUsuarios } from './renderer.js';
import API_BASE_URL from '../api.js';
import { validarCPF, validarSenha } from '../utils.js';
import { showToast } from '../toast.js'; 

const editUser = (id) => {
    const user = state.users.find(u => u.id === id);
    if (!user) return;
    const formNode = document.getElementById('edit-user-template').cloneNode(true);
    formNode.querySelector('#edit-user-name').value = user.nome;
    formNode.querySelector('#edit-user-cpf').value = user.cpf;
    formNode.querySelector('#edit-user-login').value = user.usuario;
    formNode.querySelector('#edit-user-email').value = user.email;
    formNode.querySelector('#edit-user-access-type').value = user.tipoAcesso;
    formNode.querySelector('#edit-user-status').value = user.status;

    IMask(formNode.querySelector('#edit-user-cpf'), { mask: '000.000.000-00' });

    const footerButtons = [
        { text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        {
            text: 'Salvar Alterações', classes: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600', onClick: async () => {
                const updatedUserData = {
                    nome: formNode.querySelector('#edit-user-name').value,
                    email: formNode.querySelector('#edit-user-email').value,
                    tipoAcesso: formNode.querySelector('#edit-user-access-type').value,
                    status: formNode.querySelector('#edit-user-status').value,
                };
                try {
                    const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedUserData)
                    });
                    const updatedUserFromServer = await response.json();
                    state.users = state.users.map(u => u.id === updatedUserFromServer.id ? updatedUserFromServer : u);
                    renderTableUsuarios();
                    showToast('Usuário atualizado com sucesso!', 'success');
                    closeModal();
                } catch (error) {
                    console.error("Erro ao atualizar usuário:", error);
                    showToast("Falha ao atualizar usuário.", 'error');
                }
            }
        }
    ];
    openModal('Editar Usuário', formNode, footerButtons);
};

const inactivateUser = (id) => {
    if (state.loggedInUser && id === state.loggedInUser.id) {
        showToast("Você não pode inativar seu próprio usuário.", 'info');
        return;
    }
    const user = state.users.find(u => u.id === id);
    if (!user || user.status === 'Inativo') return;

    const modalTitle = 'Confirmar Inativação';
    const modalText = `<p>Tem certeza que deseja inativar o usuário <strong>${user.nome}</strong>?</p>`;
    const footerButtons = [
        { text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        {
            text: 'Sim, Inativar', classes: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600', onClick: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/usuarios/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Inativo' })
                    });
                    const updatedUserFromServer = await response.json();
                    state.users = state.users.map(u => u.id === updatedUserFromServer.id ? updatedUserFromServer : u);
                    renderTableUsuarios();
                    showToast('Usuário inativado.', 'success');
                    closeModal();
                } catch (error) {
                    console.error("Erro ao inativar usuário:", error);
                    showToast("Falha ao inativar usuário.", 'error');
                }
            }
        }
    ];
    openModal(modalTitle, modalText, footerButtons);
};


export const initUsuariosPage = () => {
    window.editUser = editUser;
    window.inactivateUser = inactivateUser;

    renderTableUsuarios();

    const userForm = document.getElementById('user-form');
    const clearButton = document.getElementById('clear-button-usuario');
    const searchInput = document.getElementById('search-input-usuario');
    const passwordInput = document.getElementById('senha-usuario');
    const confirmPasswordInput = document.getElementById('repita-senha-usuario');
    const cpfUsuarioInput = document.getElementById('cpf-usuario');

    if (userForm.getAttribute('data-listeners-added') === 'true') {
        return;
    }
    userForm.setAttribute('data-listeners-added', 'true');

    IMask(cpfUsuarioInput, { mask: '000.000.000-00' });
    
    userForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = userForm.querySelector('button[type="submit"]');
        
        if (passwordInput.value !== confirmPasswordInput.value) {
            showToast('As senhas não conferem.', 'error');
            return;
        }

        const validacaoSenha = validarSenha(passwordInput.value);
        if (!validacaoSenha.valido) {
            showToast(validacaoSenha.mensagem, 'error');
            return;
        }

        const cpfValor = document.getElementById('cpf-usuario').value;
        if (!validarCPF(cpfValor)) {
            showToast('O CPF informado é inválido. Por favor, verifique.', 'error');
            return; 
        }

        const newUserData = {
            nome: document.getElementById('nome-usuario').value,
            cpf: cpfValor,
            email: document.getElementById('email-usuario').value,
            usuario: document.getElementById('login-usuario').value,
            senha: passwordInput.value,
            tipoAcesso: document.getElementById('tipo-acesso-usuario').value,
            status: 'Ativo'
        };

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            const response = await fetch(`${API_BASE_URL}/api/usuarios`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newUserData)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao criar usuário.');
            }

            const createdUser = await response.json();

            state.users.unshift(createdUser);
            renderTableUsuarios();
            showToast('Usuário salvo com sucesso!', 'success');
            userForm.reset();
        } catch (error) {
            console.error("Erro ao criar usuário:", error);
            showToast(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });

    clearButton.addEventListener('click', () => userForm.reset());
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = state.users.filter(user => Object.values(user).some(val => String(val).toLowerCase().includes(searchTerm)));
        renderTableUsuarios(filteredData);
    });
};