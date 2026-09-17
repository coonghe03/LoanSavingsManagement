const generateId = (prefix, count) => {
    const year = new Date().getFullYear();
    const padded = String(count + 1).padStart(4, '0');
    return `${prefix}-${year}-${padded}`;
};

module.exports = generateId;