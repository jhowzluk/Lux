export function validarCPF(cpf) {
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
}

export function validarSenha(senha) {
    if (senha.length < 8) {
        return { valido: false, mensagem: 'A senha deve ter no mínimo 8 caracteres.' };
    }
    if (!/[a-zA-Z]/.test(senha)) {
        return { valido: false, mensagem: 'A senha deve conter pelo menos uma letra.' };
    }
    if (!/[0-9]/.test(senha)) {
        return { valido: false, mensagem: 'A senha deve conter pelo menos um número.' };
    }
    return { valido: true };
}