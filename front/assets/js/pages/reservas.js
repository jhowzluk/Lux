import { state } from '../state.js';
import { openModal, closeModal, getStatusBadgeReserva } from '../ui.js';
import API_BASE_URL from '../api.js';
import { validarCPF } from '../utils.js';
import { showToast } from '../toast.js';

// Esta função agora busca quartos dinamicamente da API
export const fetchEAtualizarQuartosDisponiveis = async () => {
    const checkIn = document.getElementById('check-in').value;
    const checkOut = document.getElementById('check-out').value;
    const capacidade = document.getElementById('qtd-pessoas').value;
    const quartoSelect = document.getElementById('quarto-disponivel');

    if (!quartoSelect) return; // Sai se a página de reservas não estiver ativa

    // Se os campos não estiverem preenchidos, limpa o combo box
    if (!checkIn || !checkOut || !capacidade || (new Date(checkOut) <= new Date(checkIn))) {
        quartoSelect.innerHTML = '<option value="">Preencha datas e pessoas</option>';
        quartoSelect.disabled = true;
        return;
    }

    try {
        quartoSelect.innerHTML = '<option value="">A procurar quartos...</option>';
        quartoSelect.disabled = true;

        const response = await fetch(`${API_BASE_URL}/api/quartos/disponiveis?checkIn=${checkIn}&checkOut=${checkOut}&capacidade=${capacidade}`);
        if (!response.ok) throw new Error('Erro ao buscar quartos.');
        
        const quartos = await response.json();
        
        quartoSelect.innerHTML = ''; // Limpa o "A procurar..."
        if (quartos.length === 0) {
            quartoSelect.innerHTML = '<option value="">Nenhum quarto disponível</option>';
        } else {
            quartoSelect.innerHTML = '<option value="">Selecione um quarto</option>';
            quartos.forEach(room => {
                const option = document.createElement('option');
                option.value = room.numero;
                option.textContent = `Quarto ${room.numero} (Cap: ${room.capacidade}, R$ ${room.valor})`;
                option.dataset.valor = room.valor;
                quartoSelect.appendChild(option);
            });
        }

        quartoSelect.disabled = false;
        
    } catch (error) {
        console.error("Erro ao buscar quartos disponíveis:", error);
        showToast("Erro ao filtrar quartos.", 'error');
        quartoSelect.innerHTML = '<option value="">Erro ao filtrar</option>';
    }
};

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

        const parseDate = (dateString) => {
            if (dateString.includes('T')) {
                return new Date(dateString);
            }
            return new Date(dateString + 'T03:00:00');
        };
        
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
                <div><p class="font-semibold">Check-in</p><p>${parseDate(res.checkIn).toLocaleDateString('pt-BR')}</p></div>
                <div><p class="font-semibold">Check-out</p><p>${parseDate(res.checkOut).toLocaleDateString('pt-BR')}</p></div>
                <div><p class="font-semibold">Total</p><p>R$ ${parseFloat(res.total).toFixed(2).replace('.', ',')}</p></div>
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
    formNode.querySelector('#edit-res-hospede').value = res.hospede;
    formNode.querySelector('#edit-res-cpf').value = res.cpf;
    formNode.querySelector('#edit-res-telefone').value = res.telefone;
    formNode.querySelector('#edit-res-qtd-pessoas').value = res.qtdPessoas;
    
    const safeDate = (dateStr) => dateStr ? dateStr.split('T')[0] : '';
    formNode.querySelector('#edit-res-checkin').value = safeDate(res.checkIn);
    formNode.querySelector('#edit-res-checkout').value = safeDate(res.checkOut);

    formNode.querySelector('#edit-res-quarto').value = res.quarto;
    formNode.querySelector('#edit-res-referencia').value = res.referencia;
    formNode.querySelector('#edit-res-status').value = res.status;

    IMask(formNode.querySelector('#edit-res-cpf'), { mask: '000.000.000-00' });
    IMask(formNode.querySelector('#edit-res-telefone'), { mask: '(00) 00000-0000' });

    const footerButtons = [
        { text: 'Cancelar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        {
            text: 'Salvar Alterações', classes: 'px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600', onClick: async () => {
                const cpfValor = formNode.querySelector('#edit-res-cpf').value;
                if (!validarCPF(cpfValor)) {
                    showToast('O CPF informado é inválido. Por favor, verifique.', 'error');
                    return;
                }
                const updatedResData = {
                    hospede: formNode.querySelector('#edit-res-hospede').value,
                    cpf: cpfValor,
                    telefone: formNode.querySelector('#edit-res-telefone').value,
                    qtdPessoas: parseInt(formNode.querySelector('#edit-res-qtd-pessoas').value),
                    checkIn: formNode.querySelector('#edit-res-checkin').value,
                    checkOut: formNode.querySelector('#edit-res-checkout').value,
                    referencia: formNode.querySelector('#edit-res-referencia').value,
                    status: formNode.querySelector('#edit-res-status').value,
                    quarto: formNode.querySelector('#edit-res-quarto').value, 
                };
                try {
                    const response = await fetch(`${API_BASE_URL}/api/reservas/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify(updatedResData)
                    });
                    
                    if (!response.ok) {
                        const errorData = await response.json();
                        throw new Error(errorData.message || 'Erro ao atualizar');
                    }

                    const updatedResFromServer = await response.json();
                    state.reservations = state.reservations.map(r => r.id === updatedResFromServer.id ? updatedResFromServer : r);
                    
                    renderListReservas();
                    fetchEAtualizarQuartosDisponiveis();
                    showToast('Reserva atualizada com sucesso!', 'success');
                    closeModal();
                } catch (error) {
                    console.error("Erro ao atualizar reserva:", error);
                    showToast(error.message || "Falha ao atualizar reserva.", 'error');
                }
            }
        }
    ];
    openModal('Editar Reserva', formNode, footerButtons);
};

const cancelReservation = (id) => {
    const res = state.reservations.find(r => r.id === id);
    if (!res || res.status === 'Cancelada' || res.status === 'Check-out') return;
    const footerButtons = [
        { text: 'Voltar', classes: 'px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300', onClick: closeModal },
        {
            text: 'Sim, Cancelar', classes: 'px-4 py-2 bg-red-500 text-white rounded-md hover:bg-red-600', onClick: async () => {
                try {
                    const response = await fetch(`${API_BASE_URL}/api/reservas/${id}`, {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ status: 'Cancelada' })
                    });
                    const updatedResFromServer = await response.json();
                    state.reservations = state.reservations.map(r => r.id === updatedResFromServer.id ? updatedResFromServer : r);
                    
                    const roomToFree = state.rooms.find(room => room.numero === res.quarto);
                    if (roomToFree) roomToFree.status = 'Disponível';

                    renderListReservas();
                    fetchEAtualizarQuartosDisponiveis();
                    showToast('Reserva cancelada.', 'success');
                    closeModal();
                } catch (error) {
                    console.error("Erro ao cancelar reserva:", error);
                    showToast("Falha ao cancelar reserva.", 'error');
                }
            }
        }
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
    const cpfInput = document.getElementById('cpf');
    const telefoneInput = document.getElementById('telefone');
    const qtdPessoasInput = document.getElementById('qtd-pessoas'); // Pega o campo de pessoas

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

    // Inicializa a lista de reservas
    renderListReservas();
    // Limpa o combo box (ele será preenchido pelos event listeners)
    quartoSelect.innerHTML = '<option value="">Preencha datas e pessoas</option>';
    quartoSelect.disabled = true;

    if (reservationForm.getAttribute('data-listeners-added') === 'true') {
        return;
    }
    reservationForm.setAttribute('data-listeners-added', 'true');

    IMask(cpfInput, { mask: '000.000.000-00' });
    IMask(telefoneInput, { mask: '(00) 00000-0000' });

    const hoje = new Date().toISOString().split('T')[0];
    checkinInput.setAttribute('min', hoje);
    checkoutInput.disabled = true;

    // --- NOVOS EVENT LISTENERS DINÂMICOS ---
    checkinInput.addEventListener('change', () => {
        if (checkinInput.value) {
            checkoutInput.disabled = false;
            checkoutInput.setAttribute('min', checkinInput.value);
        } else {
            checkoutInput.disabled = true;
            checkoutInput.value = '';
        }
        fetchEAtualizarQuartosDisponiveis(); // Atualiza quartos
        calculateTotal();
    });
    
    checkoutInput.addEventListener('change', () => {
        fetchEAtualizarQuartosDisponiveis(); // Atualiza quartos
        calculateTotal();
    });

    qtdPessoasInput.addEventListener('change', fetchEAtualizarQuartosDisponiveis); // Atualiza quartos
    // ----------------------------------------

    quartoSelect.addEventListener('change', () => {
        const selectedOption = quartoSelect.options[quartoSelect.selectedIndex];
        if (selectedOption && selectedOption.dataset.valor) {
            valorDiariaInput.value = `R$ ${parseFloat(selectedOption.dataset.valor).toFixed(2).replace('.', ',')}`;
        } else {
            valorDiariaInput.value = 'R$ 0,00';
        }
        calculateTotal();
    });
    
    reservationForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const submitButton = reservationForm.querySelector('button[type="submit"]');

        const cpfValor = document.getElementById('cpf').value;
        if (!validarCPF(cpfValor)) {
            showToast('O CPF informado é inválido. Por favor, verifique.', 'error');
            return; 
        }
        
        if (!quartoSelect.value) {
            showToast('Nenhum quarto disponível ou selecionado.', 'error');
            return;
        }

        const newReservationData = {
            quarto: quartoSelect.value,
            checkIn: checkinInput.value,
            checkOut: checkoutInput.value,
            hospede: document.getElementById('nome-hospede').value,
            cpf: cpfValor,
            telefone: document.getElementById('telefone').value,
            qtdPessoas: parseInt(document.getElementById('qtd-pessoas').value),
            total: parseFloat(totalReservaInput.value.replace('R$ ', '').replace(',', '.')),
            status: 'Confirmada',
            referencia: document.getElementById('referencia').value,
        };

        try {
            submitButton.disabled = true;
            submitButton.textContent = 'Salvando...';

            const response = await fetch(`${API_BASE_URL}/api/reservas`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(newReservationData)
            });
             if (!response.ok) { 
                const errorData = await response.json();
                throw new Error(errorData.message || 'Falha ao criar reserva.');
            }
            const createdReservation = await response.json();
            state.reservations.unshift(createdReservation);
            
            // Atualiza o status local do quarto (otimização)
            const roomToBook = state.rooms.find(r => r.numero === createdReservation.quarto);
            if (roomToBook) roomToBook.status = 'Indisponível';
            
            renderListReservas();
            reservationForm.reset();
            fetchEAtualizarQuartosDisponiveis(); // Atualiza a lista após criar a reserva
            totalReservaInput.value = 'R$ 0,00';
            valorDiariaInput.value = 'R$ 0,00';
            checkoutInput.disabled = true; 
            showToast('Reserva criada com sucesso!', 'success');
        } catch (error) {
            console.error("Erro ao criar reserva:", error);
            showToast(error.message, 'error'); 
        } finally {
            submitButton.disabled = false;
            submitButton.textContent = 'Salvar';
        }
    });

    clearButton.addEventListener('click', () => {
        reservationForm.reset();
        quartoSelect.innerHTML = '<option value="">Preencha datas e pessoas</option>';
        quartoSelect.disabled = true;
        totalReservaInput.value = 'R$ 0,00';
        valorDiariaInput.value = 'R$ 0,00';
        checkoutInput.disabled = true;
    });

    searchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filteredData = state.reservations.filter(res => res.hospede.toLowerCase().includes(searchTerm) || res.cpf.includes(searchTerm));
        renderListReservas(filteredData);
    });
};