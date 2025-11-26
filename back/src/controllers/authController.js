const db = require('../database/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

const saltRounds = 10;

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true,
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
        const [rows] = await db.query(
            "SELECT * FROM usuarios WHERE email = ? AND cpf = ?", 
            [email, cpf]
        );
        
        const user = rows[0];

        if (!user) {
            return res.status(404).json({ success: false, message: 'Dados não conferem com nenhum usuário cadastrado.' });
        }

        const senhaTemporaria = Math.random().toString(36).slice(-8);
        const senhaHash = await bcrypt.hash(senhaTemporaria, saltRounds);

        await db.query("UPDATE usuarios SET senha = ? WHERE id = ?", [senhaHash, user.id]);

        // --- TEMPLATE DE E-MAIL EM HTML ---
        const htmlTemplate = `
        <!DOCTYPE html>
        <html>
        <head>
            <style>
                body { font-family: 'Arial', sans-serif; background-color: #f4f4f4; margin: 0; padding: 0; }
                .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); overflow: hidden; }
                .header { background-color: #FFC72C; padding: 30px; text-align: center; }
                .header h1 { margin: 0; color: #333; font-size: 28px; letter-spacing: 1px; }
                .content { padding: 40px 30px; color: #555; line-height: 1.6; }
                .password-box { background-color: #f8f9fa; border: 2px dashed #FFC72C; border-radius: 6px; padding: 15px; text-align: center; font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333; margin: 25px 0; }
                .footer { background-color: #333; color: #aaa; text-align: center; padding: 20px; font-size: 12px; }
                .btn { display: inline-block; background-color: #333; color: #FFC72C; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin-top: 20px; }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="header">
                    <h1>LUX</h1>
                </div>
                <div class="content">
                    <p>Olá, <strong>${user.nome}</strong>,</p>
                    <p>Recebemos uma solicitação para redefinir a senha da sua conta no sistema Lux.</p>
                    <p>Aqui está a sua nova senha temporária:</p>
                    
                    <div class="password-box">${senhaTemporaria}</div>
                    
                    <p>Utilize esta senha para entrar no sistema agora. Por segurança, recomendamos que você <strong>altere esta senha</strong> imediatamente acessando o menu "Minha Conta".</p>
                    
                    <div style="text-align: center;">
                        <a href="https://lux-system.vercel.app/" class="btn">Acessar Sistema</a>
                    </div>
                </div>
                <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Lux. Todos os direitos reservados.</p>
                    <p>Este é um e-mail automático, por favor não responda.</p>
                </div>
            </div>
        </body>
        </html>
        `;

        const mailOptions = {
            from: `"Lux" <${process.env.EMAIL_USER}>`, // Nome personalizado + email
            to: email,
            subject: '🔐 Recuperação de Senha - Lux',
            html: htmlTemplate, // Agora usamos HTML em vez de text
            text: `Olá ${user.nome}, sua nova senha temporária é: ${senhaTemporaria}` // Fallback para clientes sem HTML
        };

        await transporter.sendMail(mailOptions);

        res.json({ success: true, message: `Uma nova senha foi enviada para ${email}` });

    } catch (error) {
        console.error("Erro na recuperação:", error);
        res.status(500).json({ success: false, message: 'Erro ao processar recuperação de senha.' });
    }
};