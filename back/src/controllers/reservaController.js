const { reservations } = require('../database/mock');

exports.getAllReservas = (req, res) => {
    res.json(reservations);
};