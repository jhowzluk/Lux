import { state } from '../state.js';
import { openModal, closeModal } from '../ui.js';
import { renderTableQuartos } from './renderer.js';
import API_BASE_URL from '../api.js';

const editRoom = (id) => {
    const room = state.rooms.find(r => r.id === id);
    if (!room) return;
    const formNode = document.getElementById('edit-room-template').cloneNode(true);
    formNode.querySelector('#edit-room-id').value = room.id;
    formNode.querySelector('#edit-numero-quarto').value = room.numero;
    formNode.querySelector('#edit-capacidade').value = room.capacidade;
    // CORREÇÃO AQUI: parseFloat(room.valor)
    formNode.querySelector('#edit-valor-diaria-quarto').value = parseFloat(room.valor).toFixed(2);
    formNode.querySelector('#edit-status').value = room.status;
    formNode.querySelector('#edit-observacoes').value = room.obs;

    const footerButtons = [
        { text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        {
            text: 'Salvar Alterações', classes: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600', onClick: async () => {
                const updatedRoomData = {
                    numero: formNode.querySelector('#edit-numero-quarto').value,
                    capacidade: parseInt(formNode.querySelector('#edit-capacidade').value),
                    valor: parseFloat(formNode.querySelector('#edit-valor-diaria-quarto').value),
                    status: formNode.querySelector('#edit-status').value,
                    obs: formNode.querySelector('#edit-observacoes').value,
                };
                try {
                    const response = await fetch(`${API_BASE_URL}/api/quartos/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedRoomData)
                    });
                    const updatedRoomFromServer = await response.json();
                    state.rooms = state.rooms.map(r => r.id === updatedRoomFromServer.id ? updatedRoomFromServer : r);
                    renderTableQuartos();
                    closeModal();
                } catch (error) {
                    console.error("Erro ao atualizar quarto:", error);
                    alert("Falha ao atualizar quarto.");
                }
            }
        }
    ];
    openModal('Editar Quarto', formNode, footerButtons);
};

const deleteRoom = (id) => {
    const footerButtons = [
        { text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        {
            text: 'Excluir', classes: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600', onClick: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/quartos/${id}`, {
                        method: 'DELETE'
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao excluir quarto');
                    }

                    state.rooms = state.rooms.filter(room => room.id !== id);
                    renderTableQuartos();
                    closeModal();
                } catch (error) {
                    console.error("Erro ao excluir quarto:", error);
                    alert(error.message || "Falha ao excluir quarto.");
                }
            }
        }
    ];
    openModal('Confirmar Exclusão', '<p>Tem certeza que deseja excluir este quarto?</p>', footerButtons);
};

export const initQuartosPage = () => {
    window.editRoom = editRoom;
    window.deleteRoom = deleteRoom;

    renderTableQuartos();

    const roomForm = document.getElementById('room-form');
    const clearButton = document.getElementById('clear-button-quarto');
    const searchInput = document.getElementById('search-input-quarto');

    if (roomForm.getAttribute('data-listeners-added') === 'true') {
        return;
    }
    roomForm.setAttribute('data-listeners-added', 'true');

    roomForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = roomForm.querySelector('button[type="submit"]');
    
        const newRoomData = {
            numero: document.getElementById('numero-quarto').value,
            capacidade: parseInt(document.getElementById('capacidade').value),
            valor: parseFloat(document.getElementById('valor-diaria-quarto').value),
            obs: document.getElementById('observacoes').value
        };
    
        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';
    
            const response = await fetch(`${API_BASE_URL}/api/quartos`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newRoomData)
            });
    
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message);
            }
    
            const createdRoom = await response.json();
            state.rooms.unshift(createdRoom);
            renderTableQuartos();
            roomForm.reset();
        } catch (error) {
            console.error("Erro ao criar quarto:", error);
            alert(error.message || "Falha ao criar novo quarto.");
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });

    clearButton.addEventListener('click', () => roomForm.reset());
    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = state.rooms.filter(room => Object.values(room).some(val => String(val).toLowerCase().includes(searchTerm)));
        renderTableQuartos(filteredData);
    });
};