const { rooms } = require('../database/mock');

exports.getAllQuartos = (req, res) => {
    res.json(rooms);
};