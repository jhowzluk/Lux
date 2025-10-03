// --- BANCO DE DADOS (Simulação) ---
let rooms = [
    { id: 1, numero: '101', capacidade: 2, valor: 320.50, status: 'Disponível', obs: 'Vista para o mar' },
    { id: 2, numero: '102', capacidade: 3, valor: 427.00, status: 'Indisponível', obs: 'Adaptado para PCD' },
    { id: 3, numero: '201', capacidade: 2, valor: 350.00, status: 'Disponível', obs: '' },
    { id: 4, numero: '202', capacidade: 4, valor: 562.50, status: 'Indisponível', obs: 'Suíte master com banheira' },
];
let reservations = [
    { id: 202401, quarto: '101', checkIn: '2024-08-10', checkOut: '2024-08-15', hospede: 'Carlos Silva', cpf: '123.456.789-00', telefone: '47999991111', qtdPessoas: 2, total: 1602.50, status: 'Check-out', referencia: 'Website' },
    { id: 202402, quarto: '201', checkIn: '2024-08-12', checkOut: '2024-08-14', hospede: 'Ana Pereira', cpf: '098.765.432-11', telefone: '47999992222', qtdPessoas: 1, total: 700.00, status: 'Cancelada', referencia: 'WhatsApp' },
    { id: 202403, quarto: '102', checkIn: '2024-08-20', checkOut: '2024-08-25', hospede: 'João Mendes', cpf: '111.222.333-44', telefone: '47999993333', qtdPessoas: 3, total: 2135.00, status: 'Check-in', referencia: 'Telefone' },
    { id: 202404, quarto: '202', checkIn: '2024-08-22', checkOut: '2024-08-23', hospede: 'Mariana Costa', cpf: '444.555.666-77', telefone: '47999994444', qtdPessoas: 2, total: 562.50, status: 'Confirmada', referencia: 'Presencial' },
    { id: 202405, quarto: '101', checkIn: '2024-09-01', checkOut: '2024-09-05', hospede: 'Roberto Dias', cpf: '777.888.999-00', telefone: '47999995555', qtdPessoas: 2, total: 1282.00, status: 'Pendente', referencia: 'Website' },
    { id: 202406, quarto: '202', checkIn: '2024-09-15', checkOut: '2024-09-20', hospede: 'Fernanda Lima', cpf: '999.888.777-66', telefone: '47999996666', qtdPessoas: 4, total: 2250.00, status: 'Confirmada', referencia: 'Website' },
    { id: 202407, quarto: '102', checkIn: '2024-10-01', checkOut: '2024-10-05', hospede: 'Lucas Souza', cpf: '222.333.444-55', telefone: '47999997777', qtdPessoas: 2, total: 1282.00, status: 'Confirmada', referencia: 'Telefone' },
];
let users = [
    { id: 1, nome: 'Admin Geral', cpf: '000.000.000-00', email: 'admin@lux.com', usuario: 'admin', senha: 'admin123', tipoAcesso: 'Administrador', status: 'Ativo' },
    { id: 2, nome: 'Beatriz Costa', cpf: '111.222.333-44', email: 'beatriz.costa@lux.com', usuario: 'bcosta', senha: 'bcosta123', tipoAcesso: 'Recepcionista', status: 'Ativo' },
    { id: 3, nome: 'Ricardo Neves', cpf: '555.666.777-88', email: 'ricardo.neves@lux.com', usuario: 'rneves', senha: 'rneves123', tipoAcesso: 'Recepcionista', status: 'Inativo' },
];

let nextRoomId = 5;
let nextReservationId = 202408;
let nextUserId = 4;

module.exports = {
    rooms,
    reservations,
    users,
    nextRoomId,
    nextReservationId,
    nextUserId
};