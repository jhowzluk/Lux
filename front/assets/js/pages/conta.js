import { state } from '../state.js';
import API_BASE_URL from '../api.js';

export const initContaPage = () => {
    if (!state.loggedInUser) return; 

    // 1. Limpeza de Listeners (Nuclear Option)
    // Fazemos a substituição do formulário logo no início para garantir um DOM limpo.
    const oldForm = document.getElementById('account-form');
    const oldCancelBtn = document.getElementById('cancel-account-button');

    const accountForm = oldForm.cloneNode(true);
    oldForm.replaceWith(accountForm);

    const cancelButton = oldCancelBtn.cloneNode(true);
    oldCancelBtn.replaceWith(cancelButton);

    // 2. Captura dos Elementos (Agora pegamos os elementos do NOVO formulário)
    const newPassInput = document.getElementById('account-new-password');
    const confirmPassInput = document.getElementById('account-confirm-password');
    const currentPassInput = document.getElementById('account-current-password');

    // 3. Preenchimento dos Dados Estáticos
    document.getElementById('account-name').value = state.loggedInUser.nome;
    document.getElementById('account-cpf').value = state.loggedInUser.cpf;
    document.getElementById('account-access-type').value = state.loggedInUser.tipoAcesso;

    // 4. Definição dos Handlers
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        const novaSenha = newPassInput.value;
        const confirmaSenha = confirmPassInput.value;

        if (novaSenha || confirmaSenha) {
            if (novaSenha !== confirmaSenha) {
                alert('A nova senha e a confirmação não conferem.');
                return;
            }
            if (novaSenha.length < 3) {
                alert('A senha deve ter pelo menos 3 caracteres.');
                return;
            }
        } else {
            alert('Para salvar, preencha a nova senha.');
            return;
        }

        const submitButton = accountForm.querySelector('button[type="submit"]');
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            const userId = state.loggedInUser.id;
            const updateData = {
                senha: novaSenha
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

            // Atualiza estado e sessão
            state.loggedInUser = updatedUser;
            sessionStorage.setItem('loggedInUser', JSON.stringify(updatedUser));

            // Atualiza interface
            const headerName = document.getElementById('username-display');
            if (headerName) {
                headerName.textContent = `Olá, ${updatedUser.nome.split(' ')[0]}`;
            }

            alert('Senha alterada com sucesso!');
            
            // Limpa campos
            currentPassInput.value = '';
            newPassInput.value = '';
            confirmPassInput.value = '';

        } catch (error) {
            console.error('Erro ao atualizar conta:', error);
            alert(error.message);
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

    // 5. Adicionar Listeners aos novos elementos
    accountForm.addEventListener('submit', handleSubmit);
    cancelButton.addEventListener('click', handleCancel);
};