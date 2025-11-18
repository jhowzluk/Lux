import { state } from '../state.js';
import API_BASE_URL from '../api.js';
import { showToast } from '../toast.js';

export const initContaPage = () => {
    if (!state.loggedInUser) return; 

    const oldForm = document.getElementById('account-form');
    const oldCancelBtn = document.getElementById('cancel-account-button');

    const accountForm = oldForm.cloneNode(true);
    oldForm.replaceWith(accountForm);

    const cancelButton = oldCancelBtn.cloneNode(true);
    oldCancelBtn.replaceWith(cancelButton);

    const newPassInput = document.getElementById('account-new-password');
    const confirmPassInput = document.getElementById('account-confirm-password');
    const currentPassInput = document.getElementById('account-current-password');

    document.getElementById('account-name').value = state.loggedInUser.nome;
    document.getElementById('account-cpf').value = state.loggedInUser.cpf;
    document.getElementById('account-access-type').value = state.loggedInUser.tipoAcesso;

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const novaSenha = newPassInput.value;
        const confirmaSenha = confirmPassInput.value;
        const senhaAtual = currentPassInput.value; // <-- CORREÇÃO AQUI

        // --- CORREÇÃO AQUI: Validação da senha atual ---
        if (!senhaAtual) {
            showToast('Você deve digitar sua senha atual para salvar.', 'error');
            return;
        }

        if (novaSenha || confirmaSenha) {
            if (novaSenha !== confirmaSenha) {
                showToast('A nova senha e a confirmação não conferem.', 'error');
                return;
            }
            if (novaSenha.length < 3) {
                showToast('A nova senha deve ter pelo menos 3 caracteres.', 'error');
                return;
            }
        } else {
            showToast('Para salvar, preencha a nova senha.', 'info');
            return;
        }
        // ----------------------------------------------

        const submitButton = accountForm.querySelector('button[type="submit"]');
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            const userId = state.loggedInUser.id;
            const updateData = {
                senha: novaSenha,
                senhaAtual: senhaAtual // <-- CORREÇÃO AQUI
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

    const handleCancel = () => {
        currentPassInput.value = '';
        newPassInput.value = '';
        confirmPassInput.value = '';
    };

    accountForm.addEventListener('submit', handleSubmit);
    cancelButton.addEventListener('click', handleCancel);
};