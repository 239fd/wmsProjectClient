

let notifyFn = null;
let lastNetworkErrorAt = 0;

export const registerNotify = (fn) => {
    notifyFn = fn || null;
};

export const notify = (message, severity = 'success', options = {}) => {
    if (notifyFn) notifyFn(message, severity, options);
};

export const notifyNetworkError = (message = 'Соединение потеряно. Изменения сохранены локально.') => {
    const now = Date.now();
    if (now - lastNetworkErrorAt < 5000) return;
    lastNetworkErrorAt = now;
    notify(message, 'warning', { duration: 5000 });
};
