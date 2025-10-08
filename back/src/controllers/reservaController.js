const { reservations, rooms } = require('../database/mock');
let { nextReservationId } = require('../database/mock');

exports.getAllReservas = (req, res) => {
    res.json(reservations);
};

exports.createReserva = (req, res) => {
    const newReservation = { ...req.body, id: nextReservationId++ };
    reservations.unshift(newReservation);

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

    const originalRes = reservations[resIndex];
    reservations[resIndex] = { ...originalRes, ...updatedData, id: parseInt(id) };

    if (updatedData.status === 'Cancelada') {
        const roomToFree = rooms.find(room => room.numero === originalRes.quarto);
        if (roomToFree) {
            roomToFree.status = 'Disponível';
        }
    }
    
    res.json(reservations[resIndex]);
};