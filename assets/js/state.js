import { rooms, reservations, users } from './api.js';

export const state = {
    loggedInUser: null,
    rooms: rooms,
    reservations: reservations,
    users: users
};