const { users } = require('../database/mock');

exports.getAllUsuarios = (req, res) => {
    // Importante: Nunca envie a senha dos usuários para o frontend!
    const usersWithoutPassword = users.map(u => {
        const { senha, ...user } = u;
        return user;
    });
    res.json(usersWithoutPassword);
};