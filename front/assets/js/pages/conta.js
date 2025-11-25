import { state } from '../state.js';
import API_BASE_URL from '../api.js';
import { showToast } from '../toast.js';
import { showPage } from '../ui.js';

export const initContaPage = () => {
    if (!state.loggedInUser) return; 

    // 1. Captura o formulário atual na tela
    const currentForm = document.getElementById('account-form');
    
    // 2. Clona o formulário para remover todos os event listeners antigos
    const newForm = currentForm.cloneNode(true);
    
    // 3. Substitui o formulário antigo pelo novo na página
    currentForm.replaceWith(newForm);

    // 4. AGORA capturamos os elementos de dentro do NOVO formulário (que está na tela)
    const cancelButton = newForm.querySelector('#cancel-account-button');
    const newPassInput = newForm.querySelector('#account-new-password');
    const confirmPassInput = newForm.querySelector('#account-confirm-password');
    const currentPassInput = newForm.querySelector('#account-current-password');
    const nameInput = newForm.querySelector('#account-name');
    const cpfInput = newForm.querySelector('#account-cpf');
    const accessInput = newForm.querySelector('#account-access-type');

    // 5. Preenche os dados estáticos
    nameInput.value = state.loggedInUser.nome;
    cpfInput.value = state.loggedInUser.cpf;
    accessInput.value = state.loggedInUser.tipoAcesso;

    // 6. Define a ação de Cancelar
    const handleCancel = () => {
        // Limpa os campos
        currentPassInput.value = '';
        newPassInput.value = '';
        confirmPassInput.value = '';
        
        // Volta para a Home
        showPage('page-nav-home');
    };

    // 7. Define a ação de Salvar
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
            if (novaSenha.length < 3) {
                showToast('A nova senha deve ter pelo menos 3 caracteres.', 'error');
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
            
            // Limpa os campos após sucesso
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

    // 8. Adiciona os listeners aos elementos do NOVO formulário
    newForm.addEventListener('submit', handleSubmit);
    cancelButton.addEventListener('click', handleCancel);
};