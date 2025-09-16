import { state } from '../state.js';
import { openModal, closeModal } from '../ui.js';
import { renderTableQuartos } from './renderer.js';
import { nextRoomId } from '../api.js';

let currentNextRoomId = nextRoomId;

const editRoom = (id) => {
    const room = state.rooms.find(r => r.id === id);
    if(!room) return;
    const formNode = document.getElementById('edit-room-template').cloneNode(true);
    formNode.querySelector('#edit-room-id').value = room.id;
    formNode.querySelector('#edit-numero-quarto').value = room.numero;
    formNode.querySelector('#edit-capacidade').value = room.capacidade;
    formNode.querySelector('#edit-valor-diaria-quarto').value = room.valor.toFixed(2);
    formNode.querySelector('#edit-status').value = room.status;
    formNode.querySelector('#edit-observacoes').value = room.obs;
    
    const footerButtons = [
        {text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal},
        {text: 'Salvar Alterações', classes: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600', onClick: () => {
            const updatedRoom = {
                id: parseInt(formNode.querySelector('#edit-room-id').value),
                numero: formNode.querySelector('#edit-numero-quarto').value,
                capacidade: parseInt(formNode.querySelector('#edit-capacidade').value),
                valor: parseFloat(formNode.querySelector('#edit-valor-diaria-quarto').value),
                status: formNode.querySelector('#edit-status').value,
                obs: formNode.querySelector('#edit-observacoes').value,
            };
            state.rooms = state.rooms.map(r => r.id === updatedRoom.id ? updatedRoom : r);
            renderTableQuartos();
            closeModal();
        }}
    ];
    openModal('Editar Quarto', formNode, footerButtons);
};

const deleteRoom = (id) => {
        const footerButtons = [
        {text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal},
        {text: 'Excluir', classes: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600', onClick: () => {
            state.rooms = state.rooms.filter(room => room.id !== id); 
            renderTableQuartos();
            closeModal();
        }}
    ];
    openModal('Confirmar Exclusão', '<p>Tem certeza que deseja excluir este quarto?</p>', footerButtons);
};

export const initQuartosPage = () => {
    window.editRoom = editRoom;
    window.deleteRoom = deleteRoom;

    const roomForm = document.getElementById('room-form');
    const clearButton = document.getElementById('clear-button-quarto');
    const searchInput = document.getElementById('search-input-quarto');
    
    roomForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newRoom = {
            id: currentNextRoomId++,
            numero: document.getElementById('numero-quarto').value,
            capacidade: parseInt(document.getElementById('capacidade').value),
            valor: parseFloat(document.getElementById('valor-diaria-quarto').value),
            status: 'Disponível',
            obs: document.getElementById('observacoes').value
        };
        state.rooms.unshift(newRoom);
        renderTableQuartos();
        roomForm.reset();
    });
    
    clearButton.addEventListener('click', () => roomForm.reset());
    searchInput.addEventListener('input', (e) => { 
        const searchTerm = e.target.value.toLowerCase(); 
        const filteredData = state.rooms.filter(room => Object.values(room).some(val => String(val).toLowerCase().includes(searchTerm)));
        renderTableQuartos(filteredData); 
    });
    renderTableQuartos();
};