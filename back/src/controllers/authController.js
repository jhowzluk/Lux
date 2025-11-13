const db = require('../database/db'); // Importa a nossa ligação ao DB
const bcrypt = require('bcrypt');

exports.login = async (req, res) => {
    const { username, password } = req.body;

    if (!username || !password) {
        return res.status(400).json({ success: false, message: 'Utilizador e senha são obrigatórios.' });
    }

    try {
        // 1. Encontrar o utilizador no banco
        const [rows] = await db.query(
            "SELECT * FROM usuarios WHERE usuario = ?", 
            [username]
        );
        
        const user = rows[0];

        // 2. Verificar se o utilizador existe
        if (!user) {
            return res.status(401).json({ success: false, message: 'Utilizador ou senha inválidos.' });
        }

        // 3. Verificar se o utilizador está ativo
        if (user.status === 'Inativo') {
            return res.status(401).json({ success: false, message: 'Este utilizador está inativo.' });
        }

        // 4. Comparar a senha enviada com o hash guardado no banco
        const match = await bcrypt.compare(password, user.senha);

        if (match) {
            // Senha correta!
            res.json({
                success: true,
                message: 'Login bem-sucedido!',
                user: { // Retorne apenas os dados necessários para o front
                    id: user.id,
                    nome: user.nome,
                    cpf: user.cpf,
                    email: user.email,
                    usuario: user.usuario,
                    tipoAcesso: user.tipoAcesso,
                    status: user.status
                    // Não envie a senha!
                }
            });
        } else {
            // Senha incorreta
            return res.status(401).json({ success: false, message: 'Utilizador ou senha inválidos.' });
        }

    } catch (error) {
        console.error("Erro no login:", error);
        res.status(500).json({ success: false, message: 'Erro interno do servidor.' });
    }
};

exports.recoverPassword = async (req, res) => {
    // A lógica de recuperação de senha pode ser mantida como simulação por agora
    const { email, cpf } = req.body;
    console.log(`Pedido de recuperação para email: ${email} e CPF: ${cpf}`);
    res.json({ success: true, message: 'Se o utilizador existir, um e-mail de recuperação foi enviado.' });
};