const { users } = require('../database/mock');
let { nextUserId } = require('../database/mock');

const sanitizeUser = (user) => {
    const { senha, ...sanitized } = user;
    return sanitized;
};

exports.getAllUsuarios = (req, res) => {
    res.json(users.map(sanitizeUser));
};

exports.createUsuario = (req, res) => {
    const { email, cpf } = req.body;

    const userExists = users.some(u => u.email === email || u.cpf === cpf);
    if (userExists) {
        return res.status(409).json({ message: 'Usuário com este e-mail ou CPF já existe.' });
    }

    const newUser = { ...req.body, id: nextUserId++ };
    users.unshift(newUser);
    res.status(201).json(sanitizeUser(newUser));
};

exports.updateUsuario = (req, res) => {
    const { id } = req.params;
    const updatedData = req.body;
    const userIndex = users.findIndex(u => u.id == id);

    if (userIndex === -1) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
    }

    const originalUser = users[userIndex];
    users[userIndex] = { ...originalUser, ...updatedData, id: parseInt(id) };
    
    res.json(sanitizeUser(users[userIndex]));
};