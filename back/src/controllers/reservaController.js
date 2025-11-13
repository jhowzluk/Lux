const db = require('../database/db');

// Função de validação de CPF (reaproveitada)
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

exports.getAllReservas = async (req, res) => {
    try {
        // Traz as reservas ordenadas por data de check-in (mais recentes primeiro)
        const [rows] = await db.query("SELECT * FROM reservas ORDER BY checkIn DESC");
        // Mapeia para garantir que o front receba 'quarto' em vez de 'quarto_numero' se necessário,
        // mas o front atual usa 'quarto' e o banco 'quarto_numero'. Vamos ajustar na resposta:
        const reservasFormatadas = rows.map(r => ({
            ...r,
            quarto: r.quarto_numero // Adaptação para o front-end
        }));
        res.json(reservasFormatadas);
    } catch (error) {
        console.error("Erro ao buscar reservas:", error);
        res.status(500).json({ message: 'Erro interno ao buscar reservas.' });
    }
};

exports.createReserva = async (req, res) => {
    const { hospede, cpf, checkIn, checkOut, qtdPessoas, quarto: numeroQuarto, total, telefone, referencia } = req.body;

    // --- Validações Básicas ---
    if (!hospede || !cpf || !checkIn || !checkOut || !qtdPessoas || !numeroQuarto) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }
    if (!validarCPF(cpf)) {
        return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }

    const checkinDate = new Date(checkIn);
    const checkoutDate = new Date(checkOut);
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    if (checkinDate < hoje) {
        return res.status(400).json({ message: 'A data de check-in não pode ser no passado.' });
    }
    if (checkoutDate <= checkinDate) {
        return res.status(400).json({ message: 'A data de check-out deve ser posterior à data de check-in.' });
    }

    try {
        // 1. Validar o Quarto (Existência e Capacidade)
        const [quartoRows] = await db.query("SELECT * FROM quartos WHERE numero = ?", [numeroQuarto]);
        if (quartoRows.length === 0) {
            return res.status(404).json({ message: 'O quarto selecionado não foi encontrado.' });
        }
        const quarto = quartoRows[0];

        if (parseInt(qtdPessoas) > quarto.capacidade) {
            return res.status(400).json({ message: `A quantidade de pessoas excede a capacidade do quarto (máx: ${quarto.capacidade}).` });
        }

        // 2. Validar Disponibilidade (Conflito de Datas)
        // Verifica se já existe uma reserva ATIVA que se sobreponha às datas escolhidas
        const [conflitos] = await db.query(`
            SELECT id FROM reservas 
            WHERE quarto_numero = ? 
            AND status NOT IN ('Cancelada', 'Check-out')
            AND (
                (checkIn <= ? AND checkOut >= ?) OR 
                (checkIn <= ? AND checkOut >= ?) OR
                (checkIn >= ? AND checkOut <= ?)
            )
        `, [numeroQuarto, checkoutDate, checkoutDate, checkinDate, checkinDate, checkinDate, checkoutDate]);

        // A lógica acima cobre: Reserva existente engole a nova, Nova engole a existente, ou intersecção parcial.
        // Simplificando a lógica SQL de sobreposição: (StartA <= EndB) and (EndA >= StartB)
        
        const [conflitosSimples] = await db.query(`
            SELECT id FROM reservas 
            WHERE quarto_numero = ? 
            AND status NOT IN ('Cancelada', 'Check-out')
            AND checkIn < ? AND checkOut > ?
        `, [numeroQuarto, checkoutDate, checkinDate]);


        if (conflitosSimples.length > 0) {
            return res.status(409).json({ message: 'Este quarto já está reservado para o período selecionado.' });
        }

        // 3. Inserir Reserva
        const [result] = await db.query(
            `INSERT INTO reservas 
            (quarto_numero, checkIn, checkOut, hospede, cpf, telefone, qtdPessoas, total, status, referencia) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Confirmada', ?)`,
            [numeroQuarto, checkIn, checkOut, hospede, cpf, telefone, qtdPessoas, total, referencia]
        );

        // 4. Atualizar status do quarto (Regra de Negócio)
        // Se a reserva começa hoje, marcamos como Indisponível
        if (checkinDate.getTime() === hoje.getTime()) {
            await db.query("UPDATE quartos SET status = 'Indisponível' WHERE numero = ?", [numeroQuarto]);
        }

        const novaReserva = {
            id: result.insertId,
            quarto: numeroQuarto, // Front espera 'quarto'
            ...req.body,
            status: 'Confirmada'
        };

        res.status(201).json(novaReserva);

    } catch (error) {
        console.error("Erro ao criar reserva:", error);
        res.status(500).json({ message: 'Erro interno ao criar reserva.' });
    }
};

exports.updateReserva = async (req, res) => {
    const { id } = req.params;
    // Extraímos os campos editáveis. Note que o front envia 'quarto' mas o banco usa 'quarto_numero'.
    const { hospede, cpf, telefone, qtdPessoas, checkIn, checkOut, status, referencia, quarto } = req.body;

    if (cpf && !validarCPF(cpf)) {
         return res.status(400).json({ message: 'O CPF informado é inválido.' });
    }

    try {
        const [reservaAntigaRows] = await db.query("SELECT * FROM reservas WHERE id = ?", [id]);
        if (reservaAntigaRows.length === 0) {
            return res.status(404).json({ message: 'Reserva não encontrada.' });
        }
        const reservaAntiga = reservaAntigaRows[0];

        // Atualiza a reserva
        await db.query(`
            UPDATE reservas 
            SET hospede=?, cpf=?, telefone=?, qtdPessoas=?, checkIn=?, checkOut=?, status=?, referencia=?, quarto_numero=?
            WHERE id=?
        `, [hospede, cpf, telefone, qtdPessoas, checkIn, checkOut, status, referencia, quarto, id]);

        // Lógica de liberação de quarto
        if (status === 'Cancelada' || status === 'Check-out') {
            // Verifica se o quarto deve ficar 'Disponível'
            // Só fica disponível se NÃO houver outra reserva ativa HOJE para o mesmo quarto
            const hoje = new Date().toISOString().split('T')[0];
            
            const [outrasReservas] = await db.query(`
                SELECT id FROM reservas 
                WHERE quarto_numero = ? 
                AND id != ? 
                AND status IN ('Confirmada', 'Check-in')
                AND checkIn <= ? AND checkOut > ?
            `, [quarto, id, hoje, hoje]);

            if (outrasReservas.length === 0) {
                await db.query("UPDATE quartos SET status = 'Disponível' WHERE numero = ?", [quarto]);
            }
        } 
        else if (status === 'Check-in') {
             await db.query("UPDATE quartos SET status = 'Indisponível' WHERE numero = ?", [quarto]);
        }

        // Retorna a reserva atualizada
        const [updatedRows] = await db.query("SELECT * FROM reservas WHERE id = ?", [id]);
        const reservaAtualizada = {
            ...updatedRows[0],
            quarto: updatedRows[0].quarto_numero
        };
        
        res.json(reservaAtualizada);

    } catch (error) {
        console.error("Erro ao atualizar reserva:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar reserva.' });
    }
};