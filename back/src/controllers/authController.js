const { users } = require('../database/mock'); // Importe os usuários

exports.login = async (req, res) => {
    const { username, password } = req.body;

    // Lógica de busca de usuário nos dados mockados
    const user = users.find(u => u.usuario === username && u.senha === password && u.status === 'Ativo');

    if (user) {
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
        res.status(401).json({ success: false, message: 'Usuário ou senha inválidos.' });
    }
};

exports.recoverPassword = async (req, res) => {
    const { email, cpf } = req.body;
    console.log(`Pedido de recuperação para email: ${email} e CPF: ${cpf}`);
    res.json({ success: true, message: 'Se o usuário existir, um e-mail de recuperação foi enviado.' });
};