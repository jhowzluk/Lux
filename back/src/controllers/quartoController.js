const db = require('../database/db');

exports.getAllQuartos = async (req, res) => {
    try {
        const [rows] = await db.query("SELECT * FROM quartos ORDER BY numero ASC");
        res.json(rows);
    } catch (error) {
        console.error("Erro ao buscar quartos:", error);
        res.status(500).json({ message: 'Erro interno ao buscar quartos.' });
    }
};

// --- NOVA FUNÇÃO ADICIONADA ---
exports.getQuartosDisponiveis = async (req, res) => {
    const { checkIn, checkOut, capacidade } = req.query;

    if (!checkIn || !checkOut || !capacidade) {
        return res.status(400).json({ message: 'Datas e capacidade são obrigatórios.' });
    }

    try {
        // Esta é a consulta principal. Ela seleciona quartos que:
        // 1. Têm a capacidade necessária.
        // 2. Têm o status 'Disponível' (para manutenção, etc.).
        // 3. E (o mais importante) NÃO ESTÃO (NOT IN) na lista de quartos que já possuem
        //    uma reserva conflitante no período selecionado.
        const [rows] = await db.query(
            `
            SELECT * FROM quartos
            WHERE 
                capacidade >= ? 
                AND status = 'Disponível'
                AND numero NOT IN (
                    SELECT DISTINCT quarto_numero FROM reservas
                    WHERE 
                        status NOT IN ('Cancelada', 'Check-out')
                        AND checkIn < ? 
                        AND checkOut > ?
                )
            ORDER BY numero ASC
            `,
            [capacidade, checkOut, checkIn] // Note a ordem: checkOut, checkIn
        );
        
        res.json(rows);

    } catch (error) {
        console.error("Erro ao filtrar quartos disponíveis:", error);
        res.status(500).json({ message: 'Erro interno ao filtrar quartos.' });
    }
};
// --- FIM DA NOVA FUNÇÃO ---

exports.createQuarto = async (req, res) => {
    const { numero, capacidade, valor, obs } = req.body;

    if (!numero || !capacidade || !valor) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }
    if (parseInt(capacidade) < 1 || parseFloat(valor) <= 0) {
        return res.status(400).json({ message: 'Capacidade e valor devem ser positivos.' });
    }

    try {
        const [existing] = await db.query("SELECT * FROM quartos WHERE numero = ?", [numero]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Já existe um quarto com este número.' });
        }

        const [result] = await db.query(
            "INSERT INTO quartos (numero, capacidade, valor, status, obs) VALUES (?, ?, ?, 'Disponível', ?)",
            [numero, capacidade, valor, obs]
        );

        const newRoom = { id: result.insertId, ...req.body, status: 'Disponível' };
        res.status(201).json(newRoom);

    } catch (error) {
        console.error("Erro ao criar quarto:", error);
        res.status(500).json({ message: 'Erro interno ao criar quarto.' });
    }
};

exports.updateQuarto = async (req, res) => {
    const { id } = req.params;
    const { numero, capacidade, valor, status, obs } = req.body;

    try {
        const [existing] = await db.query(
            "SELECT * FROM quartos WHERE numero = ? AND id != ?", 
            [numero, id]
        );
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Já existe outro quarto com este número.' });
        }

        const [result] = await db.query(
            "UPDATE quartos SET numero = ?, capacidade = ?, valor = ?, status = ?, obs = ? WHERE id = ?",
            [numero, capacidade, valor, status, obs, id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Quarto não encontrado.' });
        }

        const [updatedRows] = await db.query("SELECT * FROM quartos WHERE id = ?", [id]);
        res.json(updatedRows[0]);

    } catch (error) {
        console.error("Erro ao atualizar quarto:", error);
        res.status(500).json({ message: 'Erro interno ao atualizar quarto.' });
    }
};

exports.deleteQuarto = async (req, res) => {
    const { id } = req.params;

    try {
        const [roomRows] = await db.query("SELECT numero FROM quartos WHERE id = ?", [id]);
        
        if (roomRows.length === 0) {
            return res.status(404).json({ message: 'Quarto não encontrado.' });
        }

        const numeroQuarto = roomRows[0].numero;

        const [reservations] = await db.query("SELECT id FROM reservas WHERE quarto_numero = ?", [numeroQuarto]);
        
        if (reservations.length > 0) {
            return res.status(400).json({ 
                message: 'Não é possível excluir este quarto pois ele possui histórico de reservas. Tente inativá-lo ou alterar seu status.' 
            });
        }

        await db.query("DELETE FROM quartos WHERE id = ?", [id]);
        res.status(204).send();

    } catch (error) {
        console.error("Erro ao excluir quarto:", error);
        res.status(500).json({ message: 'Erro interno ao excluir quarto.' });
    }
};