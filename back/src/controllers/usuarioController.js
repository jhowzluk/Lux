const db = require('../database/db'); // Importa a nossa ligação ao DB
const bcrypt = require('bcrypt');

const saltRounds = 10; // Custo do processamento do hash

// (A sua função validarCPF continua igual)
const validarCPF = (cpf) => {
    if (!cpf) return false;
    const cpfLimpo = cpf.replace(/[^\d]/g, '');
    if (cpfLimpo.length !== 11) return false;
    if (/^(\d)\1{10}$/.test(cpfLimpo)) return false;
    let soma = 0;
    let resto;
    for (let i = 1; i <= 9; i++) soma += parseInt(cpfLimpo.substring(i - 1, i)) * (11 - i);
    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== parseInt(cpfLimpo.substring(9, 10))) return false;
    soma = 0;
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

exports.getAllUsuarios = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM usuarios ORDER BY id DESC");
        res.json(rows.map(sanitizeUser));
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        res.status(500).json({ message: 'Erro interno ao buscar usuários.' });
    }
};

exports.createUsuario = async (req, res) => {
    const { email, cpf, nome, usuario, senha, tipoAcesso } = req.body;

    // --- Validação ---
    if (!nome || !usuario || !senha || !email || !cpf) {
         return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    if (!validarCPF(cpf)) {
        return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }

    try {
        // --- Verificação de Duplicados ---
        const [existing] = await db.query(
            "SELECT * FROM usuarios WHERE email = ? OR cpf = ? OR usuario = ?", 
            [email, cpf, usuario]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Usuário com este e-mail, CPF ou nome de utilizador já existe.' });
        }

        // --- Criptografar Senha ---
        const senhaHash = await bcrypt.hash(senha, saltRounds);

        // --- Inserir no Banco ---
        const [result] = await db.query(
            "INSERT INTO usuarios (nome, cpf, email, usuario, senha, tipoAcesso, status) VALUES (?, ?, ?, ?, ?, ?, 'Ativo')",
            [nome, cpf, email, usuario, senhaHash, tipoAcesso]
        );

        const newUser = {
            id: result.insertId,
            ...req.body,
            status: 'Ativo'
        };
        
        res.status(201).json(sanitizeUser(newUser));

    } catch (error) {
        console.error("Erro ao criar usuário:", error);
        res.status(500).json({ message: 'Erro interno ao criar usuário.' });
    }
};

exports.updateUsuario = async (req, res) => {
    const { id } = req.params;
    const { nome, email, tipoAcesso, status } = req.body; // Apenas os campos que permitimos editar

    if (email === '' || nome === '') {
         return res.status(400).json({ message: 'Nome e E-mail não podem ficar em branco.' });
    }

    try {
        // Verifica se o e-mail já está em uso por OUTRO utilizador
        const [existing] = await db.query(
            "SELECT * FROM usuarios WHERE email = ? AND id != ?",
            [email, id]
        );
        if(existing.length > 0) {
            return res.status(409).json({ message: 'Este e-mail já está em uso por outro utilizador.' });
        }
        
        // Atualiza o utilizador
        await db.query(
            "UPDATE usuarios SET nome = ?, email = ?, tipoAcesso = ?, status = ? WHERE id = ?",
            [nome, email, tipoAcesso, status, id]
        );
        
        // Devolve o utilizador atualizado
        const [updatedRows] = await db.query("SELECT * FROM usuarios WHERE id = ?", [id]);
        if (updatedRows.length === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado após atualização.' });
        }
        
        res.json(sanitizeUser(updatedRows[0]));
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar usuário.' });
    }
};