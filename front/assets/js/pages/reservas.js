import { state } from '../state.js';
import { openModal, closeModal, getStatusBadgeReserva } from '../ui.js';

const renderListReservas = (data = state.reservations) => {
    const reservationList = document.getElementById('reservation-list');
    const noResultsMessage = document.getElementById('no-results-reserva');
    if (!reservationList || !noResultsMessage) return;
    
    reservationList.innerHTML = '';
    noResultsMessage.classList.toggle('hidden', data.length > 0);
    data.forEach(res => {
        const card = document.createElement('div');
        card.className = 'bg-white border border-gray-200 rounded-lg p-4 shadow-sm';
        const cancelDisabled = res.status === 'Cancelada' || res.status === 'Check-out' ? 'disabled' : '';
        const cancelClasses = cancelDisabled ? 'text-gray-300 cursor-not-allowed' : 'text-red-500 hover:text-red-700';

        card.innerHTML = `
            <div class="flex justify-between items-start">
                <div>
                    <p class="font-bold text-lg">Reserva #${res.id} - Quarto ${res.quarto}</p>
                    <p class="text-sm text-gray-600">${res.hospede} - CPF: ${res.cpf}</p>
                </div>
                <div class="flex items-center space-x-3">
                    <button onclick="window.editReservation(${res.id})" title="Editar"><i data-lucide="edit" class="w-4 h-4 text-gray-500 hover:text-indigo-600"></i></button>
                    <button onclick="window.cancelReservation(${res.id})" title="Cancelar Reserva" ${cancelDisabled}><i data-lucide="calendar-x" class="w-4 h-4 ${cancelClasses}"></i></button>
                </div>
            </div>
            <div class="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                <div><p class="font-semibold">Check-in</p><p>${new Date(res.checkIn + 'T03:00:00').toLocaleDateString('pt-BR')}</p></div>
                <div><p class="font-semibold">Check-out</p><p>${new Date(res.checkOut + 'T03:00:00').toLocaleDateString('pt-BR')}</p></div>
                <div><p class="font-semibold">Total</p><p>R$ ${res.total.toFixed(2).replace('.', ',')}</p></div>
                <div><p class="font-semibold">Status</p><p>${getStatusBadgeReserva(res.status)}</p></div>
            </div>`;
        reservationList.appendChild(card);
    });
    lucide.createIcons();
};

const editReservation = (id) => {
    const res = state.reservations.find(r => r.id === id);
    if (!res) return;
    
    const formNode = document.getElementById('edit-reservation-template').cloneNode(true);
    formNode.querySelector('#edit-res-id').value = res.id;
    formNode.querySelector('#edit-res-hospede').value = res.hospede;
    formNode.querySelector('#edit-res-cpf').value = res.cpf;
    formNode.querySelector('#edit-res-telefone').value = res.telefone;
    formNode.querySelector('#edit-res-qtd-pessoas').value = res.qtdPessoas;
    formNode.querySelector('#edit-res-checkin').value = res.checkIn;
    formNode.querySelector('#edit-res-checkout').value = res.checkOut;
    formNode.querySelector('#edit-res-quarto').value = res.quarto;
    formNode.querySelector('#edit-res-referencia').value = res.referencia;
    formNode.querySelector('#edit-res-status').value = res.status;
    
    const footerButtons = [
        { text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        { text: 'Salvar Alterações', classes: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600', onClick: () => {
            const updatedRes = {
                ...res,
                hospede: formNode.querySelector('#edit-res-hospede').value,
                cpf: formNode.querySelector('#edit-res-cpf').value,
                telefone: formNode.querySelector('#edit-res-telefone').value,
                qtdPessoas: parseInt(formNode.querySelector('#edit-res-qtd-pessoas').value),
                checkIn: formNode.querySelector('#edit-res-checkin').value,
                checkOut: formNode.querySelector('#edit-res-checkout').value,
                referencia: formNode.querySelector('#edit-res-referencia').value,
                status: formNode.querySelector('#edit-res-status').value,
            };
            state.reservations = state.reservations.map(r => r.id === updatedRes.id ? updatedRes : r);
            renderListReservas();
            closeModal();
        }}
    ];
    openModal('Editar Reserva', formNode, footerButtons);
};

const cancelReservation = (id) => {
    const res = state.reservations.find(r => r.id === id);
    if (!res || res.status === 'Cancelada' || res.status === 'Check-out') return;
    
    const footerButtons = [
        { text: 'Voltar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        { text: 'Sim, Cancelar', classes: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600', onClick: () => {
            state.reservations = state.reservations.map(r => r.id === id ? { ...r, status: 'Cancelada' } : r);
            const roomToFree = state.rooms.find(room => room.numero === res.quarto);
            if (roomToFree) roomToFree.status = 'Disponível';
            renderListReservas();
            closeModal();
        }}
    ];
    openModal('Confirmar Cancelamento', '<p>Tem certeza que deseja cancelar esta reserva?</p>', footerButtons);
};

export const initReservasPage = () => {
    window.editReservation = editReservation;
    window.cancelReservation = cancelReservation;

    const reservationForm = document.getElementById('reservation-form');
    const clearButton = document.getElementById('clear-button-reserva');
    const searchInput = document.getElementById('search-input-reserva');
    const quartoSelect = document.getElementById('quarto-disponivel');
    const valorDiariaInput = document.getElementById('valor-diaria-reserva');
    const totalReservaInput = document.getElementById('total-reserva');
    const checkinInput = document.getElementById('check-in');
    const checkoutInput = document.getElementById('check-out');

    const updateAvailableRooms = () => {
        quartoSelect.innerHTML = '<option value="">Selecione um quarto</option>';
        state.rooms.filter(r => r.status === 'Disponível').forEach(room => {
            const option = document.createElement('option');
            option.value = room.numero;
            option.textContent = `Quarto ${room.numero} (Cap: ${room.capacidade})`;
            option.dataset.valor = room.valor;
            quartoSelect.appendChild(option);
        });
    };
    
    const calculateTotal = () => {
        const checkinDate = new Date(checkinInput.value);
        const checkoutDate = new Date(checkoutInput.value);
        const selectedOption = quartoSelect.options[quartoSelect.selectedIndex];
        
        if (!selectedOption || !selectedOption.dataset.valor) {
            totalReservaInput.value = 'R$ 0,00';
            return;
        }

        const valorDiaria = parseFloat(selectedOption.dataset.valor);

        if (checkinInput.value && checkoutInput.value && checkoutDate > checkinDate && !isNaN(valorDiaria)) {
            const timeDiff = checkoutDate.getTime() - checkinDate.getTime();
            const diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24));
            const total = diffDays * valorDiaria;
            totalReservaInput.value = `R$ ${total.toFixed(2).replace('.', ',')}`;
        } else {
            totalReservaInput.value = 'R$ 0,00';
        }
    };
    
    quartoSelect.addEventListener('change', () => {
        const selectedOption = quartoSelect.options[quartoSelect.selectedIndex];
        if (selectedOption.value) {
            valorDiariaInput.value = `R$ ${parseFloat(selectedOption.dataset.valor).toFixed(2).replace('.', ',')}`;
        } else {
            valorDiariaInput.value = 'R$ 0,00';
        }
        calculateTotal();
    });

    checkinInput.addEventListener('change', calculateTotal);
    checkoutInput.addEventListener('change', calculateTotal);

    reservationForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const newReservation = {
            id: currentNextReservationId++,
            quarto: quartoSelect.value,
            checkIn: checkinInput.value,
            checkOut: checkoutInput.value,
            hospede: document.getElementById('nome-hospede').value,
            cpf: document.getElementById('cpf').value,
            telefone: document.getElementById('telefone').value,
            qtdPessoas: parseInt(document.getElementById('qtd-pessoas').value),
            total: parseFloat(totalReservaInput.value.replace('R$ ', '').replace(',', '.')),
            status: 'Confirmada',
            referencia: document.getElementById('referencia').value,
        };
        state.reservations.unshift(newReservation);
        const roomToBook = state.rooms.find(r => r.numero === newReservation.quarto);
        if (roomToBook) roomToBook.status = 'Indisponível';
        renderListReservas();
        reservationForm.reset();
        updateAvailableRooms();
        totalReservaInput.value = 'R$ 0,00';
        valorDiariaInput.value = 'R$ 0,00';
    });

    clearButton.addEventListener('click', () => {
        reservationForm.reset();
        updateAvailableRooms();
        totalReservaInput.value = 'R$ 0,00';
        valorDiariaInput.value = 'R$ 0,00';
    });
    searchInput.addEventListener('input', (e) => { 
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = state.reservations.filter(res => res.hospede.toLowerCase().includes(searchTerm) || res.cpf.includes(searchTerm));
        renderListReservas(filteredData);
    });
    updateAvailableRooms();
    renderListReservas();
};