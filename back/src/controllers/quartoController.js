const { rooms } = require('../database/mock');
let { nextRoomId } = require('../database/mock');

exports.getAllQuartos = (req, res) => {
    res.json(rooms);
};

exports.createQuarto = (req, res) => {
    const { numero } = req.body;

    // Garante que a comparação seja sempre feita entre strings
    const numeroAsString = String(numero);
    const roomExists = rooms.some(r => String(r.numero) === numeroAsString);

    if (roomExists) {
        return res.status(409).json({ message: 'Já existe um quarto cadastrado com este número.' });
    }

    // Adiciona o status padrão no back-end para garantir consistência
    const newRoom = { ...req.body, id: nextRoomId++, status: 'Disponível' };
    rooms.unshift(newRoom);
    res.status(201).json(newRoom);
};

exports.updateQuarto = (req, res) => {
    const { id } = req.params;
    const idAsInt = parseInt(id, 10);
    const updatedData = req.body;
    
    // Garante que a comparação seja sempre feita entre strings
    const numeroAsString = String(updatedData.numero);

    // Verifica se OUTRO quarto com o mesmo número já existe
    const roomExists = rooms.some(
        r => String(r.numero) === numeroAsString && r.id !== idAsInt
    );

    if (roomExists) {
        return res.status(409).json({ message: 'Já existe um quarto cadastrado com este número.' });
    }
    
    const roomIndex = rooms.findIndex(r => r.id === idAsInt);

    if (roomIndex === -1) {
        return res.status(404).json({ message: 'Quarto não encontrado.' });
    }

    // Garante que o ID continue sendo um número após a atualização
    rooms[roomIndex] = { ...rooms[roomIndex], ...updatedData, id: idAsInt };
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