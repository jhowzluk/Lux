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

exports.createQuarto = async (req, res) => {
    const { numero, capacidade, valor, obs } = req.body;

    if (!numero || !capacidade || !valor) {
        return res.status(400).json({ message: 'Todos os campos obrigatórios devem ser preenchidos.' });
    }
    if (parseInt(capacidade) < 1 || parseFloat(valor) <= 0) {
        return res.status(400).json({ message: 'Capacidade e valor devem ser positivos.' });
    }

    try {
        // Verifica duplicidade
        const [existing] = await db.query("SELECT * FROM quartos WHERE numero = ?", [numero]);
        if (existing.length > 0) {
            return res.status(409).json({ message: 'Já existe um quarto com este número.' });
        }

        // Insere no banco
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
        // Verifica duplicidade de número com outros quartos
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

        // Retorna o quarto atualizado
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
        // Primeiro, precisamos saber o número do quarto para verificar as reservas
        const [roomRows] = await db.query("SELECT numero FROM quartos WHERE id = ?", [id]);
        
        if (roomRows.length === 0) {
            return res.status(404).json({ message: 'Quarto não encontrado.' });
        }

        const numeroQuarto = roomRows[0].numero;

        // Verifica se há reservas associadas a este quarto
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