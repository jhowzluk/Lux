export function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = 'toast';

    // Aplica a classe de estilo baseada no tipo (success, error, info)
    if (type === 'success') {
        toast.classList.add('toast-success');
    } else if (type === 'error') {
        toast.classList.add('toast-error');
    } else {
        toast.classList.add('toast-info');
    }

    toast.textContent = message;
    container.appendChild(toast);

    // Remove o toast depois que a animação de fade-out (3s + 0.3s) terminar
    setTimeout(() => {
        toast.remove();
    }, 3300); 
}