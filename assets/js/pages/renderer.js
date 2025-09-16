import { state } from '../state.js';
import { getStatusBadgeQuarto, getStatusBadgeUsuario } from '../ui.js';

export const renderTableQuartos = (data = state.rooms) => {
    const tableBody = document.getElementById('room-table-body');
    const noResultsMessage = document.getElementById('no-results-quarto');
    if (!tableBody || !noResultsMessage) return;

    tableBody.innerHTML = '';
    noResultsMessage.classList.toggle('hidden', data.length > 0);
    data.forEach(room => {
        const row = document.createElement('tr');
        const isAdmin = state.loggedInUser && state.loggedInUser.tipoAcesso === 'Administrador';
        const actionsHtml = isAdmin 
            ? `<td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><button class="text-indigo-600 hover:text-indigo-900" onclick="window.editRoom(${room.id})" title="Editar"><i data-lucide="edit" class="w-4 h-4"></i></button><button class="text-red-600 hover:text-red-900 ml-4" onclick="window.deleteRoom(${room.id})" title="Excluir"><i data-lucide="trash-2" class="w-4 h-4"></i></button></td>`
            : `<td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"> - </td>`;

        row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${room.numero}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${room.capacidade}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">R$ ${room.valor.toFixed(2).replace('.', ',')}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${getStatusBadgeQuarto(room.status)}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 max-w-xs truncate" title="${room.obs}">${room.obs || '-'}</td>${actionsHtml}`;
        tableBody.appendChild(row);
    });
    lucide.createIcons();
};

export const renderTableUsuarios = (data = state.users) => {
    const tableBody = document.getElementById('user-table-body');
    const noResultsMessage = document.getElementById('no-results-usuario');
    if (!tableBody || !noResultsMessage) return;

    tableBody.innerHTML = '';
    noResultsMessage.classList.toggle('hidden', data.length > 0);
    data.forEach(user => {
        const row = document.createElement('tr');
        const isCurrentUser = state.loggedInUser && user.id === state.loggedInUser.id;
        const inactivateButtonDisabled = user.status === 'Inativo' || isCurrentUser ? 'disabled' : '';
        const inactivateButtonClasses = user.status === 'Inativo' || isCurrentUser ? 'text-gray-300 cursor-not-allowed' : 'text-gray-500 hover:text-red-600';
        row.innerHTML = `<td class="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">${user.nome}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${user.cpf}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${user.usuario}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${user.email}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${user.tipoAcesso}</td><td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">${getStatusBadgeUsuario(user.status)}</td><td class="px-6 py-4 whitespace-nowrap text-center text-sm font-medium"><button class="text-indigo-600 hover:text-indigo-900" onclick="window.editUser(${user.id})" title="Editar"><i data-lucide="edit" class="w-4 h-4"></i></button><button class="${inactivateButtonClasses} ml-4" onclick="window.inactivateUser(${user.id})" title="Inativar" ${inactivateButtonDisabled}><i data-lucide="user-x" class="w-4 h-4"></i></button></td>`;
        tableBody.appendChild(row);
    });
    lucide.createIcons();
};


export function renderAllTables() {
    renderTableQuartos();
    renderTableUsuarios();
}