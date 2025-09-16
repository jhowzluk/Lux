import { state } from '../state.js';

export const initContaPage = () => {
    if (!state.loggedInUser) return; // Proteção extra
    document.getElementById('account-name').value = state.loggedInUser.nome;
    document.getElementById('account-cpf').value = state.loggedInUser.cpf;
    document.getElementById('account-access-type').value = state.loggedInUser.tipoAcesso;
    
    const accountForm = document.getElementById('account-form');
    const cancelButton = document.getElementById('cancel-account-button');

    const handleSubmit = (e) => {
        e.preventDefault();
        // Lógica para salvar alterações da conta (principalmente senha)
        alert('Alterações salvas (simulação).');
        document.getElementById('account-current-password').value = '';
        document.getElementById('account-new-password').value = '';
        document.getElementById('account-confirm-password').value = '';
    };

    const handleCancel = () => {
        // Limpa apenas os campos de senha
        document.getElementById('account-current-password').value = '';
        document.getElementById('account-new-password').value = '';
        document.getElementById('account-confirm-password').value = '';
    };

    // Remove event listeners antigos para evitar duplicação
    accountForm.removeEventListener('submit', handleSubmit);
    cancelButton.removeEventListener('click', handleCancel);

    // Adiciona os novos
    accountForm.addEventListener('submit', handleSubmit);
    cancelButton.addEventListener('click', handleCancel);
};