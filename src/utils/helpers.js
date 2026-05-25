export function randomRange(min, max) {
    return min + Math.random() * (max - min);
}

export function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

export function lerp(start, end, amount) {
    return start + (end - start) * amount;
}