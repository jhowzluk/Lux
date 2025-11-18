const db = require('../database/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const saltRounds = 10;

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: {
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS
    }
});

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const [rows] = await db.query("SELECT * FROM usuarios WHERE usuario = ?", [username]);
        const user = rows[0];

        if (!user) {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }
        if (user.status === 'Inativo') {
            return res.status(401).json({ success: false, message: 'Este usuário está inativo.' });
        }

        const match = await bcrypt.compare(password, user.senha);

        if (match) {
            res.json({
                success: true,
                message: 'Login bem-sucedido!',
                user: {
                    id: user.id,
                    nome: user.nome,
                    cpf: user.cpf,
                    email: user.email,
                    usuario: user.usuario,
                    tipoAcesso: user.tipoAcesso,
                    status: user.status
                }
            });
        } else {
            return res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
        }

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};

exports.recoverPassword = async (req, res) => {
    const { email, cpf } = req.body;

    if (!email || !cpf) {
        return res.status(400).json({ success: false, message: 'Email e CPF são obrigatórios.' });
    }

    try {
        // 1. Validar se o usuário existe com esse Email E esse CPF
        const [rows] = await db.query(
            "SELECT * FROM usuarios WHERE email = ? AND cpf = ?", 
            [email, cpf]
        );
        
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'Dados não conferem com nenhum usuário cadastrado.' });
        }

        // 2. Gerar uma senha temporária (8 caracteres aleatórios)
        const senhaTemporaria = Math.random().toString(36).slice(-8);

        // 3. Criptografar a senha temporária
        const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds);

        // 4. Atualizar no Banco de Dados
        await db.query("UPDATE usuarios SET senha = ? WHERE id = ?", [senhaHash, user.id]);

        // 5. Enviar o Email
        const mailOptions = {
            from: process.env.EMAIL_USER, // Usa o email configurado no .env
            to: email,
            subject: 'Lux Hotel - Recuperação de Senha',
            text: `Olá, ${user.nome}.\n\nSua solicitação de recuperação de senha foi processada.\n\nSua nova senha temporária é: ${senhaTemporaria}\n\nPor favor, faça login e altere sua senha em "Minha Conta".`
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: `Uma nova senha foi enviada para ${email}` });

    } catch (error) {
        console.error("Erro na recuperação:", error);
        res.status(500).json({ success: false, message: 'Erro ao processar recuperação de senha.' });
    }
};