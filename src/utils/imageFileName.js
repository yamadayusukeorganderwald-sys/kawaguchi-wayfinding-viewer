export function createImageFileName(type, id) {
    const normalizedId = String(id)
        .replace(new RegExp(`^${type}-`), "")
        .replace(/[^a-zA-Z0-9_-]/g, "");

    return `${type}-${normalizedId}.jpg`;
}