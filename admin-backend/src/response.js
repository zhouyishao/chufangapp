export const ok = (data) => ({ code: 0, message: 'OK', data });

export const fail = (code, message) => ({ code, message, data: null });

