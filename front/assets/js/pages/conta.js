import { state } from '../state.js';
import API_BASE_URL from '../api.js';
import { showToast } from '../toast.js';
import { showPage } from '../ui.js';
import { validarSenha } from '../utils.js'; 

export const initContaPage = () => {
    if (!state.loggedInUser) return; 

    const currentForm = document.getElementById('account-form');
    const newForm = currentForm.cloneNode(true);
    currentForm.replaceWith(newForm);

    const cancelButton = newForm.querySelector('#cancel-account-button');
    const newPassInput = newForm.querySelector('#account-new-password');
    const confirmPassInput = newForm.querySelector('#account-confirm-password');
    const currentPassInput = newForm.querySelector('#account-current-password');
    const nameInput = newForm.querySelector('#account-name');
    const cpfInput = newForm.querySelector('#account-cpf');
    const accessInput = newForm.querySelector('#account-access-type');

    nameInput.value = state.loggedInUser.nome;
    cpfInput.value = state.loggedInUser.cpf;
    accessInput.value = state.loggedInUser.tipoAcesso;

    const handleCancel = () => {
        currentPassInput.value = '';
        newPassInput.value = '';
        confirmPassInput.value = '';
        showPage('page-nav-home');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const novaSenha = newPassInput.value;
        const confirmaSenha = confirmPassInput.value;
        const senhaAtual = currentPassInput.value;

        if (!senhaAtual) {
            showToast('Você deve digitar sua senha atual para salvar.', 'error');
            return;
        }

        if (novaSenha || confirmaSenha) {
            if (novaSenha !== confirmaSenha) {
                showToast('A nova senha e a confirmação não conferem.', 'error');
                return;
            }
            
            const validacaoSenha = validarSenha(novaSenha);
            if (!validacaoSenha.valido) {
                showToast(validacaoSenha.mensagem, 'error');
                return;
            }

        } else {
            showToast('Para salvar, preencha a nova senha.', 'info');
            return;
        }

        const submitButton = newForm.querySelector('button[type="submit"]');
        
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            const userId = state.loggedInUser.id;
            const updateData = {
                senha: novaSenha,
                senhaAtual: senhaAtual
            };

            const response = await fetch(`${API_BASE_URL}/api/usuarios/${userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updateData)
            });

            if (!response.ok) {
                const err = await response.json();
                throw new Error(err.message || 'Falha ao atualizar conta.');
            }

            const updatedUser = await response.json();

            state.loggedInUser = updatedUser;
            sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

            const headerName = document.getElementById('username-display');
            if (headerName) {
                headerName.textContent = `Olá, ${updatedUser.nome.split(' ')[0]}`;
            }

            showToast('Senha alterada com sucesso!', 'success');
            
            currentPassInput.value = '';
            newPassInput.value = '';
            confirmPassInput.value = '';

        } catch (error) {
            console.error('Erro ao atualizar conta:', error);
            showToast(error.message, 'error');
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    };

    newForm.addEventListener('submit', handleSubmit);
    cancelButton.addEventListener('click', handleCancel);
};