const { reservations, rooms } = require('../database/mock');
let { nextReservationId } = require('../database/mock');

// FUNÇÃO DE VALIDAÇÃO DE CPF COMPLETA
const validarCPF = (cpf) => {
    if (!cpf) return false;
    const cpfLimpo = cpf.replace(/[^\d]/g, ''); // Remove máscara

    if (cpfLimpo.length !== 11) return false;
    // Elimina CPFs inválidos conhecidos (todos os dígitos iguais)
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;

    let soma = 0;
    let resto;

    // Valida primeiro dígito
    for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;

    soma = 0;
    // Valida segundo dígito
    for (let i = 1; i <= 10; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (12 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(10, 11))) return false;

    return true;
};

exports.getAllReservas = (req, res) => {
    res.json(reservations);
};

exports.createReserva = (req, res) => {
    const { hospede, cpf, checkIn, checkOut, qtdPessoas, quarto: numeroQuarto, total } = req.body;

    // --- Início da Validação no Back-end ---
    if (!hospede || !cpf || !checkIn || !checkOut || !qtdPessoas || !numeroQuarto) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }

    // VALIDAÇÃO DE CPF ATUALIZADA
    if (!validarCPF(cpf)) {
        return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }

    const checkinDate = new Date(checkIn);
    const checkoutDate = new Date(checkOut);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0); // Zera a hora para comparar apenas a data

    if (checkinDate < hoje) {
        return res.status(400).json({ message: 'A data de check-in não pode ser no passado.' });
    }

    if (checkoutDate <= checkinDate) {
        return res.status(400).json({ message: 'A data de check-out deve ser posterior à data de check-in.' });
    }

    const quartoSelecionado = rooms.find(r => r.numero === numeroQuarto);
    if (!quartoSelecionado) {
        return res.status(404).json({ message: 'O quarto selecionado não foi encontrado.' });
    }

    if (parseInt(qtdPessoas, 10) > quartoSelecionado.capacidade) {
        return res.status(400).json({ message: `A quantidade de pessoas excede a capacidade do quarto (máx: ${quartoSelecionado.capacidade}).` });
    }
    
    // Validação de Total (exemplo simples)
    if (parseFloat(total) <= 0) {
         return res.status(400).json({ message: 'O valor total da reserva parece incorreto.' });
    }
    // --- Fim da Validação ---

    const newReservation = { ...req.body, id: nextReservationId++ };
    reservations.unshift(newReservation);

    // Atualiza o status do quarto para indisponível
    const roomToBook = rooms.find(r => r.numero === newReservation.quarto);
    if (roomToBook) {
        roomToBook.status = 'Indisponível';
    }

    res.status(201).json(newReservation);
};

exports.updateReserva = (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const resIndex = reservations.findIndex(r => r.id == id);

    if (resIndex === -1) {
        return res.status(404).json({ message: 'Reserva não encontrada.' });
    }

    // VALIDAÇÃO DE CPF NA ATUALIZAÇÃO
    if (updatedData.cpf && !validarCPF(updatedData.cpf)) {
         return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }

    const originalRes = reservations[resIndex];
    reservations[resIndex] = { ...originalRes, ...updatedData, id: parseInt(id) };

    if (updatedData.status === 'Cancelada' || updatedData.status === 'Check-out') {
        const roomToFree = rooms.find(room => room.numero === originalRes.quarto);
        if (roomToFree) {
            // Verifica se não há outra reserva ativa para o mesmo quarto antes de o libertar
            const isRoomStillBooked = reservations.some(
                r => r.quarto === roomToFree.numero &&
                     r.id !== parseInt(id) &&
                     ['Confirmada', 'Check-in'].includes(r.status)
            );
            if (!isRoomStillBooked) {
                roomToFree.status = 'Disponível';
            }
        }
    }
    
    res.json(reservations[resIndex]);
};