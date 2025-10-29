const { users } = require('../database/mock');
let { nextUserId } = require('../database/mock');

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

const sanitizeUser = (user) => {
    const { senha, ...sanitized } = user;
    return sanitized;
};

exports.getAllUsuarios = (req, res) => {
    res.json(users.map(sanitizeUser));
};

exports.createUsuario = (req, res) => {
    const { email, cpf, nome, usuario, senha } = req.body;

    // --- Início da Validação ---
    if (!nome || !usuario || !senha || !email || !cpf) {
         return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    // VALIDAÇÃO DE CPF ATUALIZADA
    if (!validarCPF(cpf)) {
        return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }
    // --- Fim da Validação ---

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

    // Não permitimos a alteração de CPF ou utilizador (que são lidos como "disabled" no front)
    // Mas validamos os campos que chegam
    if (updatedData.email === '' || updatedData.nome === '') {
         return res.status(400).json({ message: 'Nome e E-mail não podem ficar em branco.' });
    }

    const originalUser = users[userIndex];
    users[userIndex] = { ...originalUser, ...updatedData, id: parseInt(id) };
    
    res.json(sanitizeUser(users[userIndex]));
};