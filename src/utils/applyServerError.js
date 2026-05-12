

const FIELD_RULES = [
    { regex: /УНП|ИНН/i, field: 'unp' },
    { regex: /наименовани/i, field: 'name' },
    { regex: /штрих-код|штрих\s*коду|barcode/i, field: 'barcode' },
    { regex: /SKU/i, field: 'sku' },
    { regex: /e-?mail|почт/i, field: 'email' },
];

export function applyServerError(err, setError, allowedFields) {
    if (!err || err.status !== 409 || !err.message || !setError) return false;
    const allow = Array.isArray(allowedFields) ? new Set(allowedFields) : null;
    for (const { regex, field } of FIELD_RULES) {
        if (allow && !allow.has(field)) continue;
        if (regex.test(err.message)) {
            setError(field, { type: 'server', message: err.message });
            return true;
        }
    }
    return false;
}

export default applyServerError;
