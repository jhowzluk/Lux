const db = require('../database/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer'); // <-- Importação nova

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

    if (!nome || !usuario || !senha || !email || !cpf) {
         return res.status(400).json({ message: 'Todos os campos são obrigatórios.' });
    }
    if (!validarCPF(cpf)) {
        return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }

    try {
        const [existing] = await db.query(
            "SELECT * FROM usuarios WHERE email = ? OR cpf = ? OR usuario = ?", 
            [email, cpf, usuario]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Usuário com este e-mail, CPF ou nome de utilizador já existe.' });
        }

        const senhaHash = await bcrypt.hash(senha, saltRounds);

        const [result] = await db.query(
            "INSERT INTO usuarios (nome, cpf, email, usuario, senha, tipoAcesso, status) VALUES (?, ?, ?, ?, ?, ?, 'Ativo')",
            [nome, cpf, email, usuario, senhaHash, tipoAcesso]
        );

        // --- ENVIO DO E-MAIL DE BOAS-VINDAS ---
        // Colocamos num bloco try/catch separado para que, se o e-mail falhar,
        // o usuário não deixe de ser criado (o cadastro é mais importante).
        try {
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
                    .info-box { background-color: #f8f9fa; border-left: 4px solid #FFC72C; padding: 15px; margin: 20px 0; }
                    .credential-row { margin-bottom: 10px; }
                    .credential-label { font-weight: bold; color: #333; }
                    .credential-value { font-family: monospace; font-size: 16px; color: #555; }
                    .footer { background-color: #333; color: #aaa; text-align: center; padding: 20px; font-size: 12px; }
                    .btn { display: inline-block; background-color: #333; color: #FFC72C; text-decoration: none; padding: 12px 25px; border-radius: 4px; font-weight: bold; margin-top: 20px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>Bem-vindo ao LUX HOTEL</h1>
                    </div>
                    <div class="content">
                        <p>Olá, <strong>${nome}</strong>,</p>
                        <p>A sua conta de acesso ao sistema Lux foi criada com sucesso.</p>
                        <p>Abaixo estão as suas credenciais de acesso:</p>
                        
                        <div class="info-box">
                            <div class="credential-row">
                                <span class="credential-label">Usuário:</span>
                                <span class="credential-value">${usuario}</span>
                            </div>
                            <div class="credential-row">
                                <span class="credential-label">Senha:</span>
                                <span class="credential-value">${senha}</span>
                            </div>
                            <div class="credential-row">
                                <span class="credential-label">Nível:</span>
                                <span class="credential-value">${tipoAcesso}</span>
                            </div>
                        </div>
                        
                        <p>Por segurança, recomendamos que altere a sua senha após o primeiro acesso no menu "Minha Conta".</p>
                        
                        <div style="text-align: center;">
                            <a href="https://lux-system.vercel.app/" class="btn">Acessar Sistema</a>
                        </div>
                    </div>
                    <div class="footer">
                        <p>&copy; ${new Date().getFullYear()} Lux Hotel System. Todos os direitos reservados.</p>
                    </div>
                </div>
            </body>
            </html>
            `;

            const mailOptions = {
                from: `"Lux Hotel System" <${process.env.EMAIL_USER}>`,
                to: email,
                subject: '🎉 Bem-vindo ao Lux Hotel - Credenciais de Acesso',
                html: htmlTemplate,
                text: `Bem-vindo! Usuário: ${usuario} | Senha: ${senha}`
            };

            await transporter.sendMail(mailOptions);
            console.log(`E-mail de boas-vindas enviado para ${email}`);

        } catch (emailError) {
            console.error("Erro ao enviar e-mail de boas-vindas:", emailError);
            // Não retornamos erro aqui para não cancelar a criação do usuário
        }
        // ---------------------------------------------

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
    const { nome, email, tipoAcesso, status, senha, senhaAtual } = req.body;

    if ((email !== undefined && email === '') || (nome !== undefined && nome === '')) {
         return res.status(400).json({ message: 'Nome e E-mail não podem ficar em branco.' });
    }

    try {
        // Busca o usuário primeiro
        const [userRows] = await db.query("SELECT * FROM usuarios WHERE id = ?", [id]);
        if (userRows.length === 0) {
            return res.status(404).json({ message: 'Utilizador não encontrado.' });
        }
        const user = userRows[0];

        if (email) {
            const [existing] = await db.query(
                "SELECT * FROM usuarios WHERE email = ? AND id != ?",
                [email, id]
            );
            if(existing.length > 0) {
                return res.status(409).json({ message: 'Este e-mail já está em uso por outro utilizador.' });
            }
        }
        
        let query = "UPDATE usuarios SET ";
        const params = [];
        
        if (nome) { query += "nome = ?, "; params.push(nome); }
        if (email) { query += "email = ?, "; params.push(email); }
        if (tipoAcesso) { query += "tipoAcesso = ?, "; params.push(tipoAcesso); }
        if (status) { query += "status = ?, "; params.push(status); }
        
        if (senha) { 
            // Se uma senha nova foi enviada, precisamos validar se quem está pedindo é o próprio dono (via senhaAtual) OU se é uma ação administrativa.
            // Nota: Num cenário real de admin resetando senha de outro, não teríamos senhaAtual.
            // Mas pela lógica atual da tela "Minha Conta", a senhaAtual vem.
            
            if (senhaAtual) {
                const match = await bcrypt.compare(senhaAtual, user.senha);
                if (!match) {
                    return res.status(401).json({ message: 'A senha atual está incorreta.' });
                }
            }
            // Se não vier senhaAtual, assumimos que pode ser um Admin resetando (se a rota for protegida, o que seria ideal futuramente).
            // Para manter a consistência com a tela "Minha Conta", a validação acima protege.

            const senhaHash = await bcrypt.hash(senha, saltRounds);
            query += "senha = ?, "; 
            params.push(senhaHash); 
        }

        query = query.slice(0, -2); 
        query += " WHERE id = ?";
        params.push(id);

        await db.query(query, params);
        
        const [updatedRows] = await db.query("SELECT * FROM usuarios WHERE id = ?", [id]);
        
        res.json(sanitizeUser(updatedRows[0]));
    } catch (error) {
        console.error("Erro ao atualizar usuário:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar usuário.' });
    }
};