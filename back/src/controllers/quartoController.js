const { rooms } = require('../database/mock');
let { nextRoomId } = require('../database/mock');

exports.getAllQuartos = (req, res) => {
    res.json(rooms);
};

exports.createQuarto = (req, res) => {
    const newRoom = { ...req.body, id: nextRoomId++ };
    rooms.unshift(newRoom);
    res.status(201).json(newRoom);
};

exports.updateQuarto = (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const roomIndex = rooms.findIndex(r => r.id == id);

    if (roomIndex === -1) {
        return res.status(404).json({ message: 'Quarto não encontrado.' });
    }

    rooms[roomIndex] = { ...rooms[roomIndex], ...updatedData, id: parseInt(id) };
    res.json(rooms[roomIndex]);
};

exports.deleteQuarto = (req, res) => {
    const { id } = req.params;
    const roomIndex = rooms.findIndex(r => r.id == id);

    if (roomIndex > -1) {
        rooms.splice(roomIndex, 1);
    }
    
    res.status(204).send();
};